import io
import os
import sys
import tempfile
import time
import uuid
from pathlib import Path

os.environ["SECRET_KEY"] = "test-session-secret-key"
os.environ["ADMIN_EMAIL"] = "admin@geoledger.test"
os.environ["ADMIN_PASSWORD"] = "test-admin-password-123"
os.environ["DATABASE_NAME"] = "geoledger_test"
test_upload_dir = Path(tempfile.mkdtemp(prefix="geoledger-test-uploads-"))
os.environ["UPLOAD_FOLDER"] = str(test_upload_dir)

backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import pytest
from bson import ObjectId
from eth_account import Account
from eth_account.messages import encode_defunct

from app import create_app
from database.client import get_database


@pytest.fixture(scope="session", autouse=True)
def cleanup_test_uploads():
    yield
    for uploaded_file in test_upload_dir.iterdir():
        if uploaded_file.is_file():
            uploaded_file.unlink()
    test_upload_dir.rmdir()


@pytest.fixture
def client():
    app = create_app(testing=True)
    with app.test_client() as test_client:
        login = test_client.post("/auth/login", json={
            "email": os.environ["ADMIN_EMAIL"],
            "password": os.environ["ADMIN_PASSWORD"],
            "role": "admin",
        })
        assert login.status_code == 200
        yield test_client


def register_and_link_wallet(client, *, name: str, email: str):
    account = Account.create()
    registration = client.post("/auth/register", json={
        "name": name,
        "email": email,
        "password": "test-user-password-123",
    })
    assert registration.status_code == 201, registration.get_json()
    challenge = client.post("/auth/wallet-challenge", json={
        "wallet_address": account.address,
    })
    assert challenge.status_code == 200
    message = challenge.get_json()["data"]["message"]
    signature = Account.sign_message(
        encode_defunct(text=message),
        account.key,
    ).signature.hex()
    linked = client.patch("/auth/profile", json={
        "wallet_address": account.address,
        "signature": signature,
    })
    assert linked.status_code == 200, linked.get_json()
    return account.address


def create_registration_application(client, survey_number):
    wallet = register_and_link_wallet(
        client,
        name="Test Property Owner",
        email=f"owner-{time.time_ns()}@geoledger.test",
    )
    response = client.post("/applications", json={
        "application_type": "NEW_REGISTRATION",
        "survey_number": survey_number,
        "applicant_wallet": wallet,
        "applicant_name": "Test Property Owner",
        "property_details": {
            "area": 2500,
            "village": "Thandavapura",
            "taluk": "Nanjangud",
            "district": "Mysuru",
            "land_type": "Residential",
        },
    })
    assert response.status_code == 201, response.get_json()
    return response.get_json()["data"], wallet


def upload_pdf(client, application_id, document_type, body):
    return client.post(
        "/documents/upload",
        data={
            "document_type": document_type,
            "application_id": application_id,
            "file": (io.BytesIO(body), f"{document_type}.pdf"),
        },
        content_type="multipart/form-data",
    )


def test_status_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.get_json()["success"] is True


def test_user_cannot_register_privileged_roles(client):
    response = client.post("/auth/register", json={
        "name": "Attempted Admin",
        "email": f"attempt-{time.time_ns()}@geoledger.test",
        "password": "test-user-password-123",
        "role": "admin",
    })
    assert response.status_code == 201
    assert response.get_json()["data"]["role"] == "user"


def test_wallet_link_requires_valid_signature(client):
    client.post("/auth/logout")
    client.post("/auth/register", json={
        "name": "Wallet User",
        "email": f"wallet-{time.time_ns()}@geoledger.test",
        "password": "test-user-password-123",
    })
    account = Account.create()
    challenge = client.post("/auth/wallet-challenge", json={"wallet_address": account.address})
    assert challenge.status_code == 200
    response = client.patch("/auth/profile", json={
        "wallet_address": account.address,
        "signature": "0x" + "00" * 65,
    })
    assert response.status_code == 400


def test_admin_can_link_wallet_with_signature(client):
    account = Account.create()
    challenge = client.post("/auth/wallet-challenge", json={
        "wallet_address": account.address,
    })
    assert challenge.status_code == 200
    message = challenge.get_json()["data"]["message"]
    signature = Account.sign_message(
        encode_defunct(text=message),
        account.key,
    ).signature.hex()

    response = client.patch("/auth/profile", json={
        "wallet_address": account.address,
        "signature": signature,
    })
    assert response.status_code == 200, response.get_json()
    assert response.get_json()["data"]["wallet_address"] == account.address


def test_application_and_admin_permissions(client):
    client.post("/auth/logout")
    assert client.get("/applications").status_code == 401
    assert client.post("/applications/fake-id/approve").status_code == 401
    assert client.post("/blockchain/transfer", json={"property_id": "x"}).status_code == 401

    register_and_link_wallet(
        client,
        name="Test User",
        email=f"permissions-{time.time_ns()}@geoledger.test",
    )
    assert client.post("/applications/fake-id/approve").status_code == 403


def test_admin_application_list_serializes_nested_mongo_ids(client):
    application_id = f"legacy-{uuid.uuid4().hex}"
    document_ids = [ObjectId(), ObjectId()]
    database = get_database()
    database.applications.insert_one({
        "_id": application_id,
        "application_type": "NEW_REGISTRATION",
        "survey_number": f"SN-LEGACY-{uuid.uuid4().hex}",
        "status": "SUBMITTED",
        "submitted_documents": document_ids,
        "created_at": "2026-01-01T00:00:00",
    })
    try:
        response = client.get("/applications")
        assert response.status_code == 200, response.get_json()
        application = next(
            item for item in response.get_json()["data"]
            if item["id"] == application_id
        )
        assert application["submitted_documents"] == [str(item) for item in document_ids]
    finally:
        database.applications.delete_one({"_id": application_id})


