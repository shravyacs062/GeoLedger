from flask import Blueprint

from services.notification_service import NotificationService
from utils.auth import require_user
from utils.responses import success_response


notifications_bp = Blueprint("notifications", __name__, url_prefix="/notifications")


@notifications_bp.route("", methods=["GET"])
def list_notifications():
    user = require_user()
    items = NotificationService().list_for_user(
        user_id=user["id"],
        wallet=user.get("wallet_address"),
        role=user.get("role"),
    )
    return success_response("Notifications retrieved successfully", data=items)


@notifications_bp.route("/<notification_id>/read", methods=["PUT", "POST"])
def mark_notification_read(notification_id):
    user = require_user()
    notification = NotificationService().mark_read(
        notification_id,
        user_id=user["id"],
        role=user.get("role"),
    )
    return success_response("Notification marked as read", data=notification)


@notifications_bp.route("/read-all", methods=["POST"])
def mark_all_notifications_read():
    user = require_user()
    count = NotificationService().mark_all_read(
        user_id=user["id"],
        wallet=user.get("wallet_address"),
        role=user.get("role"),
    )
    return success_response("All notifications marked as read", data={"updated": count})
