from flask import request, session

from services.verification_service import VerificationService
from utils.responses import success_response


def get_verification_service():
    return VerificationService()


def verify_document(document_id):
    data = request.get_json(silent=True) or {}
    status = data.get("status")
    if status:
        result = get_verification_service().review_document(
            document_id,
            status=status,
            remarks=data.get("remarks"),
            reviewer=session.get("user"),
        )
        return success_response("Document reviewed", data=result)
    result = get_verification_service().verify_document(document_id)
    return success_response("Document integrity verified", data=result)


def review_document(document_id):
    data = request.get_json(silent=True) or {}
    result = get_verification_service().review_document(
        document_id,
        status=data.get("status", "VERIFIED"),
        remarks=data.get("remarks", "Verified by authorized reviewer"),
        reviewer=session.get("user"),
    )
    return success_response("Document reviewed", data=result)
