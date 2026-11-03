from flask import Blueprint, request

from services.qr_service import QRService
from utils.auth_decorators import login_required
from utils.responses import success_response


qr_bp = Blueprint("qr", __name__, url_prefix="/qr")


@qr_bp.route("/property/<identifier>", methods=["GET"])
@login_required
def get_qr(identifier):
    data = QRService().get_for_property(identifier)
    return success_response("QR code retrieved", data=data)


@qr_bp.route("/generate", methods=["POST"])
@login_required
def generate_qr():
    data = request.get_json() or {}
    result = QRService().generate_for_property(
        survey_number=data.get("survey_number"),
        property_id=data.get("property_id"),
    )
    return success_response("QR code generated", data=result)
