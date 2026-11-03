from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

from config import Config
from database.client import init_db, close_db
from routes import register_blueprints
from utils.errors import APIError
from utils.responses import error_response


def create_app(testing=False):

    load_dotenv()

    app = Flask(__name__)

    app.config.from_object(Config)

    if testing:
        app.config["TESTING"] = True

    if not testing and app.config["APP_ENV"] == "production":
        if app.config["DEBUG"]:
            raise RuntimeError("DEBUG must be disabled when APP_ENV=production")
        if len(app.config["SECRET_KEY"]) < 32 or app.config["SECRET_KEY"] == "change-me":
            raise RuntimeError("Set a unique SECRET_KEY of at least 32 characters in production")
        if not app.config["SESSION_COOKIE_SECURE"]:
            raise RuntimeError("SESSION_COOKIE_SECURE must be enabled in production")
        if not app.config["ADMIN_EMAIL"] or not app.config["ADMIN_PASSWORD"]:
            raise RuntimeError("ADMIN_EMAIL and ADMIN_PASSWORD are required in production")
        if not app.config["FRONTEND_ORIGINS"] or any(
            not origin.startswith("https://")
            for origin in app.config["FRONTEND_ORIGINS"]
        ):
            raise RuntimeError("Configure FRONTEND_ORIGINS with HTTPS origins in production")

    if not testing and app.config["SECRET_KEY"] == "change-me":
        raise RuntimeError("Set a strong SECRET_KEY before starting GeoLedger")

    CORS(
        app,
        supports_credentials=True,
        origins=app.config["FRONTEND_ORIGINS"],
    )

    if not testing and app.config["APP_ENV"] == "production":
        from services.blockchain_service import BlockchainService

        BlockchainService()

    # Initialize database
    init_db(app)
    from services.auth_service import AuthService
    AuthService().bootstrap_admin(
        app.config["ADMIN_EMAIL"],
        app.config["ADMIN_PASSWORD"],
    )

    # Register API routes
    register_blueprints(app)

    @app.errorhandler(APIError)
    def handle_api_error(error):
        return error_response(
            error.message,
            status_code=error.status_code
        )

    @app.errorhandler(404)
    def handle_not_found(_error):
        return error_response(
            "Endpoint not found",
            status_code=404
        )

    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        from werkzeug.exceptions import HTTPException
        if isinstance(error, HTTPException):
            return error_response(error.description, status_code=error.code)

        if app.config.get("DEBUG"):
            details = str(error)
        else:
            details = None

        return error_response(
            "An unexpected error occurred",
            status_code=500,
            details=details
        )

    return app


if __name__ == "__main__":

    if os.getenv("SECRET_KEY", "change-me") == "change-me":
        raise RuntimeError("Set a strong SECRET_KEY in backend/.env before starting GeoLedger")
    application = create_app()

    try:
        application.run(
            host="0.0.0.0",
            port=5000,
            debug=application.config["DEBUG"]
        )
    finally:
        close_db()