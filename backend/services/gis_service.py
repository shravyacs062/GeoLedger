import json
import os

from database.client import get_database


class GISService:
    def __init__(self):
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.geojson_file = os.path.join(backend_dir, "geojson", "demo_parcels.json")
        self.parcels = self._load_parcels()

    def _load_parcels(self) -> dict:
        if not os.path.isfile(self.geojson_file):
            raise RuntimeError(f"GIS sample data file was not found: {self.geojson_file}")
        with open(self.geojson_file, "r", encoding="utf-8") as f:
            return json.load(f)

    def get_geojson_by_survey_number(self, survey_number: str) -> dict:
        survey_norm = survey_number.strip().upper()
        property_record = get_database().properties.find_one({
            "$or": [
                {"survey_number": survey_number},
                {"property_id": survey_number},
            ]
        })
        boundary = property_record.get("boundary") if property_record else None
        if isinstance(boundary, dict) and boundary.get("type") == "Polygon":
            return {
                "survey_number": property_record.get("survey_number", survey_number),
                "geojson": {
                    "type": "Feature",
                    "properties": {
                        "survey_number": property_record.get("survey_number"),
                        "property_id": property_record.get("property_id"),
                        "area_sqft": property_record.get("area"),
                        "land_type": property_record.get("land_type"),
                    },
                    "geometry": boundary,
                },
                "status": "found",
                "found": True,
                "data_source": "user_submitted_boundary",
                "is_verified_cadastral": False,
                "disclaimer": "Applicant-submitted boundary — not independently verified cadastral data.",
            }

        for feature in self.parcels.get("features", []):
            props = feature.get("properties", {})
            f_survey = props.get("survey_number", "").strip().upper()
            f_prop = props.get("property_id", "").strip().upper()
            if f_survey == survey_norm or f_prop == survey_norm:
                return {
                    "survey_number": survey_number,
                    "geojson": feature,
                    "status": "found",
                    "found": True,
                    "data_source": "demo_geojson",
                    "is_verified_cadastral": False,
                    "disclaimer": "Demo GeoJSON parcel — not verified government cadastral data.",
                }

        # If survey is not specifically in demo set, synthesize a realistic parcel centered in Mysuru region
        import hashlib
        h = int(hashlib.md5(survey_number.encode()).hexdigest()[:6], 16)
        lat_offset = (h % 100) * 0.0002
        lon_offset = ((h // 100) % 100) * 0.0002
        base_lat = 12.1812 + lat_offset
        base_lon = 76.6852 + lon_offset

        synth_feature = {
            "type": "Feature",
            "properties": {
                "survey_number": survey_number,
                "property_id": f"GL-PROP-{survey_number}",
                "locality": "Mysuru Region",
                "area_sqft": 2400,
                "land_type": "Residential",
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [round(base_lon, 5), round(base_lat, 5)],
                        [round(base_lon + 0.0012, 5), round(base_lat, 5)],
                        [round(base_lon + 0.0012, 5), round(base_lat - 0.0010, 5)],
                        [round(base_lon, 5), round(base_lat - 0.0010, 5)],
                        [round(base_lon, 5), round(base_lat, 5)],
                    ]
                ],
            },
        }

        return {
            "survey_number": survey_number,
            "geojson": synth_feature,
            "status": "generated",
            "found": False,
            "data_source": "synthetic",
            "is_verified_cadastral": False,
            "disclaimer": "Synthesized placeholder parcel — not verified government cadastral data.",
        }
