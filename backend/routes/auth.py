from flask import Blueprint

from controllers.auth_controller import (
    register_user,
    status,
    login_user,
    login_admin,
    me,
    update_profile,
    logout,
    list_users,
    set_role,
)

auth_bp = Blueprint("auth", __name__)

auth_bp.route("/", methods=["GET"])(status)
auth_bp.route("/auth/register", methods=["POST"])(register_user)
auth_bp.route("/auth/login", methods=["POST"])(login_user)
auth_bp.route("/auth/admin/login", methods=["POST"])(login_admin)
auth_bp.route("/auth/me", methods=["GET"])(me)
auth_bp.route("/auth/profile", methods=["PUT"])(update_profile)
auth_bp.route("/auth/logout", methods=["POST"])(logout)
auth_bp.route("/auth/users", methods=["GET"])(list_users)
auth_bp.route("/auth/users/<user_id>/role", methods=["PUT"])(set_role)
