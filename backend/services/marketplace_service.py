from datetime import datetime

from database.client import get_database
from utils.errors import APIError


DEMO_LISTINGS = [
    ("DEMO-KOD-101", "Coffee estate parcel", "Kodagu", "Madikeri", "Agricultural", 2.25, 18500000),
    ("DEMO-MYS-204", "Residential corner site", "Mysuru", "Mysuru", "Residential", 2400, 7200000),
    ("DEMO-HSN-087", "Irrigated farm land", "Hassan", "Belur", "Agricultural", 1.6, 9600000),
    ("DEMO-MNG-032", "Coastal residential plot", "Dakshina Kannada", "Mangaluru", "Residential", 1800, 5400000),
    ("DEMO-BLR-118", "East-facing villa plot", "Bengaluru Urban", "Bengaluru East", "Residential", 1500, 11800000),
    ("DEMO-BLR-236", "Whitefield development parcel", "Bengaluru Urban", "Bengaluru East", "Residential", 2400, 17600000),
    ("DEMO-MYS-319", "Gated layout site near Hunsur Road", "Mysuru", "Mysuru", "Residential", 1200, 4680000),
    ("DEMO-MYS-411", "Orchard land outside Nanjangud", "Mysuru", "Nanjangud", "Agricultural", 3.1, 11200000),
    ("DEMO-UBL-064", "North-facing residential site", "Dharwad", "Hubballi", "Residential", 1800, 6120000),
    ("DEMO-BGM-173", "Sugarcane cultivation land", "Belagavi", "Gokak", "Agricultural", 4.5, 13500000),
    ("DEMO-SHM-092", "Arecanut garden holding", "Shivamogga", "Sagara", "Agricultural", 2.8, 12400000),
    ("DEMO-CKM-145", "Hillside plantation parcel", "Chikkamagaluru", "Mudigere", "Agricultural", 2.1, 16800000),
    ("DEMO-UDU-056", "Residential site near Manipal", "Udupi", "Udupi", "Residential", 1650, 7450000),
    ("DEMO-TMK-208", "Dry land investment parcel", "Tumakuru", "Gubbi", "Agricultural", 3.75, 8700000),
    ("DEMO-BLR-487", "Yelahanka corner plot", "Bengaluru Urban", "Bengaluru North", "Residential", 1350, 9850000),
    ("DEMO-RMN-074", "Mango orchard parcel", "Ramanagara", "Channapatna", "Agricultural", 2.6, 7800000),
    ("DEMO-BDK-121", "Highway-access farm land", "Vijayapura", "Basavana Bagewadi", "Agricultural", 5.0, 6900000),
    ("DEMO-KLR-184", "Kolar residential layout site", "Kolar", "Kolar", "Residential", 2000, 5800000),
    ("DEMO-DVG-099", "Irrigated coconut farm", "Davanagere", "Harihar", "Agricultural", 3.4, 10400000),
    ("DEMO-KPL-152", "Tungabhadra command area land", "Koppal", "Gangavathi", "Agricultural", 4.2, 9200000),
]

# Current Karnataka districts and a familiar taluk/city label used solely for
# synthetic marketplace samples. These are not property records or addresses.
DISTRICT_LOCATIONS = [
    ("Bagalkote", "Bagalkote"), ("Ballari", "Ballari"), ("Belagavi", "Belagavi"),
    ("Bengaluru Rural", "Devanahalli"), ("Bengaluru Urban", "Bengaluru East"),
    ("Bidar", "Bidar"), ("Chamarajanagar", "Kollegal"), ("Chikkaballapura", "Chikkaballapura"),
    ("Chikkamagaluru", "Chikkamagaluru"), ("Chitradurga", "Chitradurga"),
    ("Dakshina Kannada", "Mangaluru"), ("Davanagere", "Davanagere"), ("Dharwad", "Hubballi"),
    ("Gadag", "Gadag"), ("Hassan", "Hassan"), ("Haveri", "Haveri"),
    ("Kalaburagi", "Kalaburagi"), ("Kodagu", "Madikeri"), ("Kolar", "Kolar"),
    ("Koppal", "Gangavathi"), ("Mandya", "Mandya"), ("Mysuru", "Mysuru"),
    ("Raichur", "Raichur"), ("Ramanagara", "Ramanagara"), ("Shivamogga", "Shivamogga"),
    ("Tumakuru", "Tumakuru"), ("Udupi", "Udupi"), ("Uttara Kannada", "Sirsi"),
    ("Vijayapura", "Vijayapura"), ("Vijayanagara", "Hospet"), ("Yadgir", "Yadgir"),
]

