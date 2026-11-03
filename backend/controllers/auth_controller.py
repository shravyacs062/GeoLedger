from flask import request, g

from services.auth_service import AuthService
from utils.responses import success_response
from utils.auth_decorators import login_required, admin_required


def get_auth_service():
    return AuthService()


def status():
    return success_response("GeoLedger backend is running")


def register_user():
    data = request.get_json() or {}
    # Support both password registration and legacy wallet registration
    if data.get("email") and data.get("password"):
        result = get_auth_service().register_user(data)
        return success_response(
            "User registered successfully",
            data=result,
            status_code=201,
        )

    user = get_auth_service().register_wallet(data)
    return success_response(
        "Wallet registered successfully",
        data=user,
        status_code=201,
    )


def login_user():
    data = request.get_json() or {}
    result = get_auth_service().login_user(data)
    return success_response("Login successful", data=result)


def login_admin():
    data = request.get_json() or {}
    result = get_auth_service().login_admin(data)
    return success_response("Admin login successful", data=result)


@login_required
def me():
    profile = get_auth_service().get_profile(g.user_id)
    return success_response("Profile retrieved", data=profile)


@login_required
def update_profile():
    data = request.get_json() or {}
    profile = get_auth_service().update_profile(g.user_id, data)
    return success_response("Profile updated", data=profile)


@login_required
def logout():
    # Stateless JWT — client discards token; audit only
    from utils.audit import log_audit

    log_audit("USER_LOGOUT", "user", g.user_id)
    return success_response("Logged out successfully")


@admin_required
def list_users():
    users = get_auth_service().list_users()
    return success_response("Users retrieved", data=users)


@admin_required
def set_role(user_id):
    data = request.get_json() or {}
    user = get_auth_service().set_user_role(user_id, data.get("role"))
    return success_response("User role updated", data=user)
