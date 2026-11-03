from functools import wraps

from flask import session

from database.client import get_database
from utils.errors import APIError


def current_user() -> dict | None:
    return session.get("user")


def require_user(*roles: str) -> dict:
    user = current_user()
    if not user:
        raise APIError("Authentication required", status_code=401)
    if roles and user.get("role") not in roles:
        raise APIError("You do not have permission to perform this action", status_code=403)
    return user


def require_application_access(application_id: str) -> dict:
    user = require_user()
    if user.get("role") == "admin":
        return user
    application = get_database().applications.find_one({"_id": application_id})
    if not application:
        raise APIError("Application not found", status_code=404)
    if (
        application.get("applicant_user_id") != user.get("id")
        and application.get("applicant_wallet", "").lower() != (user.get("wallet_address") or "").lower()
    ):
        raise APIError("You do not have access to this application", status_code=403)
    return user


def require_document_access(document_id: str) -> dict:
    user = require_user()
    if user.get("role") == "admin":
        return user
    document = get_database().documents.find_one({"_id": document_id})
    if not document:
        raise APIError("Document not found", status_code=404)
    application_id = document.get("application_id")
    if application_id:
        require_application_access(application_id)
        return user
    prop = get_database().properties.find_one({
        "$or": [
            {"_id": document.get("property_id")},
            {"property_id": document.get("property_id")},
            {"survey_number": document.get("property_id")},
        ]
    })
    if not prop or (prop.get("owner_wallet") or "").lower() != (user.get("wallet_address") or "").lower():
        raise APIError("You do not have access to this document", status_code=403)
    return user