SAMPLE_PATTERNS = [
    ("East-facing residential site", "Residential", 1200, 1_000_000),
    ("Corner residential plot", "Residential", 1500, 1_550_000),
    ("Established layout site", "Residential", 1800, 2_050_000),
    ("Irrigated agricultural holding", "Agricultural", 1.75, 2_600_000),
    ("Farm land with approach road", "Agricultural", 2.4, 3_050_000),
    ("Orchard cultivation parcel", "Agricultural", 3.15, 3_650_000),
    ("Mixed-use commercial plot", "Commercial", 1100, 4_100_000),
    ("Main-road commercial site", "Commercial", 1450, 4_750_000),
    ("Gated community plot", "Residential", 2400, 5_300_000),
    ("Dry land investment parcel", "Agricultural", 4.25, 5_850_000),
]


def generated_demo_listings():
    """Generate ten stable, clearly synthetic samples for every district."""
    for district_index, (district, taluk) in enumerate(DISTRICT_LOCATIONS, start=1):
        prefix = "".join(part[0] for part in district.upper().split())[:4]
        district_adjustment = district_index * 175_000
        for pattern_index, (title, land_type, area, base_price) in enumerate(SAMPLE_PATTERNS, start=1):
            yield (
                f"DEMO-{prefix}-{district_index:02d}{pattern_index:02d}",
                f"{title}, {taluk}",
                district,
                taluk,
                land_type,
                area,
                base_price + district_adjustment + (pattern_index * 85_000),
            )


