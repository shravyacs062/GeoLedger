from flask import request
<<<<<<< Updated upstream

=======
from flask import session
>>>>>>> Stashed changes
from services.verification_service import VerificationService
from utils.responses import success_response
from utils.auth_decorators import login_required, admin_required


def get_service():
    return VerificationService()


@login_required
def verify_document(document_id):
    # Integrity re-check (SHA-256). Body with status routes to review for admins.
    data = request.get_json(silent=True) or {}
<<<<<<< Updated upstream
    if data.get("status"):
        from flask import g
        if g.user_role not in ("ADMIN", "REGISTRAR"):
            from utils.errors import APIError
            raise APIError("Only admins can manually review documents", status_code=403)
        result = get_service().review_document(
            document_id,
            data.get("status"),
            data.get("remarks"),
=======
    status = data.get("status")
    remarks = data.get("remarks")

    if status:
        result = get_verification_service().review_document(
            document_id, status=status, remarks=remarks, reviewer=session.get("user")
>>>>>>> Stashed changes
        )
        return success_response("Document reviewed", data=result)

    result = get_service().verify_document(document_id)
    return success_response("Document integrity verified", data=result)


@admin_required
def review_document(document_id):
<<<<<<< Updated upstream
    data = request.get_json() or {}
    result = get_service().review_document(
        document_id,
        data.get("status"),
        data.get("remarks"),
=======
    data = request.get_json(silent=True) or {}
    status = data.get("status", "VERIFIED")
    remarks = data.get("remarks", "Verified by authorized reviewer")

    result = get_verification_service().review_document(
        document_id, status=status, remarks=remarks, reviewer=session.get("user")
>>>>>>> Stashed changes
    )
    return success_response("Document reviewed", data=result)
