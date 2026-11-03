<<<<<<< Updated upstream
=======
import uuid
>>>>>>> Stashed changes
from datetime import datetime

from database.client import get_database
from utils.errors import APIError


class NotificationService:
    def __init__(self):
        self.db = get_database()
        self.collection = self.db.notifications

<<<<<<< Updated upstream
    def _serialize(self, doc: dict) -> dict:
        if not doc:
            return None
        data = dict(doc)
        data["id"] = str(data.get("_id", ""))
        data["_id"] = data["id"]
        return data

    def list_for_user(self, user_id: str = None, wallet: str = None, role: str = None) -> list:
        clauses = []
        if user_id:
            clauses.append({"recipient_id": user_id})
        if wallet:
            clauses.append({"recipient_wallet": wallet})
        if role and role.upper() in ("ADMIN", "REGISTRAR"):
            clauses.append({"recipient_role": {"$in": ["ADMIN", "REGISTRAR"]}})

        if not clauses:
            return []

        query = {"$or": clauses} if len(clauses) > 1 else clauses[0]
        items = list(self.collection.find(query).sort("created_at", -1))
        return [self._serialize(i) for i in items]

    def mark_read(self, notification_id: str, user_id: str = None) -> dict:
        notif = self.collection.find_one({"_id": notification_id})
        if not notif:
            raise APIError("Notification not found", status_code=404)

        # Allow admin role inbox or own notification
        if (
            user_id
            and notif.get("recipient_id")
            and str(notif.get("recipient_id")) != str(user_id)
            and notif.get("recipient_role") not in ("ADMIN", "REGISTRAR")
        ):
            raise APIError("Not allowed to update this notification", status_code=403)

        self.collection.update_one(
            {"_id": notification_id},
            {"$set": {"is_read": True, "read_at": datetime.utcnow().isoformat()}},
        )
        return self._serialize(self.collection.find_one({"_id": notification_id}))

    def mark_all_read(self, user_id: str = None, wallet: str = None, role: str = None) -> int:
        clauses = []
        if user_id:
            clauses.append({"recipient_id": user_id})
        if wallet:
            clauses.append({"recipient_wallet": wallet})
        if role and role.upper() in ("ADMIN", "REGISTRAR"):
            clauses.append({"recipient_role": {"$in": ["ADMIN", "REGISTRAR"]}})
        if not clauses:
            return 0
        query = {"$or": clauses} if len(clauses) > 1 else clauses[0]
        query["is_read"] = False
        result = self.collection.update_many(
            query,
            {"$set": {"is_read": True, "read_at": datetime.utcnow().isoformat()}},
        )
        return result.modified_count
=======
    def create(self, title: str, message: str, user_id: str = None, role: str = None, application_id: str = None) -> None:
        if not user_id and not role:
            return
        self.collection.insert_one({
            "_id": uuid.uuid4().hex,
            "user_id": user_id,
            "recipient_role": role,
            "application_id": application_id,
            "title": title,
            "message": message,
            "read": False,
            "created_at": datetime.utcnow().isoformat(),
        })

    def list_for(self, user: dict) -> list:
        if user.get("role") == "admin":
            query = {"recipient_role": "admin"}
        else:
            query = {"user_id": user["id"]}
        notifications = self.collection.find(query).sort("created_at", -1)
        return [dict(item, id=str(item.get("_id", ""))) for item in notifications]

    def mark_read(self, notification_id: str, user: dict) -> dict:
        query = {"_id": notification_id}
        if user.get("role") == "admin":
            query["recipient_role"] = "admin"
        else:
            query["user_id"] = user["id"]
        result = self.collection.update_one(query, {"$set": {"read": True}})
        if not result.matched_count:
            raise APIError("Notification not found", status_code=404)
        notification = self.collection.find_one(query)
        notification["id"] = str(notification.get("_id", ""))
        return notification
>>>>>>> Stashed changes
