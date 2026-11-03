from datetime import datetime

from database.client import get_database
from services.blockchain_service import BlockchainService
from utils.constants import (
    APPLICATION_STATUSES,
    APPLICATION_TYPES,
)
from utils.document_requirements import DOCUMENT_REQUIREMENTS
from utils.errors import APIError
from utils.validation import (
    validate_survey_number,
    validate_wallet_address,
)
from utils.audit import log_audit
from utils.notifications_helper import create_notification, notify_admins


class ApplicationService:

    def __init__(self):
        self.db = get_database()
        self.collection = self.db.applications
        self._blockchain = None

    @property
    def blockchain(self):
        if self._blockchain is None:
            self._blockchain = BlockchainService()
        return self._blockchain

    # ---------------------------------------------------------
    # CREATE APPLICATION
    # ---------------------------------------------------------

    def create_application(self, *args, **kwargs) -> dict:
        if args and isinstance(args[0], dict):
            data = args[0]
        else:
            data = kwargs

        application_type = (data.get("application_type") or "").upper()
        if application_type == "REGISTRATION":
            application_type = "NEW_REGISTRATION"
        elif application_type == "TRANSFER":
            application_type = "OWNERSHIP_TRANSFER"
        elif application_type == "INHERITANCE":
            application_type = "INHERITANCE_TRANSFER"

        if application_type not in APPLICATION_TYPES:
            raise APIError(
                f"Invalid application type: {application_type}",
                status_code=400,
            )

        applicant_wallet = data.get("applicant_wallet") or data.get("wallet_address") or ""
        applicant_wallet = validate_wallet_address(applicant_wallet)

        survey_number = data.get("survey_number") or ""
        survey_number = validate_survey_number(survey_number)

        property_id = data.get("property_id") or survey_number

        existing_application = self.collection.find_one(
            {
                "survey_number": survey_number,
                "application_type": application_type,
                "status": {
                    "$nin": [
                        "REJECTED",
                        "COMPLETED",
                    ]
                },
            }
        )

        if existing_application:
            raise APIError(
                "An active application already exists for this survey number",
                status_code=409,
            )

        required_documents = DOCUMENT_REQUIREMENTS.get(
            application_type,
            DOCUMENT_REQUIREMENTS.get("NEW_REGISTRATION", []),
        )

        now = datetime.utcnow().isoformat()

        party_details = data.get("party_details") or {
            "applicant_name": data.get("applicant_name", "Applicant"),
            "applicant_email": data.get("applicant_email", ""),
            "applicant_phone": data.get("applicant_phone", ""),
            "buyer_wallet": data.get("buyer_wallet", ""),
            "seller_wallet": data.get("seller_wallet", applicant_wallet),
        }

        # Inheritance-specific fields
        if application_type in ("INHERITANCE_TRANSFER", "INHERITANCE"):
            party_details.setdefault("deceased_owner_name", data.get("deceased_owner_name", ""))
            party_details.setdefault("deceased_owner_wallet", data.get("deceased_owner_wallet", ""))
            party_details.setdefault("relationship", data.get("relationship", ""))
            party_details.setdefault("legal_heirs", data.get("legal_heirs") or [])
            # Heir becomes new owner
            party_details.setdefault(
                "buyer",
                {
                    "wallet_address": data.get("heir_wallet") or applicant_wallet,
                    "name": data.get("applicant_name") or party_details.get("applicant_name"),
                },
            )

        # For inheritance/transfer, property must already exist
        if application_type in (
            "OWNERSHIP_TRANSFER",
            "TRANSFER",
            "INHERITANCE_TRANSFER",
            "INHERITANCE",
        ):
            existing_prop = self.db.properties.find_one({"survey_number": survey_number})
            if not existing_prop:
                raise APIError(
                    "Property must be registered before transfer or inheritance",
                    status_code=404,
                )
            if application_type in ("INHERITANCE_TRANSFER", "INHERITANCE"):
                deceased_wallet = (
                    party_details.get("deceased_owner_wallet")
                    or existing_prop.get("owner_wallet")
                )
                if (
                    deceased_wallet
                    and existing_prop.get("owner_wallet")
                    and deceased_wallet.lower() != existing_prop.get("owner_wallet", "").lower()
                ):
                    raise APIError(
                        "Deceased owner wallet does not match registered property owner",
                        status_code=409,
                    )

        property_details = data.get("property_details") or {}
        application_doc = {
            "application_type": application_type,
            "applicant_wallet": applicant_wallet,
            "applicant_user_id": data.get("applicant_user_id"),
            "survey_number": survey_number,
            "property_id": property_id,
            "status": "SUBMITTED",
            "required_documents": required_documents,
            "submitted_documents": [],
            "party_details": party_details,
            "property_details": property_details,
            "admin_remarks": None,
            "correction_requested": False,
            "government_reference": f"GOV-REQ-{survey_number}",
            "rejection_reason": None,
            "verification_summary": None,
            "blockchain_transaction_hash": None,
            "blockchain_block_number": None,
            "blockchain_status": None,
            "created_at": now,
            "updated_at": now,
        }

        result = self.collection.insert_one(application_doc)
        application_doc["_id"] = result.inserted_id

        create_notification(
            recipient_id=data.get("applicant_user_id"),
            recipient_wallet=applicant_wallet,
            title="Application submitted",
            message=f"Your {application_type.replace('_', ' ').title()} application for {survey_number} was submitted.",
            notification_type="APPLICATION_SUBMITTED",
            related_id=str(result.inserted_id),
            related_type="application",
        )
        notify_admins(
            title="New application submitted",
            message=f"{application_type} for survey {survey_number} requires review.",
            related_id=str(result.inserted_id),
            related_type="application",
        )
        log_audit("APPLICATION_CREATED", "application", result.inserted_id, {
            "application_type": application_type,
            "survey_number": survey_number,
        })

        return self._serialize_application(application_doc)

    # ---------------------------------------------------------
    # GET APPLICATION
    # ---------------------------------------------------------

    def get_application(self, application_id: str) -> dict:
        query = {"_id": application_id}
        application = self.collection.find_one(query)

        if not application:
            raise APIError(
                "Application not found",
                status_code=404,
            )

        return self._serialize_application(application)

    # ---------------------------------------------------------
    # LIST APPLICATIONS
    # ---------------------------------------------------------

    def list_applications(
        self,
        applicant_wallet: str = None,
        status: str = None,
    ) -> list:
        query = {}

        if applicant_wallet:
            query["applicant_wallet"] = validate_wallet_address(applicant_wallet)

        if status:
            if status not in APPLICATION_STATUSES:
                raise APIError("Invalid application status", status_code=400)
            query["status"] = status

        applications = self.collection.find(query).sort("created_at", -1)

        return [
            self._serialize_application(application)
            for application in applications
        ]

    # ---------------------------------------------------------
    # UPDATE APPLICATION STATUS
    # ---------------------------------------------------------

    def update_status(
        self,
        application_id: str,
        status: str,
        rejection_reason: str = None,
        verification_summary: dict = None,
    ) -> dict:
        if status not in APPLICATION_STATUSES:
            raise APIError(
                f"Invalid application status: {status}",
                status_code=400,
            )

        update_fields = {
            "status": status,
            "updated_at": datetime.utcnow().isoformat(),
        }

        if rejection_reason is not None:
            update_fields["rejection_reason"] = rejection_reason

        if verification_summary is not None:
            update_fields["verification_summary"] = verification_summary

        result = self.collection.update_one(
            {"_id": application_id},
            {"$set": update_fields},
        )

        if result.matched_count == 0:
            raise APIError("Application not found", status_code=404)

        return self.get_application(application_id)

    # ---------------------------------------------------------
    # ADD SUBMITTED DOCUMENT
    # ---------------------------------------------------------

    def add_submitted_document(
        self,
        application_id: str,
        document_id: str,
    ) -> dict:
        app = self.get_application(application_id)
        current_status = app.get("status")

        new_status = "UNDER_REVIEW" if current_status not in ("VERIFIED", "APPROVED", "COMPLETED") else current_status

        result = self.collection.update_one(
            {"_id": application_id},
            {
                "$addToSet": {"submitted_documents": document_id},
                "$set": {
                    "status": new_status,
                    "updated_at": datetime.utcnow().isoformat(),
                },
            },
        )

        if result.matched_count == 0:
            raise APIError("Application not found", status_code=404)

        return self.get_application(application_id)

    # ---------------------------------------------------------
    # VERIFY AND APPROVE
    # ---------------------------------------------------------

    def verify_and_approve(self, application_id: str) -> dict:
        application = self.get_application(application_id)
        if not application:
            raise APIError("Application not found", status_code=404)

        app_status = application.get("status")
        if app_status == "COMPLETED":
            return application

        required_documents = application.get("required_documents", [])
        documents_cursor = self.db.documents.find({"application_id": application_id})
        documents = list(documents_cursor)

        uploaded_types = {doc.get("document_type") for doc in documents}
        missing_documents = [dt for dt in required_documents if dt not in uploaded_types]

        if missing_documents:
            self.collection.update_one(
                {"_id": application_id},
                {"$set": {"status": "DOCUMENTS_PENDING", "updated_at": datetime.utcnow().isoformat()}},
            )
            raise APIError(
                f"Required documents missing: {', '.join(missing_documents)}",
                status_code=409,
            )

        unverified_documents = [
            doc.get("document_type")
            for doc in documents
            if doc.get("verification_status") != "VERIFIED"
        ]

        if unverified_documents:
            self.collection.update_one(
                {"_id": application_id},
                {"$set": {"status": "UNDER_REVIEW", "updated_at": datetime.utcnow().isoformat()}},
            )
            raise APIError(
                f"Documents must be verified by reviewer before approval: {', '.join(unverified_documents)}",
                status_code=409,
            )

        verification_summary = {
            "total_required_documents": len(required_documents),
            "verified_documents": len(documents),
            "status": "ALL_DOCUMENTS_VERIFIED",
            "verified_at": datetime.utcnow().isoformat(),
        }

        # Application is verified, now transition to APPROVED and BLOCKCHAIN_PENDING
        self.collection.update_one(
            {"_id": application_id},
            {
                "$set": {
                    "status": "BLOCKCHAIN_PENDING",
                    "verification_summary": verification_summary,
                    "updated_at": datetime.utcnow().isoformat(),
                }
            },
        )

        survey_number = application.get("survey_number")
        app_type = application.get("application_type")

        # Execute Blockchain Transaction
        try:
            if app_type in (
                "OWNERSHIP_TRANSFER",
                "TRANSFER",
                "INHERITANCE_TRANSFER",
                "INHERITANCE",
            ):
                party_details = application.get("party_details") or {}
                buyer = party_details.get("buyer") or {}
                new_owner = (
                    buyer.get("wallet_address")
                    or party_details.get("buyer_wallet")
                    or party_details.get("heir_wallet")
                    or application.get("applicant_wallet")
                )
                new_owner = validate_wallet_address(new_owner)

                blockchain_result = self.blockchain.transfer_property(
                    property_id=survey_number,
                    new_owner=new_owner,
                )

                # Update Property owner
                prop = self.db.properties.find_one({"survey_number": survey_number})
                prev_owner = prop.get("owner_wallet") if prop else "PREVIOUS_OWNER"
                prop_id = prop.get("property_id") if prop else f"GL-PROP-{survey_number}"

                self.db.properties.update_one(
                    {"survey_number": survey_number},
                    {
                        "$set": {
                            "owner_wallet": new_owner,
                            "status": "TRANSFERRED",
                            "updated_at": datetime.utcnow().isoformat(),
                        }
                    },
                )

                tx_type = (
                    "INHERITANCE_TRANSFER"
                    if app_type in ("INHERITANCE_TRANSFER", "INHERITANCE")
                    else "OWNERSHIP_TRANSFER"
                )

                # Store confirmed transaction
                tx_record = {
                    "property_id": prop_id,
                    "survey_number": survey_number,
                    "application_id": application_id,
                    "transaction_type": tx_type,
                    "previous_owner": prev_owner,
                    "new_owner": new_owner,
                    "from_address": self.blockchain.account.address,
                    "to_address": new_owner,
                    "tx_hash": blockchain_result.get("transaction_hash"),
                    "block_number": blockchain_result.get("block_number"),
                    "status": "CONFIRMED",
                    "timestamp": datetime.utcnow().isoformat(),
                }
                self.db.transactions.insert_one(tx_record)

                create_notification(
                    recipient_id=application.get("applicant_user_id"),
                    recipient_wallet=application.get("applicant_wallet"),
                    title="Ownership transferred",
                    message=f"Ownership of {survey_number} transferred successfully on blockchain.",
                    notification_type="TRANSFER_COMPLETED",
                    related_id=application_id,
                    related_type="application",
                )
                if prev_owner and prev_owner != new_owner:
                    create_notification(
                        recipient_wallet=prev_owner,
                        title="Ownership transferred",
                        message=f"Your property {survey_number} ownership has been transferred.",
                        notification_type="TRANSFER_COMPLETED",
                        related_id=application_id,
                        related_type="application",
                    )

            else:
                applicant_wallet = application.get("applicant_wallet")
                blockchain_result = self.blockchain.register_property(
                    property_id=survey_number,
                    wallet_address=applicant_wallet,
                )

                prop_id = f"GL-PROP-{survey_number}"
                existing_prop = self.db.properties.find_one({"survey_number": survey_number})
                if not existing_prop:
                    details = application.get("property_details") or {}
                    self.db.properties.insert_one({
                        "property_id": prop_id,
                        "survey_number": survey_number,
                        "owner_wallet": applicant_wallet,
                        "land_type": details.get("land_type") or "Residential",
                        "village": details.get("village") or details.get("location"),
                        "taluk": details.get("taluk"),
                        "district": details.get("district"),
                        "state": details.get("state") or "Karnataka",
                        "area": details.get("area"),
                        "geojson_reference": survey_number,
                        "coordinates": details.get("coordinates"),
                        "status": "REGISTERED",
                        "blockchain_tx_hash": blockchain_result.get("transaction_hash"),
                        "blockchain_block_number": blockchain_result.get("block_number"),
                        "created_at": datetime.utcnow().isoformat(),
                        "updated_at": datetime.utcnow().isoformat(),
                    })

                # Link property_id and survey_number to application documents
                try:
                    self.db.documents.update_many(
                        {"application_id": application_id},
                        {"$set": {"property_id": prop_id, "survey_number": survey_number}},
                    )
                except Exception:
                    pass

                tx_record = {
                    "property_id": prop_id,
                    "survey_number": survey_number,
                    "application_id": application_id,
                    "transaction_type": "REGISTRATION",
                    "previous_owner": "GOVERNMENT_AUTHORITY",
                    "new_owner": applicant_wallet,
                    "from_address": self.blockchain.account.address,
                    "to_address": applicant_wallet,
                    "tx_hash": blockchain_result.get("transaction_hash"),
                    "block_number": blockchain_result.get("block_number"),
                    "status": "CONFIRMED",
                    "timestamp": datetime.utcnow().isoformat(),
                }
                self.db.transactions.insert_one(tx_record)

            # Mark Application as COMPLETED
            update_data = {
                "status": "COMPLETED",
                "verification_summary": verification_summary,
                "rejection_reason": None,
                "blockchain_transaction_hash": blockchain_result.get("transaction_hash"),
                "blockchain_block_number": blockchain_result.get("block_number"),
                "blockchain_status": "CONFIRMED",
                "updated_at": datetime.utcnow().isoformat(),
            }

            self.collection.update_one(
                {"_id": application_id},
                {"$set": update_data},
            )

            # Generate QR for newly registered properties
            if app_type in ("NEW_REGISTRATION", "REGISTRATION"):
                try:
                    from services.qr_service import QRService
                    QRService().generate_for_property(survey_number=survey_number)
                except Exception:
                    pass

            create_notification(
                recipient_id=application.get("applicant_user_id"),
                recipient_wallet=application.get("applicant_wallet"),
                title="Application approved",
                message=f"Your application for {survey_number} was approved and recorded on blockchain.",
                notification_type="APPLICATION_APPROVED",
                related_id=application_id,
                related_type="application",
            )
            log_audit("APPLICATION_APPROVED", "application", application_id, {
                "survey_number": survey_number,
                "tx_hash": blockchain_result.get("transaction_hash"),
            })

            return self.get_application(application_id)

        except Exception as exc:
            self.collection.update_one(
                {"_id": application_id},
                {
                    "$set": {
                        "status": "BLOCKCHAIN_FAILED",
                        "rejection_reason": f"Blockchain execution failed: {str(exc)}",
                        "updated_at": datetime.utcnow().isoformat(),
                    }
                },
            )
            raise APIError(
                f"Application approved off-chain, but blockchain transaction failed: {str(exc)}",
                status_code=502,
            )

    # ---------------------------------------------------------
    # REJECT APPLICATION
    # ---------------------------------------------------------

    def reject_application(
        self,
        application_id: str,
        rejection_reason: str,
    ) -> dict:
        if not rejection_reason:
            raise APIError("Rejection reason is required", status_code=400)

        application = self.get_application(application_id)
        result = self.collection.update_one(
            {"_id": application_id},
            {
                "$set": {
                    "status": "REJECTED",
                    "rejection_reason": rejection_reason,
                    "admin_remarks": rejection_reason,
                    "updated_at": datetime.utcnow().isoformat(),
                }
            },
        )

        if result.matched_count == 0:
            raise APIError("Application not found", status_code=404)

        create_notification(
            recipient_id=application.get("applicant_user_id"),
            recipient_wallet=application.get("applicant_wallet"),
            title="Application rejected",
            message=f"Application for {application.get('survey_number')} was rejected: {rejection_reason}",
            notification_type="APPLICATION_REJECTED",
            related_id=application_id,
            related_type="application",
        )
        log_audit("APPLICATION_REJECTED", "application", application_id, {
            "reason": rejection_reason,
        })

        return self.get_application(application_id)

    def request_additional_documents(
        self,
        application_id: str,
        remarks: str,
        required_extra: list = None,
    ) -> dict:
        if not remarks:
            raise APIError("Remarks are required when requesting documents", status_code=400)

        application = self.get_application(application_id)
        update_fields = {
            "status": "DOCUMENTS_PENDING",
            "admin_remarks": remarks,
            "correction_requested": True,
            "updated_at": datetime.utcnow().isoformat(),
        }
        if required_extra:
            existing = list(application.get("required_documents") or [])
            for doc_type in required_extra:
                if doc_type not in existing:
                    existing.append(doc_type)
            update_fields["required_documents"] = existing

        self.collection.update_one({"_id": application_id}, {"$set": update_fields})

        create_notification(
            recipient_id=application.get("applicant_user_id"),
            recipient_wallet=application.get("applicant_wallet"),
            title="Additional documents required",
            message=remarks,
            notification_type="DOCUMENTS_REQUIRED",
            related_id=application_id,
            related_type="application",
        )
        log_audit("DOCUMENTS_REQUESTED", "application", application_id, {"remarks": remarks})
        return self.get_application(application_id)

    # ---------------------------------------------------------
    # SERIALIZE
    # ---------------------------------------------------------

    def _serialize_application(self, application: dict) -> dict:
        if not application:
            return None
        app = dict(application)
        app["_id"] = str(app.get("_id", ""))
        app["id"] = app["_id"]
        app["application_id"] = app["_id"]
        return app
