from flask import Blueprint, request

from controllers.ownership_controller import (
    get_ownership_history,
    submit_ownership_transfer,
)
from utils.auth import require_user
from database.client import get_database
from utils.errors import APIError

ownership_bp = Blueprint("ownership", __name__)

@ownership_bp.before_request
def enforce_ownership_permissions():
    user = require_user("user")
    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        property_id = data.get("property_id")
        survey_number = data.get("survey_number")
        identifiers = [{"survey_number": survey_number or property_id}]
        if property_id:
            identifiers.extend([{"_id": property_id}, {"property_id": property_id}])
        prop = get_database().properties.find_one(
            {"$or": identifiers}
        )
        if not prop:
            raise APIError("Property not found for transfer", status_code=404)
        if (prop.get("owner_wallet") or "").lower() != (user.get("wallet_address") or "").lower():
            raise APIError("Only the registered owner may initiate a transfer", status_code=403)
        data["applicant_user_id"] = user["id"]
        data["applicant_email"] = user["email"]
        data["seller_wallet"] = user.get("wallet_address")
    if request.method == "GET":
        if user.get("wallet_address") is None:
            raise APIError("Link a wallet address to view ownership history", status_code=403)

ownership_bp.route(
    "/ownership/transfer",
    methods=["POST"]
)(submit_ownership_transfer)

ownership_bp.route(
    "/ownership/history/<property_id>",
    methods=["GET"]
)(get_ownership_history)