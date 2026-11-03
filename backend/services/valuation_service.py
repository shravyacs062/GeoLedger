from datetime import datetime

from database.client import get_database
from utils.errors import APIError
from utils.audit import log_audit


DEFAULT_PARAMS = {
    "base_rate_per_sqft": {
        "Residential": 2500,
        "Commercial": 4500,
        "Agricultural": 800,
        "Industrial": 3200,
        "Other": 1500,
    },
    "location_multipliers": {
        "urban": 1.35,
        "semi_urban": 1.1,
        "rural": 0.85,
    },
    "district_multipliers": {
        "Mysuru": 1.15,
        "Bengaluru": 1.6,
        "default": 1.0,
    },
    "disclaimer": (
        "This is a system-generated estimate for informational purposes only. "
        "It is NOT an official government valuation or guideline value."
    ),
}


class ValuationService:
    def __init__(self):
        self.db = get_database()
        self.collection = self.db.valuation_params

    def get_params(self) -> dict:
        doc = self.collection.find_one({"key": "default"})
        if not doc:
            return dict(DEFAULT_PARAMS)
        params = dict(DEFAULT_PARAMS)
        stored = doc.get("params") or {}
        for k, v in stored.items():
            params[k] = v
        return params

    def update_params(self, updates: dict) -> dict:
        if not updates:
            raise APIError("No valuation parameters provided", status_code=400)
        current = self.get_params()
        for k, v in updates.items():
            if k in current:
                current[k] = v
        self.collection.update_one(
            {"key": "default"},
            {
                "$set": {
                    "key": "default",
                    "params": current,
                    "updated_at": datetime.utcnow().isoformat(),
                }
            },
            upsert=True,
        )
        log_audit("VALUATION_PARAMS_UPDATED", "valuation", "default", updates)
        return current

    def estimate(
        self,
        area: float = None,
        land_type: str = "Residential",
        location_category: str = "urban",
        district: str = None,
        survey_number: str = None,
    ) -> dict:
        params = self.get_params()

        if survey_number and (area is None or not district):
            prop = self.db.properties.find_one({"survey_number": survey_number})
            if prop:
                area = area if area is not None else prop.get("area")
                land_type = land_type or prop.get("land_type") or "Residential"
                district = district or prop.get("district")

        if area is None:
            raise APIError("Land area is required for valuation", status_code=400)

        try:
            area = float(area)
        except (TypeError, ValueError):
            raise APIError("Invalid land area", status_code=400)

        if area <= 0:
            raise APIError("Land area must be positive", status_code=400)

        rates = params.get("base_rate_per_sqft") or {}
        base_rate = rates.get(land_type) or rates.get("Other") or 1500

        loc_mults = params.get("location_multipliers") or {}
        loc_mult = loc_mults.get(location_category) or loc_mults.get("urban") or 1.0

        dist_mults = params.get("district_multipliers") or {}
        dist_mult = dist_mults.get(district) if district else None
        if dist_mult is None:
            dist_mult = dist_mults.get("default") or 1.0

        estimated_value = round(area * base_rate * loc_mult * dist_mult, 2)

        return {
            "estimated_value": estimated_value,
            "currency": "INR",
            "area": area,
            "land_type": land_type,
            "location_category": location_category,
            "district": district,
            "factors": {
                "base_rate_per_sqft": base_rate,
                "location_multiplier": loc_mult,
                "district_multiplier": dist_mult,
                "formula": "area × base_rate × location_multiplier × district_multiplier",
            },
            "disclaimer": params.get("disclaimer") or DEFAULT_PARAMS["disclaimer"],
            "is_official_valuation": False,
        }
