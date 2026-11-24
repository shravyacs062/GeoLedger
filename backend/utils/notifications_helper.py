from datetime import datetime

from database.client import get_database


def create_notification(
    recipient_id: str = None,
    recipient_wallet: str = None,
    recipient_role: str = None,
    title: str = "",
    message: str = "",
    notification_type: str = "INFO",
    related_id: str = None,
    related_type: str = None,
):
    try:
        db = get_database()
        doc = {
            "recipient_id": recipient_id,
            "recipient_wallet": recipient_wallet,
            "recipient_role": recipient_role.lower() if isinstance(recipient_role, str) else recipient_role,
            "title": title,
            "message": message,
            "notification_type": notification_type,
            "related_id": related_id,
            "related_type": related_type,
            "is_read": False,
            "created_at": datetime.utcnow().isoformat(),
        }
        result = db.notifications.insert_one(doc)
        doc["_id"] = result.inserted_id
        return doc
    except Exception:
        return None


def notify_admins(title: str, message: str, related_id: str = None, related_type: str = None):
    return create_notification(
        recipient_role="ADMIN",
        title=title,
        message=message,
        notification_type="ADMIN_ALERT",
        related_id=related_id,
        related_type=related_type,
    )
