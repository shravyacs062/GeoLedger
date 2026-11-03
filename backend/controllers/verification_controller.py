from flask import request

from services.verification_service import VerificationService
from utils.responses import success_response
from utils.auth_decorators import login_required, admin_required


def get_service():
    return VerificationService()


@login_required
def verify_document(document_id):
    # Integrity re-check (SHA-256). Body with status routes to review for admins.
    data = request.get_json(silent=True) or {}
    if data.get("status"):
        from flask import g
        if g.user_role not in ("ADMIN", "REGISTRAR"):
            from utils.errors import APIError
            raise APIError("Only admins can manually review documents", status_code=403)
        result = get_service().review_document(
            document_id,
            data.get("status"),
            data.get("remarks"),
        )
        return success_response("Document reviewed", data=result)

    result = get_service().verify_document(document_id)
    return success_response("Document integrity verified", data=result)


@admin_required
def review_document(document_id):
    data = request.get_json() or {}
    result = get_service().review_document(
        document_id,
        data.get("status"),
        data.get("remarks"),
    )
    return success_response("Document reviewed", data=result)
