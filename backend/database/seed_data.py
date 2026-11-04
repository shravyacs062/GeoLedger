from datetime import datetime


def seed_demo_data(db):
    try:
        if db.properties.count_documents({}) == 0:
            demo_property = {
                "property_id": "GL-PROP-001",
                "survey_number": "SN-DEMO-001",
                "owner_wallet": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                "land_type": "Residential",
                "village": "Thandavapura",
                "taluk": "Nanjangud",
                "district": "Mysuru",
                "state": "Karnataka",
                "area": 2500.0,
                "geojson_reference": "SN-DEMO-001",
                "status": "REGISTERED",
                "blockchain_tx_hash": "0x5c79e6f809930e466b04323be0b86561f52fb827e8a9463ae7ef76956f2f275e",
                "blockchain_block_number": 1,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }
            db.properties.insert_one(demo_property)

            demo_tx = {
                "property_id": "GL-PROP-001",
                "survey_number": "SN-DEMO-001",
                "transaction_type": "REGISTRATION",
                "previous_owner": "GOVERNMENT_AUTHORITY",
                "new_owner": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                "from_address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                "to_address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                "tx_hash": "0x5c79e6f809930e466b04323be0b86561f52fb827e8a9463ae7ef76956f2f275e",
                "block_number": 1,
                "status": "CONFIRMED",
                "timestamp": datetime.utcnow().isoformat(),
            }
            db.transactions.insert_one(demo_tx)
            print("Demo property and initial transaction seeded successfully.")
    except Exception as e:
        print(f"Warning: Failed to seed demo data: {e}")
