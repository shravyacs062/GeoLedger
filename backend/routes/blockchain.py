from flask import Blueprint, request

from services.blockchain_service import BlockchainService
from services.ownership_service import OwnershipService
from utils.auth import current_user, require_user
from utils.errors import APIError
from utils.responses import success_response


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
def register_on_chain():
    raise APIError("Register properties through an approved application", status_code=403)


@blockchain_bp.route("/blockchain/property/<property_id>", methods=["GET"])
def get_property_on_chain(property_id):
    result = get_blockchain_service().get_property(property_id)
    return success_response("Blockchain property retrieved", data=result)


@blockchain_bp.route("/blockchain/transfer", methods=["POST"])
def transfer_on_chain():
    raise APIError("Transfer ownership through an approved application", status_code=403)


@blockchain_bp.route("/blockchain/transactions", methods=["GET"])
def get_blockchain_transactions():
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
    return success_response("Blockchain transactions retrieved successfully", data=history)
