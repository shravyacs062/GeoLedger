from datetime import datetime
from bson import ObjectId

from database.client import get_database
from models.transaction import TransactionModel
from utils.errors import APIError
from utils.validation import validate_property_id, validate_wallet_address


class OwnershipService:
    def __init__(self):
        self.db = get_database()
        self.property_collection = self.db.properties
        self.transaction_collection = self.db.transactions

    def create_transfer_application(self, data: dict) -> dict:
        from services.application_service import ApplicationService

        property_id = data.get("property_id")
        survey_number = data.get("survey_number")
        seller_wallet = data.get("seller_wallet") or data.get("current_owner") or data.get("applicant_wallet")
        buyer_wallet = data.get("buyer_wallet") or data.get("new_owner")

        if not property_id and not survey_number:
            raise APIError("Either property_id or survey_number is required", status_code=400)

        query = {}
        if property_id:
            query = {"$or": [{"_id": property_id}, {"property_id": property_id}]}
        elif survey_number:
            query = {"survey_number": survey_number}

        prop = self.property_collection.find_one(query)
        if not prop:
            prop = self.property_collection.find_one({"survey_number": survey_number or property_id})

        if not prop:
            raise APIError("Property not found for transfer", status_code=404)

        current_owner = prop.get("owner_wallet")
        if not seller_wallet:
            seller_wallet = current_owner

        if not buyer_wallet:
            raise APIError("Buyer wallet address is required", status_code=400)

        validate_wallet_address(buyer_wallet)
        seller_wallet = validate_wallet_address(seller_wallet)

        if current_owner and seller_wallet.lower() != str(current_owner).lower():
            raise APIError(
                "Seller wallet does not match the registered property owner",
                status_code=403,
            )

        app_payload = {
            "application_type": "OWNERSHIP_TRANSFER",
            "applicant_wallet": seller_wallet,
            "applicant_user_id": data.get("applicant_user_id"),
            "survey_number": prop.get("survey_number"),
            "property_id": prop.get("property_id") or str(prop.get("_id")),
            "applicant_user_id": data.get("applicant_user_id"),
            "applicant_email": data.get("applicant_email"),
            "party_details": {
                "seller": {
                    "wallet_address": seller_wallet,
                    "name": data.get("seller_name", "Current Owner"),
                    "email": data.get("seller_email"),
                    "phone": data.get("seller_phone"),
                    "gov_id": data.get("seller_gov_id"),
                },
                "buyer": {
                    "wallet_address": buyer_wallet,
                    "name": data.get("buyer_name", "New Owner"),
                    "email": data.get("buyer_email"),
                    "phone": data.get("buyer_phone"),
                    "gov_id": data.get("buyer_gov_id"),
                },
            },
        }

        app_service = ApplicationService()
        return app_service.create_application(app_payload)

    def get_ownership_history(self, property_id: str) -> list:
        if property_id == "ALL":
            records = list(self.transaction_collection.find().sort("timestamp", -1))
        else:
            query = {"$or": [{"property_id": property_id}, {"survey_number": property_id}]}
            records = list(self.transaction_collection.find(query).sort("timestamp", -1))
            if not records:
                records = list(self.transaction_collection.find().sort("timestamp", -1))
        return [self._serialize_transaction(item) for item in records]

    @staticmethod
    def _serialize_transaction(document: dict) -> dict:
        doc = dict(document)
        doc["transaction_id"] = str(doc.pop("_id", ""))
        return doc
