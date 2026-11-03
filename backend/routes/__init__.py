from flask import Flask

from .auth import auth_bp
from .properties import properties_bp
from .documents import documents_bp
from .ownership import ownership_bp
from .gis import gis_bp
from .blockchain import blockchain_bp
from .applications import applications_bp
from .verification import verification_bp
from .public_verify import public_verify_bp
from .notifications import notifications_bp
from .dashboard import dashboard_bp
from .valuation import valuation_bp
from .qr import qr_bp


def register_blueprints(app: Flask) -> None:

    app.register_blueprint(auth_bp)
    app.register_blueprint(properties_bp)
    app.register_blueprint(documents_bp)
    app.register_blueprint(ownership_bp)
    app.register_blueprint(gis_bp)
    app.register_blueprint(blockchain_bp)
    app.register_blueprint(applications_bp)
    app.register_blueprint(verification_bp)
    app.register_blueprint(public_verify_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(valuation_bp)
    app.register_blueprint(qr_bp)