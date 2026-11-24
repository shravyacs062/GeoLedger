from flask import Blueprint, request
from utils.auth_decorators import login_required, optional_auth
from utils.auth import current_user
from utils.responses import success_response
from services.marketplace_service import MarketplaceService

marketplace_bp = Blueprint("marketplace", __name__, url_prefix="/marketplace")

@marketplace_bp.get("/listings")
@optional_auth
def listings():
    return success_response("Listings retrieved", MarketplaceService().list(**request.args.to_dict()))

@marketplace_bp.get("/listings/<listing_id>")
@optional_auth
def listing(listing_id): return success_response("Listing retrieved", MarketplaceService().get(listing_id))

@marketplace_bp.post("/listings")
@login_required
def create_listing(): return success_response("Listing created", MarketplaceService().create(request.get_json() or {}, current_user()), 201)

@marketplace_bp.get("/my-listings")
@login_required
def my_listings(): return success_response("Your listings retrieved", MarketplaceService().mine(current_user()))

@marketplace_bp.delete("/listings/<listing_id>")
@login_required
def deactivate_listing(listing_id):
    MarketplaceService().deactivate(listing_id, current_user())
    return success_response("Listing deactivated")

@marketplace_bp.post("/listings/<listing_id>/interests")
@login_required
def interest(listing_id): return success_response("Interest sent", MarketplaceService().express_interest(listing_id, (request.get_json() or {}).get("message"), current_user()), 201)
