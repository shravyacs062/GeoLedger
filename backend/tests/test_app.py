import os
import sys
import io
import time
import uuid
from pathlib import Path

os.environ["SECRET_KEY"] = "test-session-secret-key"
os.environ["ADMIN_EMAIL"] = "admin@geoledger.test"
os.environ["ADMIN_PASSWORD"] = "test-admin-password-123"

# Ensure backend root is always in Python module search path
backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import pytest
from eth_account import Account
from eth_account.messages import encode_defunct
from app import create_app
from database.client import get_database


@pytest.fixture
def client():
    os.environ["DEBUG"] = "False"
    app = create_app(testing=True)
    app.config["TESTING"] = True
    with app.test_client() as client:
<<<<<<< Updated upstream
        # Ensure seed accounts exist
        from services.auth_service import AuthService
        with app.app_context():
            AuthService().ensure_seed_accounts()
        yield client


def _login(client, email, password, admin=False):
    path = "/auth/admin/login" if admin else "/auth/login"
    res = client.post(path, json={"email": email, "password": password})
    assert res.status_code == 200, res.get_json()
    token = res.get_json()["data"]["token"]
    return {"Authorization": f"Bearer {token}"}
=======
        response = client.post("/auth/login", json={
            "email": os.environ["ADMIN_EMAIL"],
            "password": os.environ["ADMIN_PASSWORD"],
            "role": "admin",
        })
        assert response.status_code == 200
        yield client


def register_and_link_wallet(client, *, name: str, email: str):
    account = Account.create()
    registration = client.post("/auth/register", json={
        "name": name,
        "email": email,
        "password": "test-user-password-123",
    })
    assert registration.status_code == 201
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
    assert linked.status_code == 200
    return account.address
>>>>>>> Stashed changes


def test_status_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    payload = response.get_json()
    assert payload["success"] is True
    assert "GeoLedger backend is running" in payload["message"]


def test_admin_and_user_login(client):
    user_headers = _login(client, "user@geoledger.local", "User@12345")
    admin_headers = _login(client, "admin@geoledger.local", "Admin@12345", admin=True)
    assert "Authorization" in user_headers
    assert "Authorization" in admin_headers

    # User cannot use admin portal
    bad = client.post("/auth/admin/login", json={
        "email": "user@geoledger.local",
        "password": "User@12345",
    })
    assert bad.status_code == 403


def test_property_routes_return_json(client):
    headers = _login(client, "user@geoledger.local", "User@12345")
    response = client.get("/properties", headers=headers)
    assert response.status_code == 200
    assert response.is_json


def test_authentication_and_role_permissions(client):
    client.post("/auth/logout")
    assert client.get("/applications").status_code == 401
    assert client.post("/blockchain/transfer", json={"property_id": "x", "new_owner": "x"}).status_code == 401

    wallet = register_and_link_wallet(
        client,
        name="Test Owner",
        email=f"owner-{time.time_ns()}@geoledger.test",
    )
    assert wallet.startswith("0x")
    assert client.post("/applications/unknown/approve").status_code == 403


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


def test_gis_lookup_endpoint(client):
    response = client.get("/gis/property/SN-DEMO-001")
    assert response.status_code == 200
    data = response.get_json()["data"]
    geojson = data.get("geojson")
    assert geojson is not None
    assert geojson["type"] == "Feature"
    assert geojson["geometry"]["type"] == "Polygon"


