import json
import os


class GISService:
    def __init__(self):
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.geojson_file = os.path.join(backend_dir, "geojson", "demo_parcels.json")
        self.parcels = self._load_parcels()

    def _load_parcels(self) -> dict:
        if os.path.exists(self.geojson_file):
            try:
                with open(self.geojson_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {"type": "FeatureCollection", "features": []}

    def get_geojson_by_survey_number(self, survey_number: str) -> dict:
        survey_norm = survey_number.strip().upper()
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
