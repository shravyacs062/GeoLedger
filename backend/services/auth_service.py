<<<<<<< Updated upstream
from datetime import datetime, timedelta
import re

import jwt
from flask import current_app
from werkzeug.security import generate_password_hash, check_password_hash
=======
import re
import uuid
from datetime import datetime
>>>>>>> Stashed changes

from werkzeug.security import check_password_hash, generate_password_hash

from database.client import get_database
<<<<<<< Updated upstream
from models.user import UserModel, ROLES
from utils.validation import validate_wallet_address
=======
>>>>>>> Stashed changes
from utils.errors import APIError
from utils.audit import log_audit


EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


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

        normalized_email = email.lower()
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

    def _serialize(self, user: dict) -> dict:
        if not user:
            return None
        data = dict(user)
        data["id"] = str(data.get("_id", ""))
        data["_id"] = data["id"]
        data.pop("password_hash", None)
        return data

    def _issue_token(self, user: dict) -> str:
        expires_hours = int(current_app.config.get("JWT_EXPIRES_HOURS", 24))
        payload = {
            "sub": str(user.get("_id") or user.get("id")),
            "email": user.get("email"),
            "role": (user.get("role") or "USER").upper(),
            "wallet_address": user.get("wallet_address"),
            "full_name": user.get("full_name") or "",
            "exp": datetime.utcnow() + timedelta(hours=expires_hours),
            "iat": datetime.utcnow(),
        }
        return jwt.encode(
            payload,
            current_app.config["SECRET_KEY"],
            algorithm=current_app.config.get("JWT_ALGORITHM", "HS256"),
        )

    def register_user(self, data: dict) -> dict:
