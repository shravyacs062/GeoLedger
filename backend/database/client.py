import os
from flask import current_app
from database.sqlite_store import SQLiteDatabase
from database.seed_data import seed_demo_data

_db_instance = None
_db_type = "none"


def init_db(app):
    global _db_instance, _db_type

    mongo_uri = app.config.get("MONGO_URI")
    db_name = app.config.get("DATABASE_NAME", "geoledger")

    # Production must fail closed instead of silently switching to an ephemeral/local database.
    if not mongo_uri and app.config.get("APP_ENV") == "production":
        raise RuntimeError("MONGO_URI must be configured when APP_ENV=production")

    # 1. Attempt MongoDB connection if configured
    if mongo_uri:
        try:
            from pymongo import MongoClient
            from database.indexes import create_indexes

            client = MongoClient(mongo_uri, serverSelectionTimeoutMS=2000)
            client.admin.command("ping")
            app.db = client[db_name]
            _db_instance = app.db
            _db_type = "mongodb"
            create_indexes(app.db)
            if app.config.get("APP_ENV") != "production":
                seed_demo_data(app.db)
            print("MongoDB connected successfully.")
            return
        except Exception as e:
            if app.config.get("APP_ENV") == "production":
                raise RuntimeError("MongoDB connection is required when APP_ENV=production") from e
            print(f"MongoDB connection failed: {e}")
            print("Falling back to local SQLite storage (geoledger.db)...")

    # 2. SQLite Fallback
    if app.config.get("APP_ENV") == "production":
        raise RuntimeError("SQLite fallback is disabled when APP_ENV=production")
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sqlite_file = "geoledger_test.db" if app.config.get("TESTING") else "geoledger.db"
    sqlite_path = os.path.join(backend_dir, sqlite_file)
    app.db = SQLiteDatabase(sqlite_path)
    _db_instance = app.db
    _db_type = "sqlite"
    seed_demo_data(app.db)
    print(f"SQLite database initialized at: {sqlite_path}")


def get_database():
    global _db_instance
    try:
        if current_app and hasattr(current_app, "db") and current_app.db is not None:
            return current_app.db
    except RuntimeError:
        pass

    if _db_instance is not None:
        return _db_instance

    if os.getenv("APP_ENV", "development").strip().lower() == "production":
        raise RuntimeError("Database is not initialized; configure MongoDB and restart GeoLedger")

    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sqlite_path = os.path.join(backend_dir, "geoledger.db")
    _db_instance = SQLiteDatabase(sqlite_path)
    return _db_instance


def get_database_type():
    global _db_type
    return _db_type


def close_db():
    global _db_instance
    _db_instance = None
