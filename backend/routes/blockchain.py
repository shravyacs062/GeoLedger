from flask import Blueprint, jsonify, request

from services.blockchain_service import BlockchainService
from utils.errors import APIError
<<<<<<< Updated upstream
from utils.auth_decorators import login_required, admin_required
=======
from utils.auth import current_user, require_user
>>>>>>> Stashed changes


blockchain_bp = Blueprint("blockchain", __name__)

@blockchain_bp.before_request
def enforce_blockchain_permissions():
    if request.method == "POST":
        require_user("admin")
    else:
        require_user()


def get_blockchain_service():
    return BlockchainService()


@blockchain_bp.route("/blockchain/register", methods=["POST"])
@admin_required
def register_on_chain():
<<<<<<< Updated upstream
    data = request.get_json(silent=True) or {}
    property_id = data.get("property_id")
    wallet_address = data.get("wallet_address")

    if not property_id:
        raise APIError("property_id is required", status_code=400)
    if not wallet_address:
        raise APIError("wallet_address is required", status_code=400)

    result = get_blockchain_service().register_property(property_id, wallet_address)
    return jsonify({
        "success": True,
        "message": "Property registered on blockchain",
        "data": result,
    }), 201
=======
    raise APIError("Register properties through an approved application", status_code=403)
>>>>>>> Stashed changes


@blockchain_bp.route("/blockchain/property/<property_id>", methods=["GET"])
@login_required
def get_property_on_chain(property_id):
    result = get_blockchain_service().get_property(property_id)
    return jsonify({
        "success": True,
        "message": "Blockchain property retrieved",
        "data": result,
    })


@blockchain_bp.route("/blockchain/transfer", methods=["POST"])
@admin_required
def transfer_on_chain():
<<<<<<< Updated upstream
    data = request.get_json(silent=True) or {}
    property_id = data.get("property_id")
    new_owner = data.get("new_owner")

    if not property_id:
        raise APIError("property_id is required", status_code=400)
    if not new_owner:
        raise APIError("new_owner is required", status_code=400)

    result = get_blockchain_service().transfer_property(property_id, new_owner)
    return jsonify({
        "success": True,
        "message": "Property ownership transferred on blockchain",
        "data": result,
    })
=======
    raise APIError("Transfer ownership through an approved application", status_code=403)
>>>>>>> Stashed changes


@blockchain_bp.route("/blockchain/transactions", methods=["GET"])
@login_required
def get_blockchain_transactions():
    from services.ownership_service import OwnershipService
    history = OwnershipService().get_ownership_history("ALL")
    user = current_user()
    if user.get("role") != "admin":
        wallet = (user.get("wallet_address") or "").lower()
        history = [
            item for item in history
            if wallet and wallet in {
                (item.get("previous_owner") or "").lower(),
                (item.get("new_owner") or "").lower(),
                (item.get("to_address") or "").lower(),
            }
        ]
    return jsonify({
        "success": True,
        "message": "Blockchain transactions retrieved successfully",
        "data": history,
    })
