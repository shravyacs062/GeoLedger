from flask import Blueprint, g

from services.dashboard_service import DashboardService
from utils.auth_decorators import login_required, admin_required
from utils.responses import success_response


dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/dashboard")


@dashboard_bp.route("/admin", methods=["GET"])
@admin_required
def admin_dashboard():
    stats = DashboardService().admin_stats()
    return success_response("Admin dashboard data", data=stats)


@dashboard_bp.route("/user", methods=["GET"])
@login_required
def user_dashboard():
    stats = DashboardService().user_stats(
        user_id=g.user_id,
        wallet=g.wallet_address,
        email=g.user_email,
    )
    return success_response("User dashboard data", data=stats)
