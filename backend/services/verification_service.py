from datetime import datetime
import hashlib
import os

from database.client import get_database
from utils.errors import APIError


class VerificationService:

    def __init__(self):
        self.db = get_database()
        self.documents = self.db.documents
        self.applications = self.db.applications

    def review_document(self, document_id: str, status: str, remarks: str = None, reviewer: dict = None) -> dict:
        status = (status or "").upper()
        # Normalize display aliases from complete.md
        aliases = {
            "VERIFICATION_FAILED": "REJECTED",
            "FAILED": "REJECTED",
            "REQUIRES_MANUAL_REVIEW": "REQUIRES_MANUAL_REVIEW",
            "MANUAL_REVIEW": "REQUIRES_MANUAL_REVIEW",
            "PENDING_VERIFICATION": "PENDING",
            "PENDING": "PENDING",
            "VERIFIED": "VERIFIED",
            "REJECTED": "REJECTED",
        }
        status = aliases.get(status, status)
        if status not in ("VERIFIED", "REJECTED", "REQUIRES_MANUAL_REVIEW", "PENDING"):
            raise APIError(
                "Status must be VERIFIED, REJECTED, REQUIRES_MANUAL_REVIEW, or PENDING",
                status_code=400,
            )

        doc = self.documents.find_one({"_id": document_id})
        if not doc:
            raise APIError("Document not found", status_code=404)

        file_path = doc.get("storage_location")
        if not file_path or not os.path.exists(file_path):
            raise APIError("Document file is missing and cannot be verified", status_code=409)
        actual_hash = self._hash_file(file_path)
        if actual_hash != doc.get("document_hash"):
            self.documents.update_one(
                {"_id": document_id},
                {"$set": {
                    "verification_status": "REJECTED",
                    "verification_notes": "File integrity check failed; the file no longer matches its uploaded hash",
                    "verified_at": datetime.utcnow().isoformat(),
                }},
            )
            raise APIError("File integrity check failed; document was rejected", status_code=409)

        if status == "VERIFIED" and not remarks:
            remarks = "Reviewed and approved by an authorized registrar"
        now = datetime.utcnow().isoformat()
        self.documents.update_one(
            {"_id": document_id},
            {
                "$set": {
                    "verification_status": status,
                    "verification_notes": remarks or f"Marked {status} by authorized reviewer",
                    "verified_at": now,
                    "reviewed_by": (reviewer or {}).get("email"),
                }
            },
        )

        # Check linked application
        app_id = doc.get("application_id")
        if app_id:
            self._update_application_verification_state(app_id)
            app = self.applications.find_one({"_id": app_id})
            if app and app.get("applicant_user_id"):
                from services.notification_service import NotificationService
                NotificationService().create(
                    "Document review completed",
                    f"{doc.get('document_type', 'Document')} was marked {status}. {remarks or ''}".strip(),
                    user_id=app["applicant_user_id"],
                    application_id=app_id,
                )

        updated_doc = self.documents.find_one({"_id": document_id})
        return {
            "document_id": document_id,
            "verification_status": status,
            "verification_notes": remarks,
            "document_hash": updated_doc.get("document_hash"),
            "verified_at": now,
        }

    def verify_document(self, document_id: str) -> dict:
        doc = self.documents.find_one({"_id": document_id})
        if not doc:
            raise APIError("Document not found", status_code=404)

        file_path = doc.get("storage_location")
        stored_hash = doc.get("document_hash")

        if not file_path or not os.path.exists(file_path):
            return {
                "document_id": document_id,
                "verification_status": "REJECTED",
                "message": "File not found on server",
            }

        calc_hash = self._hash_file(file_path)
        hash_matches = calc_hash == stored_hash
<<<<<<< Updated upstream
        # Integrity-only auto check: mismatch → failed; match keeps pending for manual authenticity review
        if hash_matches:
            status = doc.get("verification_status") if doc.get("verification_status") in ("VERIFIED", "REQUIRES_MANUAL_REVIEW") else "PENDING"
            notes = "SHA-256 integrity check passed (authenticity still requires manual or authority review)"
        else:
            status = "REJECTED"
            notes = "Hash mismatch detected — file may have been tampered with"
=======
        status = "REQUIRES_MANUAL_REVIEW" if hash_matches else "REJECTED"
>>>>>>> Stashed changes

        now = datetime.utcnow().isoformat()
        self.documents.update_one(
            {"_id": document_id},
            {
                "$set": {
                    "verification_status": status,
<<<<<<< Updated upstream
                    "verification_notes": notes,
                    "verified_at": now if status == "VERIFIED" else doc.get("verified_at"),
                    "integrity_checked_at": now,
=======
                    "verification_notes": "File integrity passed; authenticity requires registrar review" if hash_matches else "Hash mismatch detected",
                    "verified_at": now,
>>>>>>> Stashed changes
                }
            },
        )

        app_id = doc.get("application_id")
        if app_id:
            self._update_application_verification_state(app_id)

        return {
            "document_id": document_id,
            "verification_status": status,
            "document_hash": calc_hash,
            "stored_hash": stored_hash,
            "matches": hash_matches,
            "verified_at": now,
        }

    @staticmethod
    def _hash_file(file_path: str) -> str:
        sha256 = hashlib.sha256()
        with open(file_path, "rb") as file:
            for chunk in iter(lambda: file.read(8192), b""):
                sha256.update(chunk)
        return sha256.hexdigest()

    def _update_application_verification_state(self, application_id: str):
        app = self.applications.find_one({"_id": application_id})
        if not app:
            return

        curr_status = app.get("status")
        if curr_status in ("COMPLETED", "APPROVED", "BLOCKCHAIN_PENDING"):
            return

        req_docs = app.get("required_documents", [])
        submitted_cursor = self.documents.find({"application_id": application_id})
        submitted_docs = list(submitted_cursor)

        verified_types = {d.get("document_type") for d in submitted_docs if d.get("verification_status") == "VERIFIED"}
        has_rejected = any(d.get("verification_status") == "REJECTED" for d in submitted_docs)

        all_req_verified = all(rt in verified_types for rt in req_docs)

        if all_req_verified and not has_rejected:
            new_status = "VERIFIED"
        elif has_rejected:
            new_status = "UNDER_REVIEW"
        elif len(submitted_docs) < len(req_docs):
            new_status = "DOCUMENTS_PENDING"
        else:
            new_status = "UNDER_REVIEW"

        self.applications.update_one(
            {"_id": application_id},
            {"$set": {"status": new_status, "updated_at": datetime.utcnow().isoformat()}},
        )
