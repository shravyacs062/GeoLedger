import secrets
from flask import Blueprint, jsonify, request, session

<<<<<<< Updated upstream
from controllers.auth_controller import (
    register_user,
    status,
    login_user,
    login_admin,
    me,
    update_profile,
    logout,
    list_users,
    set_role,
)

auth_bp = Blueprint("auth", __name__)

auth_bp.route("/", methods=["GET"])(status)
auth_bp.route("/auth/register", methods=["POST"])(register_user)
auth_bp.route("/auth/login", methods=["POST"])(login_user)
auth_bp.route("/auth/admin/login", methods=["POST"])(login_admin)
auth_bp.route("/auth/me", methods=["GET"])(me)
auth_bp.route("/auth/profile", methods=["PUT"])(update_profile)
auth_bp.route("/auth/logout", methods=["POST"])(logout)
auth_bp.route("/auth/users", methods=["GET"])(list_users)
auth_bp.route("/auth/users/<user_id>/role", methods=["PUT"])(set_role)
=======
from services.auth_service import AuthService
from utils.errors import APIError
from utils.responses import success_response

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/", methods=["GET"])
def status():
    return success_response("GeoLedger backend is running")


@auth_bp.route("/auth/register", methods=["POST"])
def register_user():
    user = AuthService().register_user(request.get_json(silent=True) or {})
    session.clear()
    session["user"] = user
    session.permanent = True
    return success_response("Account created successfully", data=user, status_code=201)


@auth_bp.route("/auth/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    role = data.get("role", "user")
    if role not in ("user", "admin"):
        raise APIError("Invalid account type", status_code=400)
    user = AuthService().authenticate(data.get("email"), data.get("password"), role)
    session.clear()
    session["user"] = user
    session.permanent = True
    return success_response("Signed in successfully", data=user)


@auth_bp.route("/auth/me", methods=["GET"])
def current_user():
    user = session.get("user")
    if not user:
        raise APIError("Authentication required", status_code=401)
    return success_response("Current user retrieved successfully", data=user)


@auth_bp.route("/auth/logout", methods=["POST"])
def logout():
    session.clear()
    return success_response("Signed out successfully")


@auth_bp.route("/auth/profile", methods=["PATCH"])
def update_profile():
    user = session.get("user")
    if not user:
        raise APIError("Authentication required", status_code=401)
    if user.get("role") != "user":
        raise APIError("Only user accounts can update profiles", status_code=403)

    data = request.get_json(silent=True) or {}
    name = data.get("name")
    wallet = data.get("wallet_address")
    updates = {}
    if name is not None:
        if not isinstance(name, str) or len(name.strip()) < 2:
            raise APIError("Name must contain at least 2 characters", status_code=400)
        updates["name"] = name.strip()
    if wallet is not None:
        from utils.validation import validate_wallet_address
        validate_wallet_address(wallet)
        challenge = session.get("wallet_challenge")
        if not challenge or challenge.get("address", "").lower() != wallet.lower():
            raise APIError("Request a wallet-link challenge before linking this address", status_code=400)
        signature = data.get("signature")
        if not signature:
            raise APIError("A MetaMask signature is required to link a wallet", status_code=400)
        try:
            from eth_account import Account
            from eth_account.messages import encode_defunct
            from eth_keys.exceptions import BadSignature
            recovered = Account.recover_message(
                encode_defunct(text=challenge["message"]),
                signature=signature,
            )
        except (BadSignature, ValueError, TypeError) as error:
            raise APIError("Wallet signature is invalid", status_code=400) from error
        if recovered.lower() != wallet.lower():
            raise APIError("Wallet signature does not match the requested address", status_code=403)
        from database.client import get_database
        existing = get_database().users.find_one({"wallet_address": wallet})
        if existing and str(existing.get("_id")) != user["id"]:
            raise APIError("This wallet is already linked to another account", status_code=409)
        updates["wallet_address"] = wallet
        session.pop("wallet_challenge", None)
    if "signature" in data and wallet is None:
        raise APIError("A wallet address is required with the signature", status_code=400)
    if not updates:
        raise APIError("No profile fields were provided", status_code=400)

    from database.client import get_database
    update = {}
    if updates:
        update["$set"] = updates
    user.update(updates)
    get_database().users.update_one({"_id": user["id"]}, update)
    session["user"] = user
    return success_response("Profile updated successfully", data=user)


@auth_bp.route("/auth/wallet-challenge", methods=["POST"])
def wallet_challenge():
    user = session.get("user")
    if not user:
        raise APIError("Authentication required", status_code=401)
    if user.get("role") != "user":
        raise APIError("Only user accounts can link wallets", status_code=403)
    from utils.validation import validate_wallet_address
    address = (request.get_json(silent=True) or {}).get("wallet_address")
    validate_wallet_address(address)
    nonce = secrets.token_urlsafe(24)
    message = f"GeoLedger wallet ownership verification\nAddress: {address}\nNonce: {nonce}"
    session["wallet_challenge"] = {"address": address, "message": message}
    return success_response("Wallet challenge created", data={"message": message})
>>>>>>> Stashed changes
