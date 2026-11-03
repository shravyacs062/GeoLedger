from flask import Blueprint, request, g

from services.application_service import ApplicationService
from utils.responses import success_response
from utils.auth_decorators import login_required, admin_required


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
    data = request.get_json() or {}
    # Attach authenticated user context
    data.setdefault("applicant_user_id", g.user_id)
    if g.wallet_address and not data.get("applicant_wallet") and not data.get("wallet_address"):
        data["applicant_wallet"] = g.wallet_address
    if g.user_email:
        data.setdefault("applicant_email", g.user_email)

    application = get_application_service().create_application(data)
    return success_response(
        "Application created successfully",
        data=application,
        status_code=201,
    )


@applications_bp.route("", methods=["GET"])
@login_required
def list_applications():
    wallet = request.args.get("applicant_wallet")
    status = request.args.get("status")
    app_type = request.args.get("application_type")

    # Non-admins only see their own applications
    if g.user_role not in ("ADMIN", "REGISTRAR"):
        wallet = g.wallet_address or wallet

    applications = get_application_service().list_applications(
        applicant_wallet=wallet,
        status=status,
    )

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

    return success_response(
        "Application retrieved successfully",
        data=application,
    )


@applications_bp.route("/<application_id>/status", methods=["PUT"])
@admin_required
def update_application_status(application_id):
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
    application = get_application_service().verify_and_approve(application_id)
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