def test_full_registration_lifecycle(client):
<<<<<<< Updated upstream
    survey_num = f"SN-TEST-{int(time.time())}"
    applicant_wallet = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"

    user_headers = _login(client, "user@geoledger.local", "User@12345")
    admin_headers = _login(client, "admin@geoledger.local", "Admin@12345", admin=True)

    # 1. Create application as user
    res = client.post("/applications", headers=user_headers, json={
=======
    survey_num = f"SN-TEST-{time.time_ns()}"
    # 1. Create an authenticated user and application
    applicant_wallet = register_and_link_wallet(
        client,
        name="Automated Test User",
        email=f"flow-{time.time_ns()}@geoledger.test",
    )
    res = client.post("/applications", json={
>>>>>>> Stashed changes
        "application_type": "NEW_REGISTRATION",
        "survey_number": survey_num,
        "applicant_wallet": applicant_wallet,
        "applicant_name": "Automated Test User",
    })
    assert res.status_code == 201, res.get_json()
    app_id = res.get_json()["data"]["id"]

    # 2. Upload documents
    req_docs = res.get_json()["data"]["required_documents"]
    doc_ids = []
    for doc_type in req_docs:
<<<<<<< Updated upstream
        content = f"Owner: Automated Test User\nSurvey Number: {survey_num}\nArea: 2500 sq ft\n".encode()
        up_res = client.post(
            "/documents/upload",
            headers=user_headers,
            data={
                "document_type": doc_type,
                "application_id": app_id,
                "survey_number": survey_num,
                "file": (io.BytesIO(content), f"{doc_type}.txt"),
            },
            content_type="multipart/form-data",
        )
        assert up_res.status_code == 201, up_res.get_json()
        doc_ids.append(up_res.get_json()["data"]["id"])

    # 3. Admin verifies documents
=======
        up_res = client.post("/documents/upload", data={
            "document_type": doc_type,
            "application_id": app_id,
            "survey_number": survey_num,
            "file": (io.BytesIO(b"%PDF-1.4\n" + f"{doc_type}-{uuid.uuid4().hex}".encode()), f"{doc_type}.pdf")
        }, content_type="multipart/form-data")
        assert up_res.status_code == 201
        doc_ids.append(up_res.get_json()["data"]["id"])

    # 3. User checks integrity; the matching hash requires manual registrar review.
    for doc_id in doc_ids:
        integrity = client.post(f"/verification/document/{doc_id}")
        assert integrity.status_code == 200
        assert integrity.get_json()["data"]["verification_status"] == "REQUIRES_MANUAL_REVIEW"

    # 4. Registrar reviews documents and approves the application.
    admin_login = client.post("/auth/login", json={
        "email": os.environ["ADMIN_EMAIL"],
        "password": os.environ["ADMIN_PASSWORD"],
        "role": "admin",
    })
    assert admin_login.status_code == 200
>>>>>>> Stashed changes
    for doc_id in doc_ids:
        v_res = client.post(
            f"/verification/document/{doc_id}/review",
            headers=admin_headers,
            json={"status": "VERIFIED", "remarks": "Reviewed in automated test"},
        )
        assert v_res.status_code == 200, v_res.get_json()

<<<<<<< Updated upstream
    # 4. Admin approves application -> On-chain transaction executed
    approve_res = client.post(f"/applications/{app_id}/approve", headers=admin_headers)
    assert approve_res.status_code == 200, approve_res.get_json()
=======
    # Reviewer approval executes the on-chain transaction.
    approve_res = client.post(f"/applications/{app_id}/approve")
    assert approve_res.status_code == 200
>>>>>>> Stashed changes
    approved_data = approve_res.get_json()["data"]
    assert approved_data["status"] == "COMPLETED"
    assert approved_data["blockchain_transaction_hash"] is not None
    assert approved_data["blockchain_block_number"] is not None

    # 5. Public verification confirms chain presence and document review without exposing wallets.
    pub_res = client.get(f"/verify/property/{survey_num}")
    assert pub_res.status_code == 200
    pub_data = pub_res.get_json()["data"]
    assert pub_data["blockchain_verified"] is True
    assert "blockchain_owner_wallet" not in pub_data
    assert len(pub_data["verified_documents"]) == len(req_docs)


def test_unauthorized_approve_blocked(client):
    user_headers = _login(client, "user@geoledger.local", "User@12345")
    res = client.post("/applications/fake-id/approve", headers=user_headers)
    assert res.status_code == 403


def test_blockchain_transactions_endpoint(client):
    headers = _login(client, "admin@geoledger.local", "Admin@12345", admin=True)
    res = client.get("/blockchain/transactions", headers=headers)
    assert res.status_code == 200
    json_data = res.get_json()
    assert json_data["success"] is True
    assert isinstance(json_data["data"], list)
    assert len(json_data["data"]) >= 1
    first_tx = json_data["data"][0]
    assert "tx_hash" in first_tx or "blockchain_tx_hash" in first_tx
    assert "status" in first_tx


def test_valuation_estimate(client):
    headers = _login(client, "user@geoledger.local", "User@12345")
    res = client.post("/valuation/estimate", headers=headers, json={
        "area": 2500,
        "land_type": "Residential",
        "location_category": "urban",
        "district": "Mysuru",
    })
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert data["estimated_value"] > 0
    assert data["is_official_valuation"] is False
