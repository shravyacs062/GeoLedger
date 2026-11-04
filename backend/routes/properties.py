from flask import Blueprint, request
from utils.auth import require_user

from controllers.property_controller import (
    create_property,
    delete_property,
    get_property_by_survey,
    list_properties,
    update_property,
)

properties_bp = Blueprint("properties", __name__)

@properties_bp.before_request
def enforce_property_permissions():
    user = require_user()
    if user["role"] != "admin" and request.method in ("POST", "PUT", "DELETE"):
        from utils.errors import APIError
        raise APIError("Only administrators may manage property records", status_code=403)

properties_bp.route("/properties", methods=["POST"])(create_property)
properties_bp.route("/properties", methods=["GET"])(list_properties)
properties_bp.route("/properties/<survey_number>", methods=["GET"])(get_property_by_survey)
properties_bp.route("/properties/<property_id>", methods=["PUT"])(update_property)
properties_bp.route("/properties/<property_id>", methods=["DELETE"])(delete_property)