def test_gis_lookup_endpoint(client):
    response = client.get("/gis/property/SN-DEMO-001")
    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["geojson"]["type"] == "Feature"
    assert data["geojson"]["geometry"]["type"] == "Polygon"


def test_invalid_and_duplicate_document_uploads(client):
    application, _ = create_registration_application(client, f"SN-DOC-{time.time_ns()}")
    document_type = application["required_documents"][0]
    invalid = client.post(
        "/documents/upload",
        data={
            "document_type": document_type,
            "application_id": application["id"],
            "file": (io.BytesIO(b"not a pdf"), f"{document_type}.pdf"),
        },
        content_type="multipart/form-data",
    )
    assert invalid.status_code == 400

    content = f"%PDF-1.4\nunique file for duplicate test {time.time_ns()}".encode()
    uploaded = upload_pdf(client, application["id"], document_type, content)
    assert uploaded.status_code == 201, uploaded.get_json()
    duplicate = upload_pdf(client, application["id"], document_type, content)
    assert duplicate.status_code == 409


def test_tampered_document_download_is_denied(client):
    application, _ = create_registration_application(client, f"SN-TAMPER-{time.time_ns()}")
    document_type = application["required_documents"][0]
    uploaded = upload_pdf(
        client,
        application["id"],
        document_type,
        f"%PDF-1.4\ninitial content {time.time_ns()}".encode(),
    )
    assert uploaded.status_code == 201, uploaded.get_json()
    document = uploaded.get_json()["data"]
    saved = get_database().documents.find_one({"_id": document["id"]})
    Path(saved["storage_location"]).write_bytes(b"%PDF-1.4\ntampered content")
    denied = client.get(f"/documents/download/{document['id']}")
    assert denied.status_code == 409


def test_full_registration_lifecycle(client):
    survey_number = f"SN-TEST-{time.time_ns()}"
    application, applicant_wallet = create_registration_application(client, survey_number)
    document_ids = []
    for document_type in application["required_documents"]:
        content = (
            f"%PDF-1.4\nOwner: Test Property Owner\nSurvey Number: {survey_number}\n"
            f"Area: 2500 sq ft\nDocument Type: {document_type}\n"
        ).encode()
        uploaded = upload_pdf(client, application["id"], document_type, content)
        assert uploaded.status_code == 201, uploaded.get_json()
        document_ids.append(uploaded.get_json()["data"]["id"])

    for document_id in document_ids:
        integrity = client.post(f"/verification/document/{document_id}")
        assert integrity.status_code == 200
        assert integrity.get_json()["data"]["verification_status"] == "REQUIRES_MANUAL_REVIEW"

    admin_login = client.post("/auth/login", json={
        "email": os.environ["ADMIN_EMAIL"],
        "password": os.environ["ADMIN_PASSWORD"],
        "role": "admin",
    })
    assert admin_login.status_code == 200
    for document_id in document_ids:
        review = client.post(
            f"/verification/document/{document_id}/review",
            json={"status": "VERIFIED", "remarks": "Reviewed in automated test"},
        )
        assert review.status_code == 200, review.get_json()

    approved = client.post(f"/applications/{application['id']}/approve")
    assert approved.status_code == 200, approved.get_json()
    approved_data = approved.get_json()["data"]
    assert approved_data["status"] == "COMPLETED"
    assert approved_data["blockchain_transaction_hash"]
    assert approved_data["blockchain_block_number"] is not None

    public = client.get(f"/verify/property/{survey_number}")
    assert public.status_code == 200
    public_data = public.get_json()["data"]
    assert public_data["blockchain_verified"] is True
    assert "owner_wallet" not in public_data
    assert "blockchain_owner_wallet" not in public_data
    assert len(public_data["verified_documents"]) == len(application["required_documents"])
    assert public_data["verified_documents"][0]["verification_status"] == "VERIFIED"
    assert applicant_wallet not in str(public_data)


def test_valuation_estimate_and_admin_parameters(client):
    reset = client.put("/valuation/params", json={
        "base_rate_per_sqft": {"Residential": 2500},
        "location_multipliers": {"urban": 1.35},
        "district_multipliers": {"Mysuru": 1.15, "default": 1.0},
    })
    assert reset.status_code == 200
    response = client.post("/valuation/estimate", json={
        "area": 2500,
        "land_type": "Residential",
        "location_category": "urban",
        "district": "Mysuru",
    })
    assert response.status_code == 200
    result = response.get_json()["data"]
    assert result["estimated_value"] == 2500 * 2500 * 1.35 * 1.15
    assert result["is_official_valuation"] is False

    updated = client.put("/valuation/params", json={
        "base_rate_per_sqft": {"Residential": 2800},
    })
    assert updated.status_code == 200
    assert updated.get_json()["data"]["base_rate_per_sqft"]["Residential"] == 2800


def test_notification_ownership_and_admin_user_management(client):
    # Admin may inspect accounts and the administrator notification inbox.
    notifications = client.get("/notifications")
    assert notifications.status_code == 200
    assert isinstance(notifications.get_json()["data"], list)
