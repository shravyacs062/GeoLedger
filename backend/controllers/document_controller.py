from flask import request, send_file

from services.document_service import DocumentService
from utils.responses import success_response
from utils.auth_decorators import login_required
from utils.errors import APIError


def get_service():
    return DocumentService()


@login_required
def upload_document():
    file = request.files.get("file")
    if not file:
        raise APIError("File is required", status_code=400)

    document = get_service().upload_document(
        property_id=request.form.get("property_id"),
        application_id=request.form.get("application_id"),
        document_type=request.form.get("document_type") or "OTHER",
        file=file,
    )
    return success_response("Document uploaded", data=document, status_code=201)


@login_required
def get_documents_for_property(property_id):
    docs = get_service().get_documents_for_property(property_id)
    return success_response("Documents retrieved", data=docs)


@login_required
def get_documents_for_application(application_id):
    docs = get_service().get_documents_for_application(application_id)
    return success_response("Documents retrieved", data=docs)


@login_required
def delete_document(document_id):
    get_service().delete_document(document_id)
    return success_response("Document deleted")


@login_required
def download_document(document_id):
    doc = get_service().get_document_by_id(document_id)
    path = doc.get("storage_location")
    if not path:
        raise APIError("File not found", status_code=404)
    return send_file(path, as_attachment=True, download_name=doc.get("filename"))
