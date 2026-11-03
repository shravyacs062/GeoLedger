from functools import wraps

import jwt
from flask import g, request, current_app

from utils.errors import APIError


def _decode_token(token: str) -> dict:
    try:
        return jwt.decode(
            token,
            current_app.config["SECRET_KEY"],
            algorithms=[current_app.config.get("JWT_ALGORITHM", "HS256")],
        )
    except jwt.ExpiredSignatureError:
        raise APIError("Token has expired. Please log in again.", status_code=401)
    except jwt.InvalidTokenError:
        raise APIError("Invalid authentication token", status_code=401)


def _extract_bearer() -> str | None:
    header = request.headers.get("Authorization", "")
    if header.startswith("Bearer "):
        return header[7:].strip()
    return None


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        token = _extract_bearer()
        if not token:
            raise APIError("Authentication required", status_code=401)
        payload = _decode_token(token)
        g.current_user = payload
        g.user_id = payload.get("sub")
        g.user_role = (payload.get("role") or "USER").upper()
        g.user_email = payload.get("email")
        g.wallet_address = payload.get("wallet_address")
        return fn(*args, **kwargs)

    return wrapper


def roles_required(*roles):
    allowed = {r.upper() for r in roles}

    def decorator(fn):
        @wraps(fn)
        @login_required
        def wrapper(*args, **kwargs):
            role = (getattr(g, "user_role", None) or "").upper()
            if role not in allowed:
                raise APIError("Insufficient permissions for this action", status_code=403)
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def admin_required(fn):
    return roles_required("ADMIN", "REGISTRAR")(fn)


def optional_auth(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        token = _extract_bearer()
        if token:
            try:
                payload = _decode_token(token)
                g.current_user = payload
                g.user_id = payload.get("sub")
                g.user_role = (payload.get("role") or "USER").upper()
                g.user_email = payload.get("email")
                g.wallet_address = payload.get("wallet_address")
            except APIError:
                g.current_user = None
        else:
            g.current_user = None
        return fn(*args, **kwargs)

    return wrapper
