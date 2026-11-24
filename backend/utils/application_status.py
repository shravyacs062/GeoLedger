from datetime import datetime
from typing import Optional


def transition_application_status(
    collection,
    application_id: str,
    status: str,
    actor: str,
    fields: dict = None,
) -> Optional[dict]:
    application = collection.find_one({"_id": application_id})
    if not application:
        return None

    now = datetime.utcnow().isoformat()
    history = list(application.get("status_history") or [])
    current_status = application.get("status")
    if not history and current_status:
        history.append({
            "status": current_status,
            "at": application.get("created_at") or now,
            "actor": "legacy",
        })
    if current_status != status:
        history.append({"status": status, "at": now, "actor": actor})

    updates = dict(fields or {})
    updates.update({
        "status": status,
        "status_history": history,
        "updated_at": now,
    })
    collection.update_one({"_id": application_id}, {"$set": updates})
    return collection.find_one({"_id": application_id})