<<<<<<< Updated upstream
        """Password-based user registration (role always USER)."""
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""
        full_name = (data.get("full_name") or data.get("name") or "").strip()
        phone = (data.get("phone") or "").strip()
        wallet_address = data.get("wallet_address")

        if not email or not EMAIL_RE.match(email):
            raise APIError("A valid email address is required", status_code=400)
        if len(password) < 8:
            raise APIError("Password must be at least 8 characters", status_code=400)

        existing = self.collection.find_one({"email": email})
        if existing:
            raise APIError("Email already registered", status_code=409)

        if wallet_address:
            wallet_address = validate_wallet_address(wallet_address)
            wallet_user = self.collection.find_one({"wallet_address": wallet_address})
            if wallet_user and wallet_user.get("email") and wallet_user.get("email") != email:
                raise APIError("Wallet address already linked to another account", status_code=409)

        now = datetime.utcnow().isoformat()
        user_data = {
            "email": email,
            "password_hash": generate_password_hash(password),
            "role": "USER",
            "full_name": full_name,
            "phone": phone,
            "wallet_address": wallet_address,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        }
        result = self.collection.insert_one(user_data)
        user_data["_id"] = result.inserted_id
        log_audit("USER_REGISTERED", "user", result.inserted_id, {"email": email})
        token = self._issue_token(user_data)
        return {"user": self._serialize(user_data), "token": token}

    def register_wallet(self, data: dict) -> dict:
        """Legacy wallet-only registration / linking."""
        wallet_address = data.get("wallet_address")
        validate_wallet_address(wallet_address)

        existing_user = self.collection.find_one({"wallet_address": wallet_address})
        if existing_user:
            return self._serialize(existing_user)

        now = datetime.utcnow().isoformat()
        user_data = {
            "email": None,
            "password_hash": None,
            "role": "USER",
            "full_name": "",
            "phone": "",
            "wallet_address": wallet_address,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        }
        self.collection.insert_one(user_data)
        return self._serialize(user_data)

    def login(self, data: dict, expected_roles: set | None = None) -> dict:
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""

        if not email or not password:
            raise APIError("Email and password are required", status_code=400)

        user = self.collection.find_one({"email": email})
        if not user or not user.get("password_hash"):
            raise APIError("Invalid email or password", status_code=401)
        if not user.get("is_active", True):
            raise APIError("Account is disabled", status_code=403)
        if not check_password_hash(user["password_hash"], password):
            raise APIError("Invalid email or password", status_code=401)

        role = (user.get("role") or "USER").upper()
        if expected_roles and role not in expected_roles:
            raise APIError(
                f"This login portal is for {', '.join(sorted(expected_roles))} accounts only",
                status_code=403,
            )

        token = self._issue_token(user)
        log_audit("USER_LOGIN", "user", user.get("_id"), {"email": email, "role": role})
        return {"user": self._serialize(user), "token": token}

    def login_user(self, data: dict) -> dict:
        return self.login(data, expected_roles={"USER"})

    def login_admin(self, data: dict) -> dict:
        return self.login(data, expected_roles={"ADMIN", "REGISTRAR"})

    def get_profile(self, user_id: str) -> dict:
        user = self.collection.find_one({"_id": user_id})
        if not user:
            raise APIError("User not found", status_code=404)
        return self._serialize(user)

    def update_profile(self, user_id: str, data: dict) -> dict:
        allowed = {}
        if "full_name" in data:
            allowed["full_name"] = (data.get("full_name") or "").strip()
        if "phone" in data:
            allowed["phone"] = (data.get("phone") or "").strip()
        if "wallet_address" in data:
            wallet = data.get("wallet_address")
            if wallet:
                wallet = validate_wallet_address(wallet)
                conflict = self.collection.find_one({
                    "wallet_address": wallet,
                    "_id": {"$ne": user_id},
                })
                if conflict:
                    raise APIError("Wallet already linked to another account", status_code=409)
            allowed["wallet_address"] = wallet or None

        if not allowed:
            raise APIError("No valid profile fields to update", status_code=400)

        allowed["updated_at"] = datetime.utcnow().isoformat()
        result = self.collection.update_one({"_id": user_id}, {"$set": allowed})
        if result.matched_count == 0:
            raise APIError("User not found", status_code=404)
        log_audit("PROFILE_UPDATED", "user", user_id, allowed)
        return self.get_profile(user_id)

    def list_users(self) -> list:
        users = list(self.collection.find({}))
        return [self._serialize(u) for u in users]

    def set_user_role(self, user_id: str, role: str) -> dict:
        role = (role or "").upper()
        if role not in ROLES:
            raise APIError(f"Invalid role. Allowed: {', '.join(sorted(ROLES))}", status_code=400)
        result = self.collection.update_one(
            {"_id": user_id},
            {"$set": {"role": role, "updated_at": datetime.utcnow().isoformat()}},
        )
        if result.matched_count == 0:
            raise APIError("User not found", status_code=404)
        log_audit("ROLE_CHANGED", "user", user_id, {"role": role})
        return self.get_profile(user_id)

    def ensure_seed_accounts(self):
        """Create default admin and demo user if they do not exist."""
        seeds = [
            {
                "email": "admin@geoledger.local",
                "password": "Admin@12345",
                "role": "ADMIN",
                "full_name": "GeoLedger Administrator",
            },
            {
                "email": "user@geoledger.local",
                "password": "User@12345",
                "role": "USER",
                "full_name": "Demo Citizen",
                "wallet_address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            },
        ]
        for seed in seeds:
            existing = self.collection.find_one({"email": seed["email"]})
            if existing:
                continue
            now = datetime.utcnow().isoformat()
            doc = {
                "email": seed["email"],
                "password_hash": generate_password_hash(seed["password"]),
                "role": seed["role"],
                "full_name": seed["full_name"],
                "phone": "",
                "wallet_address": seed.get("wallet_address"),
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            }
            self.collection.insert_one(doc)
            print(f"Seeded {seed['role']} account: {seed['email']}")
=======
        email = (data.get("email") or "").strip().lower()
        name = (data.get("name") or "").strip()
        password = data.get("password") or ""
        wallet = data.get("wallet_address")
        if not email or not EMAIL_PATTERN.fullmatch(email):
            raise APIError("A valid email address is required", status_code=400)
        if len(name) < 2:
            raise APIError("Name must contain at least 2 characters", status_code=400)
        if len(password) < 10:
            raise APIError("Password must contain at least 10 characters", status_code=400)
        if self.collection.find_one({"email": email}):
            raise APIError("An account with this email already exists", status_code=409)
        if wallet:
            raise APIError("Link a wallet after registration by signing a MetaMask challenge", status_code=400)

        record = {
            "_id": uuid.uuid4().hex,
            "email": email,
            "name": name,
            "password_hash": generate_password_hash(password),
            "role": "user",
            "created_at": datetime.utcnow().isoformat(),
        }
        result = self.collection.insert_one(record)
        record["_id"] = result.inserted_id
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

    @staticmethod
    def public_user(user: dict) -> dict:
        return {
            "id": str(user.get("_id", "")),
            "email": user["email"],
            "name": user.get("name", ""),
            "role": user["role"],
            "wallet_address": user.get("wallet_address"),
        }
>>>>>>> Stashed changes
