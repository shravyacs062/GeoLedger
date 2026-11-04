from flask import request

from database.client import get_database
from services.property_service import PropertyService
from utils.auth import current_user
from utils.errors import APIError
from utils.responses import success_response


def get_property_service():
    return PropertyService()


def create_property():
    property_record = get_property_service().create_property(request.get_json() or {})
    return success_response(
        "Property created successfully",
        data=property_record,
        status_code=201,
    )


def list_properties():
    properties = get_property_service().list_properties()
    user = current_user()
    if user.get("role") != "admin":
        wallet = (user.get("wallet_address") or "").lower()
        properties = [
            item for item in properties
            if (item.get("owner_wallet") or "").lower() == wallet
        ]
    return success_response("Properties retrieved successfully", data=properties)


def get_property_by_survey(survey_number):
    property_record = get_property_service().get_property_by_survey(survey_number)
    user = current_user()
    if user.get("role") != "admin" and (
        property_record.get("owner_wallet") or ""
    ).lower() != (user.get("wallet_address") or "").lower():
        raise APIError("Property not found", status_code=404)
    return success_response("Property retrieved successfully", data=property_record)


def update_property(property_id):
    property_record = get_property_service().update_property(
        property_id,
        request.get_json() or {},
    )
    return success_response("Property updated successfully", data=property_record)


def delete_property(property_id):
    get_property_service().delete_property(property_id)
    return success_response("Property deleted successfully")
