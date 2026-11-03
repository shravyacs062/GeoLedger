from flask import Blueprint, request

from database.client import get_database
from services.application_service import ApplicationService
from utils.auth import require_application_access, require_user
from utils.errors import APIError
from utils.responses import success_response
from utils.validation import validate_wallet_address


applications_bp = Blueprint("applications", __name__, url_prefix="/applications")


def get_application_service():
    return ApplicationService()


@applications_bp.route("", methods=["POST"])
def create_application():
    user = require_user("user")
    data = request.get_json(silent=True) or {}
    data["applicant_user_id"] = user["id"]
    data["applicant_email"] = user["email"]
    wallet = user.get("wallet_address")
    if not wallet:
        raise APIError("Link a wallet in your profile before submitting an application", status_code=400)
    if data.get("applicant_wallet") and data["applicant_wallet"].lower() != wallet.lower():
        raise APIError("Application wallet must match the wallet linked to your account", status_code=403)
    data["applicant_wallet"] = wallet

    application_type = (data.get("application_type") or "").upper()
    if application_type in ("TRANSFER", "OWNERSHIP_TRANSFER"):
        prop = get_database().properties.find_one({"survey_number": data.get("survey_number")})
        if not prop:
            raise APIError("Registered property not found", status_code=404)
        if (prop.get("owner_wallet") or "").lower() != wallet.lower():
            raise APIError("Only the registered property owner may request a transfer", status_code=403)
        details = data.get("party_details") or {}
        buyer_wallet = data.get("buyer_wallet") or (details.get("buyer") or {}).get("wallet_address")
        validate_wallet_address(buyer_wallet)
        if buyer_wallet.lower() == wallet.lower():
            raise APIError("New owner wallet must differ from the current owner", status_code=400)
    elif application_type in ("INHERITANCE", "INHERITANCE_TRANSFER"):
        details = data.get("party_details") or {}
        heirs = data.get("legal_heirs") or details.get("legal_heirs") or []
        if not isinstance(heirs, list) or not heirs:
            raise APIError("At least one legal heir must be specified", status_code=400)
        data["legal_heirs"] = heirs
        data["relationship"] = data.get("relationship") or details.get("relationship")
        details.update({
            "legal_heirs": heirs,
            "relationship": data["relationship"],
            "deceased_owner_name": data.get("deceased_owner_name") or details.get("deceased_owner_name"),
            "deceased_owner_wallet": data.get("deceased_owner_wallet") or details.get("deceased_owner_wallet"),
        })
        data["party_details"] = details

    application = get_application_service().create_application(data)
    return success_response(
        "Application created successfully",
        data=application,
        status_code=201,
    )


@applications_bp.route("", methods=["GET"])
def list_applications():
    user = require_user()
    wallet_filter = request.args.get("applicant_wallet") if user["role"] == "admin" else None
    applications = get_application_service().list_applications(
        applicant_wallet=wallet_filter,
        status=request.args.get("status"),
    )
    if user["role"] != "admin":
        applications = [
            item for item in applications
            if item.get("applicant_user_id") == user["id"]
            or (item.get("applicant_wallet") or "").lower() == (user.get("wallet_address") or "").lower()
        ]
    app_type = request.args.get("application_type")
    if app_type:
        applications = [
            item for item in applications
            if (item.get("application_type") or "").upper() == app_type.upper()
        ]
    return success_response("Applications retrieved successfully", data=applications)


@applications_bp.route("/<application_id>", methods=["GET"])
def get_application(application_id):
    require_application_access(application_id)
    application = get_application_service().get_application(application_id)
    return success_response("Application retrieved successfully", data=application)


@applications_bp.route("/<application_id>/status", methods=["PUT"])
def update_application_status(application_id):
    require_user("admin")
    data = request.get_json(silent=True) or {}
    application = get_application_service().update_status(
        application_id=application_id,
        status=data.get("status"),
        rejection_reason=data.get("rejection_reason"),
        verification_summary=data.get("verification_summary"),
    )
    return success_response("Application status updated successfully", data=application)


@applications_bp.route("/<application_id>/approve", methods=["POST"])
def approve_application(application_id):
    require_user("admin")
    application = get_application_service().verify_and_approve(application_id)
    return success_response("Application approved successfully", data=application)


@applications_bp.route("/<application_id>/reject", methods=["POST"])
def reject_application(application_id):
    require_user("admin")
    data = request.get_json(silent=True) or {}
    application = get_application_service().reject_application(
        application_id,
        data.get("rejection_reason") or data.get("remarks") or "",
    )
    return success_response("Application rejected", data=application)


@applications_bp.route("/<application_id>/request-documents", methods=["POST"])
def request_documents(application_id):
    require_user("admin")
    data = request.get_json(silent=True) or {}
    application = get_application_service().request_additional_documents(
        application_id,
        remarks=data.get("remarks") or data.get("message") or "",
        required_extra=data.get("required_documents"),
    )
    return success_response("Additional documents requested", data=application)
