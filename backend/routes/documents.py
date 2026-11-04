from flask import Blueprint
from flask import request
from utils.auth import require_application_access, require_document_access, require_user
from utils.errors import APIError
from database.client import get_database
from controllers.document_controller import (
    delete_document,
    download_document,
    get_document_service,
    get_documents_for_application,
    get_documents_for_property,
    upload_document,
)
from utils.responses import success_response


documents_bp = Blueprint(
    "documents",
    __name__
)

@documents_bp.before_request
def enforce_document_permissions():
    user = require_user()
    if request.endpoint == "documents.upload_document":
        if user["role"] != "user":
            raise APIError("Only users may upload application documents", status_code=403)
        app_id = request.form.get("application_id")
        if app_id:
            require_application_access(app_id)
        else:
            prop_id = request.form.get("property_id")
            identifiers = [{"survey_number": prop_id}]
            if prop_id:
                identifiers.extend([{"_id": prop_id}, {"property_id": prop_id}])
            prop = get_database().properties.find_one({
                "$or": identifiers
            })
            if not prop or (prop.get("owner_wallet") or "").lower() != (user.get("wallet_address") or "").lower():
                raise APIError("Property not found", status_code=404)
        return
    if request.endpoint in ("documents.get_documents_for_application",):
        require_application_access(request.view_args["application_id"])
    elif request.endpoint == "documents.get_documents_for_property":
        if user["role"] == "admin":
            return
        property_id = request.view_args["property_id"]
        identifiers = [{"survey_number": property_id}]
        if property_id:
            identifiers.extend([{"_id": property_id}, {"property_id": property_id}])
        prop = get_database().properties.find_one({
            "$or": identifiers
        })
        if not prop or (prop.get("owner_wallet") or "").lower() != (user.get("wallet_address") or "").lower():
            raise APIError("Property not found", status_code=404)
    elif request.endpoint in ("documents.delete_document", "documents.download_document"):
        require_document_access(request.view_args["document_id"])


@documents_bp.route("/documents", methods=["GET"])
def list_documents_for_review():
    require_user("admin")
    documents = get_document_service().list_documents()
    return success_response("Documents retrieved successfully", data=documents)


documents_bp.route(
    "/documents/upload",
    methods=["POST"]
)(upload_document)


documents_bp.route(
    "/documents/property/<property_id>",
    methods=["GET"]
)(get_documents_for_property)


documents_bp.route(
    "/documents/application/<application_id>",
    methods=["GET"]
)(get_documents_for_application)


documents_bp.route(
    "/documents/<document_id>",
    methods=["DELETE"]
)(delete_document)


documents_bp.route(
    "/documents/download/<document_id>",
    methods=["GET"]
)(download_document)