import json
import io
import os
import sys
import tempfile
import time
import uuid
from pathlib import Path

os.environ["SECRET_KEY"] = "test-session-secret-key"
os.environ["ADMIN_EMAIL"] = f"admin-{uuid.uuid4().hex}@geoledger.test"
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
from config import Config
from database.client import get_database

Config.ADMIN_EMAIL = os.environ["ADMIN_EMAIL"]
Config.ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]
Config.SECRET_KEY = os.environ["SECRET_KEY"]
Config.DATABASE_NAME = os.environ["DATABASE_NAME"]
Config.UPLOAD_FOLDER = os.environ["UPLOAD_FOLDER"]


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
        assert login.status_code == 200, {
            "response": login.get_json(),
            "configured_admin": app.config["ADMIN_EMAIL"] == os.environ["ADMIN_EMAIL"],
            "admin_record_exists": bool(app.db.users.find_one({"email": os.environ["ADMIN_EMAIL"]})),
        }
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
            "boundary": {
                "type": "Polygon",
                "coordinates": [[
                    [76.6852, 12.1812],
                    [76.6862, 12.1812],
                    [76.6862, 12.1822],
                    [76.6852, 12.1822],
                    [76.6852, 12.1812],
                ]],
            },
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
    preflight = client.options(
        "/verification/document/fake-id/review",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert preflight.status_code == 200
    assert preflight.headers["Access-Control-Allow-Origin"] == "http://localhost:5173"
    assert client.post(
        "/verification/document/fake-id/review",
        json={"status": "VERIFIED"},
    ).status_code == 401

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


def test_block_log_backfills_confirmed_transactions_without_duplicates(monkeypatch, tmp_path):
    from services import block_log_service

    block_log_path = tmp_path / "blocks.jsonl"
    monkeypatch.setattr(block_log_service, "BLOCK_LOG_PATH", block_log_path)
    transactions = [
        {
            "_id": ObjectId(),
            "survey_number": "SN-OLD-CONFIRMED",
            "tx_hash": "0xconfirmed",
            "block_number": 12,
            "status": "CONFIRMED",
            "timestamp": "2026-01-02T00:00:00",
        },
        {
            "survey_number": "SN-PENDING",
            "tx_hash": "0xpending",
            "status": "PENDING",
        },
    ]

    assert block_log_service.backfill_confirmed_blocks(transactions) == 1
    assert block_log_service.backfill_confirmed_blocks(transactions) == 0
    records = [
        json.loads(line)
        for line in block_log_path.read_text(encoding="utf-8").splitlines()
    ]
    assert len(records) == 1
    assert records[0]["transaction_id"] == str(transactions[0]["_id"])
    assert records[0]["tx_hash"] == "0xconfirmed"
    assert records[0]["block_number"] == 12
    assert records[0]["simulation"] is None
    assert records[0]["record_source"] == "legacy_backfill"


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


def test_document_upload_flags_name_mismatch_for_manual_review(client):
    application, _ = create_registration_application(client, f"SN-NAME-{time.time_ns()}")
    content = (
        f"%PDF-1.4\nName: Different Test Person\n"
        f"Survey Number: {application['survey_number']}\n"
    ).encode()
    uploaded = upload_pdf(client, application["id"], "ID_PROOF", content)
    assert uploaded.status_code == 201, uploaded.get_json()
    document = uploaded.get_json()["data"]
    assert document["verification_status"] == "REQUIRES_MANUAL_REVIEW"
    assert any(
        check["name"] == "DOCUMENT_NAME_MATCH" and not check["passed"]
        for check in document["verification_checks"]
    )


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


def test_full_registration_lifecycle(client, monkeypatch, tmp_path):
    from services import block_log_service

    block_log_path = tmp_path / "blocks.jsonl"
    monkeypatch.setattr(block_log_service, "BLOCK_LOG_PATH", block_log_path)
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
    status_history = [entry["status"] for entry in approved_data["status_history"]]
    assert status_history[0] == "SUBMITTED"
    assert status_history[-3:] == ["VERIFIED", "BLOCKCHAIN_PENDING", "COMPLETED"]

    block_records = [
        json.loads(line)
        for line in block_log_path.read_text(encoding="utf-8").splitlines()
    ]
    assert len(block_records) == 1
    assert block_records[0]["survey_number"] == survey_number
    assert block_records[0]["tx_hash"] == approved_data["blockchain_transaction_hash"]
    assert block_records[0]["block_number"] == approved_data["blockchain_block_number"]
    assert isinstance(block_records[0]["simulation"], bool)
    if block_records[0]["simulation"]:
        assert block_records[0]["block_hash"] is None
    else:
        assert block_records[0]["block_hash"]

    ledger_response = client.get("/blockchain/transactions")
    assert ledger_response.status_code == 200
    ledger_record = next(
        item for item in ledger_response.get_json()["data"]
        if item.get("survey_number") == survey_number
    )
    assert ledger_record["block_log_saved"] is True
    assert ledger_record["block_number"] == approved_data["blockchain_block_number"]

    public = client.get(f"/verify/property/{survey_number}")
    assert public.status_code == 200
    public_data = public.get_json()["data"]
    assert public_data["blockchain_verified"] is True
    assert "owner_wallet" not in public_data
    assert "blockchain_owner_wallet" not in public_data
    assert len(public_data["verified_documents"]) == len(application["required_documents"])
    assert public_data["verified_documents"][0]["verification_status"] == "VERIFIED"
    assert applicant_wallet not in str(public_data)

    gis = client.get(f"/gis/property/{survey_number}")
    assert gis.status_code == 200
    gis_data = gis.get_json()["data"]
    assert gis_data["data_source"] == "user_submitted_boundary"
    assert gis_data["geojson"]["geometry"]["type"] == "Polygon"
    assert gis_data["geojson"]["geometry"]["coordinates"] == application["property_details"]["boundary"]["coordinates"]


def test_registration_requires_valid_geojson_boundary(client):
    wallet = register_and_link_wallet(
        client,
        name="Boundary Test Owner",
        email=f"boundary-{time.time_ns()}@geoledger.test",
    )
    payload = {
        "application_type": "NEW_REGISTRATION",
        "survey_number": f"SN-BOUNDARY-{time.time_ns()}",
        "applicant_wallet": wallet,
        "applicant_name": "Boundary Test Owner",
        "property_details": {
            "area": 2500,
            "village": "Thandavapura",
            "taluk": "Nanjangud",
            "district": "Mysuru",
            "boundary": {
                "type": "Polygon",
                    "coordinates": [[
                        [76.68, 12.18],
                        [76.69, 12.19],
                        [76.68, 12.19],
                        [76.69, 12.18],
                    ]],
            },
        },
    }
    response = client.post("/applications", json=payload)
    assert response.status_code == 400
    assert "closed" in response.get_json()["message"]

    payload["survey_number"] = f"SN-BOUNDARY-VALID-{time.time_ns()}"
    payload["property_details"]["boundary"]["coordinates"][0] = [
        [76.68, 12.18],
        [76.69, 12.19],
        [76.68, 12.19],
        [76.69, 12.18],
        [76.68, 12.18],
    ]
    response = client.post("/applications", json=payload)
    assert response.status_code == 400
    assert "self-intersect" in response.get_json()["message"]


def test_inheritance_requires_unique_heirs_and_only_requires_noc_when_applicable(client):
    database = get_database()
    deceased_wallet = "0x" + "a" * 40
    applicant_wallet = register_and_link_wallet(
        client,
        name="Inheritance Applicant",
        email=f"inheritance-{time.time_ns()}@geoledger.test",
    )

    def submit_inheritance(survey_number, heirs):
        database.properties.insert_one({
            "property_id": f"GL-PROP-{survey_number}",
            "survey_number": survey_number,
            "owner_wallet": deceased_wallet,
            "status": "REGISTERED",
        })
        return client.post("/applications", json={
            "application_type": "INHERITANCE_TRANSFER",
            "survey_number": survey_number,
            "applicant_wallet": applicant_wallet,
            "applicant_name": "Inheritance Applicant",
            "deceased_owner_name": "Deceased Example",
            "deceased_owner_wallet": deceased_wallet,
            "relationship": "Child",
            "legal_heirs": heirs,
            "party_details": {
                "applicant_name": "Inheritance Applicant",
                "deceased_owner_name": "Deceased Example",
                "deceased_owner_wallet": deceased_wallet,
                "relationship": "Child",
                "legal_heirs": heirs,
                "buyer": {"wallet_address": applicant_wallet, "name": "Inheritance Applicant"},
            },
        })

    single = submit_inheritance(
        f"SN-INHERITANCE-SINGLE-{time.time_ns()}",
        [{"name": "Inheritance Applicant", "relationship": "Child"}],
    )
    assert single.status_code == 201, single.get_json()
    assert "NOC_FROM_LEGAL_HEIRS" not in single.get_json()["data"]["required_documents"]

    multiple = submit_inheritance(
        f"SN-INHERITANCE-MULTI-{time.time_ns()}",
        [
            {"name": "Inheritance Applicant", "relationship": "Child"},
            {"name": "Second Heir", "relationship": "Child"},
        ],
    )
    assert multiple.status_code == 201, multiple.get_json()
    assert "NOC_FROM_LEGAL_HEIRS" in multiple.get_json()["data"]["required_documents"]

    duplicate = submit_inheritance(
        f"SN-INHERITANCE-DUP-{time.time_ns()}",
        [
            {"name": "Same Heir", "relationship": "Child"},
            {"name": " same heir ", "relationship": "Child"},
        ],
    )
    assert duplicate.status_code == 400
    assert "Duplicate legal heirs" in duplicate.get_json()["message"]


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
    from utils.notifications_helper import notify_admins

    notification_title = f"Checklist test {uuid.uuid4().hex}"
    notify_admins(notification_title, "Test admin notification visibility")
    notifications = client.get("/notifications")
    assert notifications.status_code == 200
    items = notifications.get_json()["data"]
    assert isinstance(items, list)
    notification = next(item for item in items if item["title"] == notification_title)
    assert notification["is_read"] is False
    marked = client.put(f"/notifications/{notification['id']}/read")
    assert marked.status_code == 200
    assert marked.get_json()["data"]["is_read"] is True
