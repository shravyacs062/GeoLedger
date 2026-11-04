import os

from flask import request, send_file

from services.document_service import DocumentService
from utils.errors import APIError
from utils.responses import success_response


def get_document_service():
    return DocumentService()


def upload_document():
    file = request.files.get("file")
    if not file:
        raise APIError("No file provided", status_code=400)
    document = get_document_service().upload_document(
        property_id=request.form.get("property_id"),
        application_id=request.form.get("application_id"),
        document_type=request.form.get("document_type") or "OTHER",
        file=file,
    )
    return success_response(
        "Document uploaded successfully",
        data=document,
        status_code=201,
    )


def get_documents_for_property(property_id):
    documents = get_document_service().get_documents_for_property(property_id)
    return success_response("Documents retrieved successfully", data=documents)


def get_documents_for_application(application_id):
    documents = get_document_service().get_documents_for_application(application_id)
    return success_response("Documents retrieved successfully", data=documents)


def delete_document(document_id):
    get_document_service().delete_document(document_id)
    return success_response("Document deleted successfully")


def download_document(document_id):
    document = get_document_service().get_document_by_id(document_id)
    path = document.get("storage_location")
    if not path or not os.path.isfile(path):
        raise APIError("Document file not found", status_code=404)
    return send_file(
        path,
        as_attachment=True,
        download_name=document.get("filename") or "document",
    )
