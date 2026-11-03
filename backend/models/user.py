from dataclasses import dataclass, asdict, field
from typing import Optional


ROLES = {"USER", "ADMIN", "REGISTRAR"}


@dataclass
class UserModel:
    email: str
    password_hash: str
    role: str = "USER"
    full_name: str = ""
    phone: str = ""
    wallet_address: Optional[str] = None
    is_active: bool = True
    created_at: object = None
    updated_at: object = None

    def to_dict(self) -> dict:
        data = asdict(self)
        data.pop("password_hash", None)
        return data

    def to_public(self) -> dict:
        return {
            "email": self.email,
            "role": self.role,
            "full_name": self.full_name,
            "phone": self.phone,
            "wallet_address": self.wallet_address,
            "is_active": self.is_active,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
