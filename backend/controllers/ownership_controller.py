from flask import request, g

from services.ownership_service import OwnershipService
from utils.responses import success_response
from utils.auth_decorators import login_required


def get_service():
    return OwnershipService()


@login_required
def submit_ownership_transfer():
    data = request.get_json() or {}
    data.setdefault("applicant_user_id", g.user_id)
    if g.wallet_address and not data.get("applicant_wallet") and not data.get("seller_wallet"):
        data["applicant_wallet"] = g.wallet_address
        data["seller_wallet"] = g.wallet_address
    result = get_service().create_transfer_application(data)
    return success_response("Ownership transfer application submitted", data=result, status_code=201)


@login_required
def get_ownership_history(property_id):
    history = get_service().get_ownership_history(property_id)
    return success_response("Ownership history retrieved", data=history)
