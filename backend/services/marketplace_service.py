from datetime import datetime

from database.client import get_database
from utils.errors import APIError


DEMO_LISTINGS = [
    ("DEMO-KOD-101", "Coffee estate parcel", "Kodagu", "Madikeri", "Agricultural", 2.25, 18500000),
    ("DEMO-MYS-204", "Residential corner site", "Mysuru", "Mysuru", "Residential", 2400, 7200000),
    ("DEMO-HSN-087", "Irrigated farm land", "Hassan", "Belur", "Agricultural", 1.6, 9600000),
    ("DEMO-MNG-032", "Coastal residential plot", "Dakshina Kannada", "Mangaluru", "Residential", 1800, 5400000),
]


class MarketplaceService:
    def __init__(self):
        self.db = get_database()
        self.listings = self.db.marketplace_listings
        self.interests = self.db.marketplace_interests
        self._seed_demos()

    def _seed_demos(self):
        if self.listings.count_documents({}) > 0:
            return
        now = datetime.utcnow().isoformat()
        for survey, title, district, taluk, land_type, area, price in DEMO_LISTINGS:
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
        key, reverse = ("asking_price", sort == "price_desc") if sort.startswith("price") else ("created_at", True)
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
