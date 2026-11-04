from flask import Blueprint

from database.client import get_database
from services.blockchain_service import BlockchainService
from utils.errors import APIError
from utils.responses import success_response


public_verify_bp = Blueprint("public_verify", __name__)


@public_verify_bp.route("/verify/property/<identifier>", methods=["GET"])
def public_verify_property(identifier):
    db = get_database()
    prop = (
        db.properties.find_one({"survey_number": identifier})
        or db.properties.find_one({"property_id": identifier})
        or db.properties.find_one({"_id": identifier})
    )
    if not prop:
        raise APIError("Property not found in registry", status_code=404)

    survey_number = prop.get("survey_number")
    property_id = prop.get("property_id") or str(prop.get("_id"))

    chain_data = None
    try:
        chain_data = BlockchainService().get_property(survey_number)
    except APIError:
        pass

    docs = db.documents.find({
        "$or": [
            {"survey_number": survey_number},
            {"property_id": property_id},
        ]
    })
    document_summaries = [
        {
            "document_type": document.get("document_type"),
            "sha256_hash": document.get("document_hash"),
            "verification_status": document.get("verification_status"),
            "verified_at": document.get("verified_at"),
        }
        for document in docs
    ]

    data = {
        "property_id": property_id,
        "survey_number": survey_number,
        "status": prop.get("status", "REGISTERED"),
        "blockchain_registered_at": (
            chain_data.get("registered_at")
            if chain_data and chain_data.get("registered_at")
            else prop.get("created_at")
        ),
        "blockchain_tx_hash": prop.get("blockchain_tx_hash"),
        "blockchain_verified": bool(chain_data and chain_data.get("exists")),
        "blockchain_source": "blockchain" if chain_data is not None else "unavailable",
        "locality": prop.get("village") or prop.get("locality"),
        "taluk": prop.get("taluk"),
        "district": prop.get("district"),
        "state": prop.get("state"),
        "area_sqft": prop.get("area"),
        "land_type": prop.get("land_type"),
        "verified_documents": document_summaries,
        "verification_statement": (
            "This public record summarizes the GeoLedger registry. Blockchain "
            "verification indicates whether the property was found on the configured "
            "chain. Document hashes are integrity references and do not establish "
            "the authenticity of the source documents."
        ),
    }
    return success_response("Public property verification record retrieved", data=data)
