from datetime import datetime

from flask import g, request

from database.client import get_database


def log_audit(action: str, entity_type: str = None, entity_id: str = None, details: dict = None):
    try:
        db = get_database()
        entry = {
            "action": action,
            "entity_type": entity_type,
            "entity_id": str(entity_id) if entity_id else None,
            "details": details or {},
            "actor_id": getattr(g, "user_id", None),
            "actor_email": getattr(g, "user_email", None),
            "actor_role": getattr(g, "user_role", None),
            "ip_address": request.remote_addr if request else None,
            "created_at": datetime.utcnow().isoformat(),
        }
        db.audit_logs.insert_one(entry)
    except Exception:
        # Audit must never break the primary request path
        pass
