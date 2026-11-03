from functools import wraps

from flask import g

from utils.auth import require_user
from utils.errors import APIError


def login_required(function):
    @wraps(function)
    def wrapper(*args, **kwargs):
        user = require_user()
        g.current_user = user
        g.user_id = user.get("id")
        g.user_role = (user.get("role") or "user").upper()
        g.user_email = user.get("email")
        g.wallet_address = user.get("wallet_address")
        return function(*args, **kwargs)

    return wrapper


def roles_required(*roles):
    allowed = {role.upper() for role in roles}

    def decorator(function):
        @wraps(function)
        @login_required
        def wrapper(*args, **kwargs):
            if g.user_role not in allowed:
                raise APIError("Insufficient permissions for this action", status_code=403)
            return function(*args, **kwargs)

        return wrapper

    return decorator


def admin_required(function):
    return roles_required("admin")(function)


def optional_auth(function):
    @wraps(function)
    def wrapper(*args, **kwargs):
        try:
            user = require_user()
        except APIError as error:
            if error.status_code != 401:
                raise
            user = None
        g.current_user = user
        g.user_id = user.get("id") if user else None
        g.user_role = (user.get("role") or "user").upper() if user else None
        g.user_email = user.get("email") if user else None
        g.wallet_address = user.get("wallet_address") if user else None
        return function(*args, **kwargs)

    return wrapper
