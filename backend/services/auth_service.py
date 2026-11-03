import re
import uuid
from datetime import datetime

from werkzeug.security import check_password_hash, generate_password_hash

from database.client import get_database
from utils.errors import APIError


EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class AuthService:
    def __init__(self):
        self.collection = get_database().users

    def bootstrap_admin(self, email: str, password: str) -> None:
        if not email and not password:
            return
        if not email or not EMAIL_PATTERN.fullmatch(email) or len(password) < 12:
            raise RuntimeError(
                "ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters are required together"
            )

        normalized_email = email.strip().lower()
        existing = self.collection.find_one({"email": normalized_email})
        if existing and existing.get("role") != "admin":
            raise RuntimeError("Configured admin email is already assigned to a user account")
        if existing:
            return

        self.collection.insert_one({
            "_id": uuid.uuid4().hex,
            "email": normalized_email,
            "name": "GeoLedger Administrator",
            "password_hash": generate_password_hash(password),
            "role": "admin",
            "created_at": datetime.utcnow().isoformat(),
        })

    @staticmethod
    def public_user(user: dict) -> dict:
        if not user:
            return None
        return {
            "id": str(user.get("_id", "")),
            "email": user.get("email", ""),
            "name": user.get("name", ""),
            "role": user.get("role", "user"),
            "wallet_address": user.get("wallet_address"),
        }

    def register_user(self, data: dict) -> dict:
        email = (data.get("email") or "").strip().lower()
        name = (data.get("name") or "").strip()
        password = data.get("password") or ""
        if not EMAIL_PATTERN.fullmatch(email):
            raise APIError("A valid email address is required", status_code=400)
        if len(name) < 2:
            raise APIError("Name must contain at least 2 characters", status_code=400)
        if len(password) < 10:
            raise APIError("Password must contain at least 10 characters", status_code=400)
        if self.collection.find_one({"email": email}):
            raise APIError("An account with this email already exists", status_code=409)
        if data.get("wallet_address"):
            raise APIError(
                "Link a wallet after registration by signing a MetaMask challenge",
                status_code=400,
            )

        record = {
            "_id": uuid.uuid4().hex,
            "email": email,
            "name": name,
            "password_hash": generate_password_hash(password),
            "role": "user",
            "created_at": datetime.utcnow().isoformat(),
        }
        self.collection.insert_one(record)
        return self.public_user(record)

    def authenticate(self, email: str, password: str, role: str) -> dict:
        normalized_email = (email or "").strip().lower()
        user = self.collection.find_one({"email": normalized_email})
        if (
            not user
            or user.get("role") != role
            or not check_password_hash(user.get("password_hash", ""), password or "")
        ):
            raise APIError("Invalid email or password", status_code=401)
        return self.public_user(user)

    def list_users(self) -> list:
        users = self.collection.find({}).sort("created_at", -1)
        return [self.public_user(user) for user in users]

    def set_user_role(self, user_id: str, role: str) -> dict:
        if role not in ("user", "admin"):
            raise APIError("Role must be user or admin", status_code=400)
        result = self.collection.update_one(
            {"_id": user_id},
            {"$set": {"role": role, "updated_at": datetime.utcnow().isoformat()}},
        )
        if result.matched_count == 0:
            raise APIError("User not found", status_code=404)
        return self.public_user(self.collection.find_one({"_id": user_id}))
