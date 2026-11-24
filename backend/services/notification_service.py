import uuid
from datetime import datetime
from bson import ObjectId

from database.client import get_database
from utils.errors import APIError


class NotificationService:
    def __init__(self):
        self.collection = get_database().notifications

    @staticmethod
    def _serialize(notification: dict) -> dict:
        if not notification:
            return None
        result = dict(notification)
        result["id"] = str(result.get("_id", ""))
        result["_id"] = result["id"]
        result["is_read"] = bool(result.get("is_read", result.get("read", False)))
        return result

    def create(
        self,
        title: str,
        message: str,
        user_id: str = None,
        role: str = None,
        application_id: str = None,
        wallet: str = None,
    ) -> None:
        if not user_id and not role and not wallet:
            return
        self.collection.insert_one({
            "_id": uuid.uuid4().hex,
            "recipient_id": user_id,
            "user_id": user_id,
            "recipient_wallet": wallet,
            "recipient_role": role.lower() if isinstance(role, str) else role,
            "application_id": application_id,
            "title": title,
            "message": message,
            "is_read": False,
            "created_at": datetime.utcnow().isoformat(),
        })

    def list_for_user(self, user_id: str = None, wallet: str = None, role: str = None) -> list:
        clauses = []
        if user_id:
            clauses.append({"$or": [{"recipient_id": user_id}, {"user_id": user_id}]})
        if wallet:
            clauses.append({"recipient_wallet": wallet})
        if role == "admin":
            clauses.append({"recipient_role": {"$in": ["admin", "ADMIN"]}})
        if not clauses:
            return []
        query = {"$or": clauses} if len(clauses) > 1 else clauses[0]
        items = self.collection.find(query).sort("created_at", -1)
        return [self._serialize(item) for item in items]

    def mark_read(self, notification_id: str, user_id: str, role: str = None) -> dict:
        query = {"_id": notification_id}
        if ObjectId.is_valid(notification_id):
            query = {"$or": [{"_id": notification_id}, {"_id": ObjectId(notification_id)}]}
        notification = self.collection.find_one(query)
        if not notification:
            raise APIError("Notification not found", status_code=404)
        user_matches = str(notification.get("recipient_id") or notification.get("user_id")) == str(user_id)
        admin_inbox = (
            role == "admin"
            and str(notification.get("recipient_role") or "").lower() == "admin"
        )
        if not user_matches and not admin_inbox:
            raise APIError("Notification not found", status_code=404)
        self.collection.update_one(
            {"_id": notification["_id"]},
            {"$set": {"is_read": True, "read": True, "read_at": datetime.utcnow().isoformat()}},
        )
        return self._serialize(self.collection.find_one({"_id": notification["_id"]}))

    def mark_all_read(self, user_id: str = None, wallet: str = None, role: str = None) -> int:
        clauses = []
        if user_id:
            clauses.append({"$or": [{"recipient_id": user_id}, {"user_id": user_id}]})
        if wallet:
            clauses.append({"recipient_wallet": wallet})
        if role == "admin":
            clauses.append({"recipient_role": {"$in": ["admin", "ADMIN"]}})
        if not clauses:
            return 0
        query = {"$or": clauses} if len(clauses) > 1 else clauses[0]
        query["is_read"] = {"$ne": True}
        result = self.collection.update_many(
            query,
            {"$set": {"is_read": True, "read": True, "read_at": datetime.utcnow().isoformat()}},
        )
        return result.modified_count