class MarketplaceService:
    def __init__(self):
        self.db = get_database()
        self.listings = self.db.marketplace_listings
        self.interests = self.db.marketplace_interests
        self._seed_demos()

    def _seed_demos(self):
        now = datetime.utcnow().isoformat()
        for survey, title, district, taluk, land_type, area, price in [*DEMO_LISTINGS, *generated_demo_listings()]:
            # Add only missing samples so existing user-created listings and prior
            # seeded records remain untouched when the catalogue is expanded.
            if self.listings.find_one({"listing_id": f"LIST-{survey}"}):
                continue
            self.listings.insert_one({
                "listing_id": f"LIST-{survey}", "property_id": None, "survey_number": survey,
                "title": title, "district": district, "taluk": taluk, "village": "Demo locality",
                "state": "Karnataka", "land_type": land_type, "area": area, "area_unit": "acres" if area < 10 else "sq ft",
                "asking_price": price, "description": "Fictitious Karnataka demonstration listing. Verify records and arrange a viewing before proceeding.",
                "seller_name": "Demo Seller", "seller_user_id": None, "seller_wallet": None,
                "status": "ACTIVE", "is_demo": True, "created_at": now, "updated_at": now,
            })

    @staticmethod
    def _public(doc):
        result = dict(doc)
        result["id"] = str(result.pop("_id", result.get("listing_id", "")))
        # Wallets and contact details never leave this API.
        result.pop("seller_wallet", None)
        result.pop("seller_user_id", None)
        return result

    def list(self, query=None, district=None, land_type=None, sort="newest"):
        rows = [x for x in self.listings.find({"status": "ACTIVE"})]
        q = (query or "").strip().lower()
        if q:
            rows = [x for x in rows if q in " ".join(str(x.get(k, "")) for k in ("title", "survey_number", "district", "taluk", "village", "land_type")).lower()]
        if district:
            rows = [x for x in rows if x.get("district", "").lower() == district.lower()]
        if land_type:
            rows = [x for x in rows if x.get("land_type", "").lower() == land_type.lower()]
        sort_options = {
            "price_asc": ("asking_price", False),
            "price_desc": ("asking_price", True),
            "area_desc": ("area", True),
            "newest": ("created_at", True),
        }
        key, reverse = sort_options.get(sort, sort_options["newest"])
        rows.sort(key=lambda x: x.get(key, 0) or 0, reverse=reverse)
        return [self._public(x) for x in rows]

    def get(self, listing_id):
        item = self.listings.find_one({"_id": listing_id}) or self.listings.find_one({"listing_id": listing_id})
        if not item or item.get("status") != "ACTIVE":
            raise APIError("Listing not found", 404)
        return self._public(item)

    def create(self, data, user):
        required = ("property_id", "asking_price", "title", "description")
        if any(not str(data.get(k, "")).strip() for k in required):
            raise APIError("Property, title, description and asking price are required", 400)
        try:
            price = float(data["asking_price"])
        except (TypeError, ValueError):
            raise APIError("Asking price must be a valid number", 400)
        if price <= 0:
            raise APIError("Asking price must be positive", 400)
        prop = self.db.properties.find_one({"_id": data["property_id"]}) or self.db.properties.find_one({"property_id": data["property_id"]})
        if not prop:
            raise APIError("Registered property not found", 404)
        if prop.get("status") != "REGISTERED":
            raise APIError("Only active registered properties can be listed", 409)
        if user.get("role") != "admin" and (prop.get("owner_wallet") or "").lower() != (user.get("wallet_address") or "").lower():
            raise APIError("Only the recorded owner can list this property", 403)
        if self.listings.find_one({"property_id": data["property_id"], "status": "ACTIVE"}):
            raise APIError("This property already has an active listing", 409)
        now = datetime.utcnow().isoformat()
        doc = {"listing_id": f"LIST-{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}", "property_id": data["property_id"],
               "survey_number": prop.get("survey_number"), "title": data["title"].strip(), "description": data["description"].strip(),
               "asking_price": price, "status": "ACTIVE", "is_demo": False, "seller_name": user.get("name") or "Property owner",
               "seller_user_id": user.get("id"), "seller_wallet": user.get("wallet_address"), "district": prop.get("district"),
               "taluk": prop.get("taluk"), "village": prop.get("village"), "state": "Karnataka", "land_type": prop.get("land_type"),
               "area": prop.get("area"), "area_unit": "sq ft", "created_at": now, "updated_at": now}
        result = self.listings.insert_one(doc); doc["_id"] = str(result.inserted_id)
        return self._public(doc)

    def mine(self, user):
        return [self._public(x) for x in self.listings.find({"seller_user_id": user.get("id")})]

    def deactivate(self, listing_id, user):
        item = self.listings.find_one({"_id": listing_id})
        if not item: raise APIError("Listing not found", 404)
        if user.get("role") != "admin" and item.get("seller_user_id") != user.get("id"): raise APIError("You cannot modify this listing", 403)
        self.listings.update_one({"_id": listing_id}, {"$set": {"status": "INACTIVE", "updated_at": datetime.utcnow().isoformat()}})

    def express_interest(self, listing_id, message, user):
        listing = self.listings.find_one({"_id": listing_id})
        if not listing or listing.get("status") != "ACTIVE": raise APIError("Active listing not found", 404)
        if listing.get("seller_user_id") == user.get("id"): raise APIError("You cannot contact yourself about this listing", 400)
        if self.interests.find_one({"listing_id": listing_id, "buyer_user_id": user.get("id")}): raise APIError("You have already expressed interest in this listing", 409)
        clean_message = (message or "I would like to arrange a viewing and discuss this property.").strip()
        if len(clean_message) < 10 or len(clean_message) > 1000: raise APIError("Message must be between 10 and 1000 characters", 400)
        result = self.interests.insert_one({"listing_id": listing_id, "buyer_user_id": user.get("id"), "buyer_name": user.get("name") or "Interested buyer", "message": clean_message, "status": "PENDING", "created_at": datetime.utcnow().isoformat()})
        return {"interest_id": str(result.inserted_id), "status": "PENDING", "notice": "Interest recorded. A listing is not a legal transfer; use the ownership transfer workflow after agreement and verification."}
