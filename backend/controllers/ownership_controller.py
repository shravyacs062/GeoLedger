from flask import request, g

from services.ownership_service import OwnershipService
from utils.responses import success_response
<<<<<<< Updated upstream
from utils.auth_decorators import login_required
=======
from utils.auth import current_user
>>>>>>> Stashed changes


def get_service():
    return OwnershipService()


@login_required
def submit_ownership_transfer():
    data = request.get_json() or {}
<<<<<<< Updated upstream
    data.setdefault("applicant_user_id", g.user_id)
    if g.wallet_address and not data.get("applicant_wallet") and not data.get("seller_wallet"):
        data["applicant_wallet"] = g.wallet_address
        data["seller_wallet"] = g.wallet_address
    result = get_service().create_transfer_application(data)
    return success_response("Ownership transfer application submitted", data=result, status_code=201)
=======
    user = current_user()
    data["applicant_user_id"] = user["id"]
    data["applicant_email"] = user["email"]
    data["seller_wallet"] = user.get("wallet_address")

    application = get_ownership_service().create_transfer_application(
        data
    )

    return success_response(
        "Ownership transfer application submitted successfully",
        data=application,
        status_code=201
    )
>>>>>>> Stashed changes


@login_required
def get_ownership_history(property_id):
<<<<<<< Updated upstream
    history = get_service().get_ownership_history(property_id)
    return success_response("Ownership history retrieved", data=history)
=======
    history = get_ownership_service().get_ownership_history(
        property_id
    )
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

    return success_response(
        "Ownership history retrieved successfully",
        data=history
    )
>>>>>>> Stashed changes
