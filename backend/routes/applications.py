from flask import Blueprint, request, g

from services.application_service import ApplicationService
from utils.responses import success_response
<<<<<<< Updated upstream
from utils.auth_decorators import login_required, admin_required
=======
from utils.auth import require_application_access, require_user
from utils.errors import APIError
from utils.validation import validate_wallet_address
>>>>>>> Stashed changes


applications_bp = Blueprint(
    "applications",
    __name__,
    url_prefix="/applications",
)


def get_application_service():
    return ApplicationService()


@applications_bp.route("", methods=["POST"])
@login_required
def create_application():
<<<<<<< Updated upstream
    data = request.get_json() or {}
    # Attach authenticated user context
    data.setdefault("applicant_user_id", g.user_id)
    if g.wallet_address and not data.get("applicant_wallet") and not data.get("wallet_address"):
        data["applicant_wallet"] = g.wallet_address
    if g.user_email:
        data.setdefault("applicant_email", g.user_email)
=======
    user = require_user("user")
    data = request.get_json() or {}
    data["applicant_user_id"] = user["id"]
    data["applicant_email"] = user["email"]
    if not user.get("wallet_address"):
        raise APIError("Link a wallet in your profile before submitting an application", status_code=400)
    if not data.get("applicant_wallet") and not data.get("wallet_address"):
        data["applicant_wallet"] = user["wallet_address"]
    if data.get("applicant_wallet", "").lower() != user["wallet_address"].lower():
        raise APIError("Application wallet must match the wallet linked to your account", status_code=403)
    validate_wallet_address(data.get("applicant_wallet"))
    application_type = (data.get("application_type") or "").upper()
    if application_type in ("TRANSFER", "OWNERSHIP_TRANSFER"):
        from database.client import get_database
        prop = get_database().properties.find_one({"survey_number": data.get("survey_number")})
        if not prop:
            raise APIError("Registered property not found", status_code=404)
        if (prop.get("owner_wallet") or "").lower() != user["wallet_address"].lower():
            raise APIError("Only the registered property owner may request a sale or gift transfer", status_code=403)
        party_details = data.get("party_details") or {}
        buyer_wallet = data.get("buyer_wallet") or (party_details.get("buyer") or {}).get("wallet_address")
        validate_wallet_address(buyer_wallet)
        if buyer_wallet.lower() == user["wallet_address"].lower():
            raise APIError("New owner wallet must differ from the current owner", status_code=400)
>>>>>>> Stashed changes

    application = get_application_service().create_application(data)
    return success_response(
        "Application created successfully",
        data=application,
        status_code=201,
    )


@applications_bp.route("", methods=["GET"])
@login_required
def list_applications():
<<<<<<< Updated upstream
    wallet = request.args.get("applicant_wallet")
    status = request.args.get("status")
    app_type = request.args.get("application_type")

    # Non-admins only see their own applications
    if g.user_role not in ("ADMIN", "REGISTRAR"):
        wallet = g.wallet_address or wallet

    applications = get_application_service().list_applications(
        applicant_wallet=wallet,
        status=status,
=======
    user = require_user()
    applications = (
        get_application_service()
        .list_applications(
            applicant_wallet=request.args.get("applicant_wallet") if user["role"] == "admin" else None,
            status=request.args.get("status"),
        )
>>>>>>> Stashed changes
    )
    if user["role"] != "admin":
        applications = [
            application for application in applications
            if application.get("applicant_user_id") == user["id"]
            or application.get("applicant_wallet", "").lower() == (user.get("wallet_address") or "").lower()
        ]

    if app_type:
        app_type = app_type.upper()
        applications = [
            a for a in applications
            if (a.get("application_type") or "").upper() == app_type
        ]

    # Users without wallet: filter by user id / email
    if g.user_role not in ("ADMIN", "REGISTRAR") and not wallet:
        applications = [
            a for a in applications
            if a.get("applicant_user_id") == g.user_id
            or (a.get("party_details") or {}).get("applicant_email") == g.user_email
        ]

    return success_response(
        "Applications retrieved successfully",
        data=applications,
    )


@applications_bp.route("/<application_id>", methods=["GET"])
@login_required
def get_application(application_id):
<<<<<<< Updated upstream
    application = get_application_service().get_application(application_id)
    if g.user_role not in ("ADMIN", "REGISTRAR"):
        owner_match = (
            application.get("applicant_user_id") == g.user_id
            or (
                g.wallet_address
                and application.get("applicant_wallet", "").lower()
                == g.wallet_address.lower()
            )
            or (application.get("party_details") or {}).get("applicant_email") == g.user_email
        )
        if not owner_match:
            from utils.errors import APIError
            raise APIError("Not authorized to view this application", status_code=403)
=======
    require_application_access(application_id)
    application = (
        get_application_service()
        .get_application(application_id)
    )
>>>>>>> Stashed changes

    return success_response(
        "Application retrieved successfully",
        data=application,
    )


@applications_bp.route("/<application_id>/status", methods=["PUT"])
@admin_required
def update_application_status(application_id):
<<<<<<< Updated upstream
=======
    require_user("admin")
>>>>>>> Stashed changes
    data = request.get_json() or {}
    application = get_application_service().update_status(
        application_id=application_id,
        status=data.get("status"),
        rejection_reason=data.get("rejection_reason"),
        verification_summary=data.get("verification_summary"),
    )
    return success_response(
        "Application status updated successfully",
        data=application,
    )


@applications_bp.route("/<application_id>/approve", methods=["POST"])
@admin_required
def approve_application(application_id):
<<<<<<< Updated upstream
    application = get_application_service().verify_and_approve(application_id)
=======
    require_user("admin")
    application = (
        get_application_service()
        .verify_and_approve(application_id)
    )

>>>>>>> Stashed changes
    return success_response(
        "Application approved successfully",
        data=application,
    )


@applications_bp.route("/<application_id>/reject", methods=["POST"])
@admin_required
def reject_application(application_id):
    data = request.get_json() or {}
    application = get_application_service().reject_application(
        application_id,
        data.get("rejection_reason") or data.get("remarks") or "",
    )
    return success_response("Application rejected", data=application)


@applications_bp.route("/<application_id>/request-documents", methods=["POST"])
@admin_required
def request_documents(application_id):
    data = request.get_json() or {}
    application = get_application_service().request_additional_documents(
        application_id,
        remarks=data.get("remarks") or data.get("message") or "",
        required_extra=data.get("required_documents"),
    )
    return success_response("Additional documents requested", data=application)
