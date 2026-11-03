from flask import Blueprint, request

from controllers.verification_controller import (
    review_document,
    verify_document,
)
from utils.auth import require_document_access, require_user
from utils.errors import APIError


verification_bp = Blueprint(
    "verification",
    __name__,
)

@verification_bp.before_request
def enforce_verification_permissions():
    document_id = request.view_args["document_id"]
    require_document_access(document_id)
    if request.endpoint == "verification.review_document" or request.get_json(silent=True) and request.get_json(silent=True).get("status"):
        require_user("admin")


verification_bp.route(
    "/verification/document/<document_id>",
    methods=["POST"],
)(verify_document)

verification_bp.route(
    "/verification/document/<document_id>/review",
    methods=["POST"],
)(review_document)