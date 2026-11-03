from flask import Blueprint, request

from services.valuation_service import ValuationService
from utils.auth_decorators import login_required, admin_required
from utils.responses import success_response


valuation_bp = Blueprint("valuation", __name__, url_prefix="/valuation")


@valuation_bp.route("/estimate", methods=["POST"])
@login_required
def estimate():
    data = request.get_json() or {}
    result = ValuationService().estimate(
        area=data.get("area"),
        land_type=data.get("land_type") or "Residential",
        location_category=data.get("location_category") or "urban",
        district=data.get("district"),
        survey_number=data.get("survey_number"),
    )
    return success_response("Valuation estimate generated", data=result)


@valuation_bp.route("/params", methods=["GET"])
@login_required
def get_params():
    return success_response("Valuation parameters", data=ValuationService().get_params())


@valuation_bp.route("/params", methods=["PUT"])
@admin_required
def update_params():
    data = request.get_json() or {}
    params = ValuationService().update_params(data)
    return success_response("Valuation parameters updated", data=params)
