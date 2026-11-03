import base64
import io
from datetime import datetime

from database.client import get_database
from utils.errors import APIError


class QRService:
    def __init__(self):
        self.db = get_database()

    def _public_url(self, identifier: str) -> str:
        from flask import current_app, request

        frontend = current_app.config.get("FRONTEND_URL", "http://127.0.0.1:5173")
        # Prefer configured frontend public verify page
        return f"{frontend.rstrip('/')}/public/verify/{identifier}"

    def generate_for_property(self, survey_number: str = None, property_id: str = None) -> dict:
        query = {}
        if survey_number:
            query["survey_number"] = survey_number
        elif property_id:
            query["property_id"] = property_id
        else:
            raise APIError("survey_number or property_id is required", status_code=400)

        prop = self.db.properties.find_one(query)
        if not prop:
            raise APIError("Property not found", status_code=404)

        identifier = prop.get("survey_number") or prop.get("property_id")
        verify_url = self._public_url(identifier)

        qr_base64 = None
        try:
            import qrcode

            img = qrcode.make(verify_url)
            buffer = io.BytesIO()
            img.save(buffer, format="PNG")
            qr_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
        except ImportError:
            # Fallback: return URL only; frontend can render QR
            qr_base64 = None

        payload = {
            "property_id": prop.get("property_id"),
            "survey_number": prop.get("survey_number"),
            "verify_url": verify_url,
            "qr_image_base64": qr_base64,
            "generated_at": datetime.utcnow().isoformat(),
        }

        self.db.properties.update_one(
            {"_id": prop["_id"]},
            {
                "$set": {
                    "qr_code_url": verify_url,
                    "qr_generated_at": payload["generated_at"],
                    "updated_at": datetime.utcnow().isoformat(),
                }
            },
        )
        return payload

    def get_for_property(self, identifier: str) -> dict:
        prop = self.db.properties.find_one(
            {"$or": [{"survey_number": identifier}, {"property_id": identifier}]}
        )
        if not prop:
            raise APIError("Property not found", status_code=404)
        if prop.get("qr_code_url"):
            # Regenerate image if needed
            return self.generate_for_property(survey_number=prop.get("survey_number"))
        return self.generate_for_property(survey_number=prop.get("survey_number"))
