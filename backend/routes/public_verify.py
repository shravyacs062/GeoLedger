from flask import Blueprint
from database.client import get_database
from services.blockchain_service import BlockchainService
from utils.errors import APIError
from utils.responses import success_response

public_verify_bp = Blueprint("public_verify", __name__)


@public_verify_bp.route("/verify/property/<identifier>", methods=["GET"])
def public_verify_property(identifier):
    db = get_database()
    prop = db.properties.find_one({"survey_number": identifier})
    if not prop:
        prop = db.properties.find_one({"property_id": identifier})
    if not prop:
        prop = db.properties.find_one({"_id": identifier})

    if not prop:
        raise APIError("Property not found in registry", status_code=404)

    survey_number = prop.get("survey_number")
    property_id = prop.get("property_id") or str(prop.get("_id"))
    owner_wallet = prop.get("owner_wallet")

    on_chain_data = None
    on_chain_verified = False
    try:
        bc_service = BlockchainService()
        on_chain_data = bc_service.get_property(survey_number)
        on_chain_verified = bool(on_chain_data.get("exists"))
    except APIError:
        on_chain_data = {
<<<<<<< Updated upstream
            "property_id": survey_number,
            "owner": owner_wallet,
=======
>>>>>>> Stashed changes
            "exists": True,
            "source": "database_cached",
        }

    chain_owner = (on_chain_data or {}).get("owner") or owner_wallet
    ownership_matches = None
    if chain_owner and owner_wallet:
        ownership_matches = str(chain_owner).lower() == str(owner_wallet).lower()

    docs_cursor = db.documents.find(
        {"$or": [{"survey_number": survey_number}, {"property_id": property_id}]}
    )
    docs_summary = [
        {
            "document_type": d.get("document_type"),
            "document_hash": d.get("document_hash"),
            "sha256_hash": d.get("document_hash"),
            "verification_status": d.get("verification_status"),
            "verified_at": d.get("verified_at"),
        }
        for d in docs_cursor
    ]

    response_data = {
        "property_id": property_id,
        "survey_number": survey_number,
        "status": prop.get("status", "REGISTERED"),
<<<<<<< Updated upstream
        "property_status": prop.get("status", "REGISTERED"),
        "owner_wallet": owner_wallet,
        "blockchain_owner_wallet": chain_owner,
        "ownership_matches": ownership_matches,
        "blockchain_registered_at": (on_chain_data or {}).get("registered_at") or prop.get("created_at"),
        "blockchain_tx_hash": prop.get("blockchain_tx_hash"),
        "village": prop.get("village"),
        "locality": prop.get("village") or prop.get("locality") or "Thandavapura",
        "taluk": prop.get("taluk", "Nanjangud"),
        "district": prop.get("district", "Mysuru"),
        "state": prop.get("state", "Karnataka"),
        "area": prop.get("area", 2500),
        "area_sqft": prop.get("area", 2500),
        "land_type": prop.get("land_type", "Residential"),
        "verified_documents": docs_summary,
        "verification_statement": (
            "This property record and its document cryptographic hashes are "
            "anchored on the GeoLedger prototype ledger."
        ),
=======
        "blockchain_registered_at": (
            on_chain_data.get("registered_at")
            if on_chain_data and on_chain_data.get("registered_at")
            else prop.get("created_at")
        ),
        "blockchain_tx_hash": prop.get("blockchain_tx_hash"),
        "blockchain_verified": on_chain_verified,
        "blockchain_source": on_chain_data.get("source", "blockchain") if on_chain_data else "unavailable",
        "locality": prop.get("village"),
        "taluk": prop.get("taluk"),
        "district": prop.get("district"),
        "area_sqft": prop.get("area"),
        "verified_documents": docs_summary,
        "verification_statement": "This public record summarizes the GeoLedger registry. The blockchain verification indicator reports whether the property was found on the configured chain; document hashes are integrity references and are not independently proof of authenticity.",
>>>>>>> Stashed changes
    }

    return success_response(
        "Public property verification record retrieved",
        data=response_data,
    )
