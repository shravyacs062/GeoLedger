<<<<<<< Updated upstream
from flask import Blueprint, g

from services.notification_service import NotificationService
from utils.auth_decorators import login_required
from utils.responses import success_response


notifications_bp = Blueprint("notifications", __name__, url_prefix="/notifications")


def get_service():
    return NotificationService()


@notifications_bp.route("", methods=["GET"])
@login_required
def list_notifications():
    items = get_service().list_for_user(
        user_id=g.user_id,
        wallet=g.wallet_address,
        role=g.user_role,
    )
    return success_response("Notifications retrieved", data=items)


@notifications_bp.route("/<notification_id>/read", methods=["POST"])
@login_required
def mark_read(notification_id):
    item = get_service().mark_read(notification_id, user_id=g.user_id)
    return success_response("Notification marked as read", data=item)


@notifications_bp.route("/read-all", methods=["POST"])
@login_required
def mark_all_read():
    count = get_service().mark_all_read(
        user_id=g.user_id,
        wallet=g.wallet_address,
        role=g.user_role,
    )
    return success_response("All notifications marked as read", data={"updated": count})
=======
from flask import Blueprint, session

from services.notification_service import NotificationService
from utils.auth import require_user
from utils.responses import success_response

notifications_bp = Blueprint("notifications", __name__, url_prefix="/notifications")


@notifications_bp.route("", methods=["GET"])
def list_notifications():
    user = require_user()
    return success_response(
        "Notifications retrieved successfully",
        data=NotificationService().list_for(user),
    )


@notifications_bp.route("/<notification_id>/read", methods=["PUT"])
def mark_notification_read(notification_id):
    user = require_user()
    notification = NotificationService().mark_read(notification_id, user)
    return success_response("Notification marked as read", data=notification)
>>>>>>> Stashed changes
