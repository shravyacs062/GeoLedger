def create_indexes(db):

    # Users
    existing_user_indexes = db.users.index_information()
    wallet_index = existing_user_indexes.get("wallet_address_1")
    if wallet_index and not wallet_index.get("sparse"):
        db.users.drop_index("wallet_address_1")
    db.users.create_index("wallet_address", unique=True, sparse=True)
    existing_email_indexes = db.users.index_information()
    email_index = existing_email_indexes.get("email_1")
    if email_index and not email_index.get("sparse"):
        db.users.drop_index("email_1")
    db.users.create_index("email", unique=True, sparse=True)

    # Properties
    db.properties.create_index(
        "survey_number",
        unique=True
    )

    db.properties.create_index(
        "owner_wallet"
    )

    # Applications
    db.applications.create_index(
        "applicant_wallet"
    )

    db.applications.create_index(
        "survey_number"
    )

    db.applications.create_index(
        "status"
    )

    # Documents
    db.documents.create_index(
        "property_id"
    )

    db.documents.create_index(
        "application_id"
    )

    # Transactions
    db.transactions.create_index(
        "property_id"
    )

    db.transactions.create_index(
        "timestamp"
    )
    db.notifications.create_index([("user_id", 1), ("created_at", -1)])