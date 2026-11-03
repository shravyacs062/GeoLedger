from flask import request

from services.ownership_service import OwnershipService
from utils.auth import current_user
from utils.responses import success_response


def get_ownership_service():
    return OwnershipService()


def submit_ownership_transfer():
    data = request.get_json(silent=True) or {}
    user = current_user()
    data["applicant_user_id"] = user["id"]
    data["applicant_email"] = user["email"]
    data["seller_wallet"] = user.get("wallet_address")
    application = get_ownership_service().create_transfer_application(data)
    return success_response(
        "Ownership transfer application submitted successfully",
        data=application,
        status_code=201,
    )


def get_ownership_history(property_id):
    history = get_ownership_service().get_ownership_history(property_id)
    user = current_user()
    if user.get("role") != "admin":
        wallet = (user.get("wallet_address") or "").lower()
        history = [
            item for item in history
            if wallet in {
                (item.get("previous_owner") or "").lower(),
                (item.get("new_owner") or "").lower(),
                (item.get("to_address") or "").lower(),
            }
        ]
    return success_response("Ownership history retrieved successfully", data=history)
