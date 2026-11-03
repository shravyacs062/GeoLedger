from flask import request
from utils.auth import current_user

from services.property_service import PropertyService
from utils.responses import success_response
from utils.auth_decorators import login_required, admin_required


def get_property_service():
    return PropertyService()


@admin_required
def create_property():
    data = request.get_json() or {}
    property_record = get_property_service().create_property(data)
    return success_response(
        "Property created successfully",
        data=property_record,
        status_code=201,
    )


@login_required
def list_properties():
    properties = get_property_service().list_properties()
<<<<<<< Updated upstream
=======
    user = current_user()
    if user.get("role") != "admin":
        wallet = (user.get("wallet_address") or "").lower()
        properties = [p for p in properties if (p.get("owner_wallet") or "").lower() == wallet]

>>>>>>> Stashed changes
    return success_response(
        "Properties retrieved successfully",
        data=properties,
    )


@login_required
def get_property_by_survey(survey_number):
<<<<<<< Updated upstream
    property_record = get_property_service().get_property_by_survey(survey_number)
=======
    property_record = get_property_service().get_property_by_survey(
        survey_number
    )
    user = current_user()
    if user.get("role") != "admin" and (
        property_record.get("owner_wallet") or ""
    ).lower() != (user.get("wallet_address") or "").lower():
        from utils.errors import APIError
        raise APIError("Property not found", status_code=404)

>>>>>>> Stashed changes
    return success_response(
        "Property retrieved successfully",
        data=property_record,
    )


@admin_required
def update_property(property_id):
    data = request.get_json() or {}
    property_record = get_property_service().update_property(property_id, data)
    return success_response(
        "Property updated successfully",
        data=property_record,
    )


@admin_required
def delete_property(property_id):
    get_property_service().delete_property(property_id)
    return success_response("Property deleted successfully")
