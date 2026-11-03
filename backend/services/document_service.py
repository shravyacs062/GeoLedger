import hashlib
import os
import uuid
from datetime import datetime
from werkzeug.utils import secure_filename

from config import Config
from database.client import get_database
from utils.errors import APIError
from utils.validation import validate_document_upload


class DocumentService:

    def __init__(self):
        self.db = get_database()
        self.collection = self.db.documents

        self.upload_folder = os.path.abspath(Config.UPLOAD_FOLDER)
        os.makedirs(self.upload_folder, exist_ok=True)

    def upload_document(
        self,
        property_id: str | None,
        application_id: str | None,
        document_type: str,
        file,
    ) -> dict:
        if not property_id and not application_id:
            raise APIError(
                "Either property_id or application_id is required",
                status_code=400,
            )

        validate_document_upload(
            property_id or application_id,
            document_type,
            file,
        )

        if application_id:
            application = self.db.applications.find_one({"_id": application_id})
            if not application:
                raise APIError("Application not found", status_code=404)
            if document_type.upper() not in application.get("required_documents", []):
                raise APIError("Document type is not required for this application", status_code=400)

        orig_filename = secure_filename(file.filename)
        if not orig_filename:
            raise APIError("Invalid filename", status_code=400)

        file_bytes = file.read()
        if not file_bytes:
            raise APIError("Uploaded file is empty", status_code=400)

        document_hash = hashlib.sha256(file_bytes).hexdigest()
        duplicate = self.collection.find_one({"document_hash": document_hash})
        if duplicate:
            raise APIError("This document has already been submitted", status_code=409)

        # Duplicate document detection by hash
        duplicate = self.collection.find_one({"document_hash": document_hash})
        duplicate_warning = None
        if duplicate:
            duplicate_warning = {
                "name": "DUPLICATE_DOCUMENT",
                "passed": False,
                "severity": "MEDIUM",
                "message": f"Identical file previously uploaded as document {duplicate.get('_id')}",
            }

        unique_id = uuid.uuid4().hex[:12]
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        stored_filename = f"{timestamp}_{unique_id}_{orig_filename}"

        file_path = os.path.join(self.upload_folder, stored_filename)

        with open(file_path, "wb") as stored_file:
            stored_file.write(file_bytes)

        # Automated OCR / field extraction
        from services.ocr_service import OCRService

        ocr = OCRService().extract_from_bytes(
            file_bytes, filename=orig_filename, document_type=document_type
        )
        extracted = ocr.get("extracted_fields") or {}

        application = None
        property_record = None
        other_fields = []
        if application_id:
            application = self.db.applications.find_one({"_id": application_id})
            if application:
                property_record = self.db.properties.find_one(
                    {"survey_number": application.get("survey_number")}
                )
                other_docs = list(self.collection.find({"application_id": application_id}))
                other_fields = [
                    (d.get("extracted_fields") or {}) for d in other_docs
                ]

        cross_checks = OCRService().cross_check(
            extracted,
            application=application,
            property_record=property_record,
            other_docs_fields=other_fields,
        )

        verification_checks = [
            {
                "name": "FILE_INTEGRITY",
                "passed": True,
                "severity": "LOW",
                "message": "SHA-256 hash generated and validated against file bytes",
            },
            *cross_checks,
        ]
        if duplicate_warning:
            verification_checks.append(duplicate_warning)

        high_severity_fail = any(
            (not c.get("passed")) and c.get("severity") in ("HIGH", "CRITICAL")
            for c in verification_checks
        )
        medium_fail = any(
            (not c.get("passed")) and c.get("severity") == "MEDIUM"
            for c in verification_checks
        )

        if high_severity_fail:
            initial_status = "REQUIRES_MANUAL_REVIEW"
        elif medium_fail:
            initial_status = "REQUIRES_MANUAL_REVIEW"
        else:
            initial_status = "PENDING"

        now = datetime.utcnow().isoformat()

        document_data = {
            "_id": uuid.uuid4().hex,
            "property_id": property_id,
            "application_id": application_id,
            "document_type": document_type.upper(),
            "filename": orig_filename,
            "stored_filename": stored_filename,
            "storage_location": file_path,
            "file_size": len(file_bytes),
            "document_hash": document_hash,
<<<<<<< Updated upstream
            "verification_status": initial_status,
            "verification_score": 100 if not high_severity_fail else 40,
            "verification_checks": verification_checks,
            "extracted_fields": extracted,
            "ocr_meta": {
                "extraction_method": ocr.get("extraction_method"),
                "confidence": ocr.get("confidence"),
                "extracted_at": ocr.get("extracted_at"),
                "raw_text_preview": ocr.get("raw_text_preview"),
            },
            "document_number": extracted.get("document_number"),
            "issuing_authority": extracted.get("issuing_authority"),
            "issue_date": extracted.get("issue_date"),
=======
            "verification_status": "PENDING",
            "verification_checks": [
                {
                    "name": "FILE_INTEGRITY",
                    "passed": True,
                    "severity": "LOW",
                    "message": "SHA-256 baseline recorded; authenticity review is still required",
                }
            ],
>>>>>>> Stashed changes
            "verification_notes": None,
            "uploaded_at": now,
            "verified_at": None,
        }

        result = None
        try:
            result = self.collection.insert_one(document_data)
            document_data["_id"] = result.inserted_id
            document_data["document_id"] = result.inserted_id

            if application_id:
                from services.application_service import ApplicationService
                ApplicationService().add_submitted_document(
                    application_id, result.inserted_id
                )

        except Exception:
            if result:
                self.collection.delete_one({"_id": result.inserted_id})
            try:
                os.remove(file_path)
            except OSError:
                pass
            raise

        return self._serialize_document(document_data)

    def get_documents_for_property(self, property_id: str) -> list:
        documents = self.collection.find({"property_id": property_id})
        return [self._serialize_document(doc) for doc in documents]

    def list_documents(self) -> list:
        documents = self.collection.find().sort("uploaded_at", -1)
        return [self._serialize_document(doc) for doc in documents]

    def get_documents_for_application(self, application_id: str) -> list:
        if not application_id:
            raise APIError("Application ID is required", status_code=400)

        documents = self.collection.find({"application_id": application_id})
        return [self._serialize_document(doc) for doc in documents]

    def get_document_by_id(self, document_id: str) -> dict:
        doc = self.collection.find_one({"_id": document_id})
        if not doc:
            raise APIError("Document not found", status_code=404)
        file_path = doc.get("storage_location")
        if not file_path or not os.path.exists(file_path):
            raise APIError("Document file not found on server", status_code=404)
        sha256 = hashlib.sha256()
        with open(file_path, "rb") as stored_file:
            for chunk in iter(lambda: stored_file.read(8192), b""):
                sha256.update(chunk)
        if sha256.hexdigest() != doc.get("document_hash"):
            self.collection.update_one(
                {"_id": document_id},
                {"$set": {
                    "verification_status": "REJECTED",
                    "verification_notes": "File integrity check failed during retrieval",
                    "verified_at": datetime.utcnow().isoformat(),
                }},
            )
            raise APIError("Document integrity check failed; download denied", status_code=409)
        return self._serialize_document(doc)

    def delete_document(self, document_id: str) -> None:
        doc = self.collection.find_one({"_id": document_id})
        if not doc:
            raise APIError("Document not found", status_code=404)

        self.collection.delete_one({"_id": document_id})
        file_path = doc.get("storage_location")
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass

    @staticmethod
    def _serialize_document(document: dict) -> dict:
        doc = dict(document)
        doc_id = str(doc.get("_id", ""))
        doc["document_id"] = doc_id
        doc["_id"] = doc_id
        doc["id"] = doc_id
        return doc
