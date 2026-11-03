# Data model

Persistence is either MongoDB (`geoledger`) or SQLite (`backend/geoledger.db`) with the same collection names. SQLite stores each document as JSON in a table named after the collection.

Ids are strings. Mongo uses ObjectId hex; SQLite uses generated string ids. Serialized API objects expose `_id`, and often also `id` / `application_id` / `document_id` / `property_id`.

## Collections

### `users`

| Field | Notes |
|---|---|
| `email` | Unique for password accounts |
| `password_hash` | Werkzeug hash (null for wallet-only legacy rows) |
| `role` | `USER` \| `ADMIN` |
| `full_name`, `phone` | Profile fields |
| `wallet_address` | Optional linked MetaMask address |
| `is_active` | Soft disable |
| `created_at`, `updated_at` | |

Created by `POST /auth/register` (password or wallet). Authorization uses JWT claims derived from this record.

### `properties`

| Field | Notes |
|---|---|
| `property_id` | e.g. `GL-PROP-SN-DEMO-001` or Mongo `_id` |
| `survey_number` | Unique cadastral key; this is what the contract uses as `propertyId` |
| `owner_wallet` | Current owner |
| `land_type` | e.g. Residential |
| `village`, `taluk`, `district`, `state` | Administrative location |
| `area` | Square feet in seed data |
| `geojson_reference` | Usually the survey number |
| `status` | `REGISTERED` \| `PENDING_TRANSFER` \| `TRANSFERRED` \| `UNDER_DISPUTE` |
| `blockchain_tx_hash` | Registration tx |
| `blockchain_block_number` | |
| `qr_code_url`, `qr_generated_at` | Public verify link for QR |
| `application_id` | Originating application (manual create path) |
| `document_ids` | Optional |
| `created_at`, `updated_at` | |

Seeded demo: `SN-DEMO-001` / `GL-PROP-001` in Thandavapura, Nanjangud, Mysuru, Karnataka, 2500 sq ft, owner `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`.

### `applications`

| Field | Notes |
|---|---|
| `application_type` | See types below |
| `applicant_wallet` | |
| `applicant_user_id` | Authenticated user id |
| `survey_number` | |
| `property_id` | Defaults to survey number |
| `status` | See [workflows](./workflows.md#status-machine) |
| `required_documents` | String list of types |
| `submitted_documents` | Document ids |
| `party_details` | Applicant / buyer / seller / heirs / deceased owner |
| `admin_remarks` | Correction or rejection notes |
| `correction_requested` | Boolean |
| `government_reference` | `GOV-REQ-<survey_number>` |
| `rejection_reason` | |
| `verification_summary` | Filled on approve |
| `blockchain_transaction_hash` | |
| `blockchain_block_number` | |
| `blockchain_status` | e.g. `CONFIRMED` |
| `created_at`, `updated_at` | |

### `documents`

| Field | Notes |
|---|---|
| `application_id` / `property_id` | At least one set on upload |
| `survey_number` | Linked after successful registration |
| `document_type` | Uppercased |
| `filename` / `stored_filename` | |
| `storage_location` | Absolute path under `UPLOAD_FOLDER` |
| `file_size` | Bytes |
| `document_hash` | SHA-256 hex |
| `verification_status` | `PENDING` \| `VERIFIED` \| `REJECTED` \| `REQUIRES_MANUAL_REVIEW` |
| `verification_score` | Heuristic score |
| `verification_checks` | Integrity / cross-check objects |
| `extracted_fields` / `ocr_meta` | Automated extraction |
| `document_number`, `issuing_authority`, `issue_date` | When extracted |
| `verification_notes` | Reviewer remarks |
| `uploaded_at`, `verified_at` | |

### `transactions`

| Field | Notes |
|---|---|
| `property_id`, `survey_number`, `application_id` | |
| `transaction_type` | `REGISTRATION`, `OWNERSHIP_TRANSFER`, or `INHERITANCE_TRANSFER` |
| `previous_owner`, `new_owner` | Wallets or `GOVERNMENT_AUTHORITY` |
| `from_address`, `to_address` | Admin and new owner |
| `tx_hash`, `block_number` | |
| `status` | `CONFIRMED` |
| `timestamp` | |

### `notifications`

| Field | Notes |
|---|---|
| `recipient_id` / `recipient_wallet` / `recipient_role` | Targeting |
| `title`, `message`, `notification_type` | |
| `related_id`, `related_type` | e.g. application |
| `is_read`, `read_at`, `created_at` | |

### `audit_logs`

Admin/user action trail: `action`, `entity_type`, `entity_id`, `actor_*`, `details`, `created_at`.

### `valuation_params`

Key `default` stores adjustable base rates and multipliers for the valuation module.

## Application types

```
NEW_REGISTRATION
OWNERSHIP_TRANSFER
INHERITANCE_TRANSFER
```

Aliases accepted on create: `REGISTRATION`, `TRANSFER`, `INHERITANCE`.

## Document requirements

Defined in `backend/utils/document_requirements.py`.

| Type | Required documents |
|---|---|
| `NEW_REGISTRATION` | `SALE_DEED`, `ID_PROOF`, `MUTATION_CERTIFICATE` |
| `OWNERSHIP_TRANSFER` | `SALE_DEED`, `SELLER_ID_PROOF`, `BUYER_ID_PROOF`, `MUTATION_CERTIFICATE` |
| `INHERITANCE_TRANSFER` | `DEATH_CERTIFICATE`, `LEGAL_HEIR_CERTIFICATE`, `FAMILY_TREE`, `NOC_FROM_LEGAL_HEIRS`, `MUTATION_CERTIFICATE`, `EXISTING_OWNERSHIP_DOCUMENTS`, `NEW_OWNER_ID_PROOF` |

## Indexes (Mongo only)

- `users.wallet_address` unique
- `properties.survey_number` unique
- `properties.owner_wallet`
- `applications.applicant_wallet`, `survey_number`, `status`
- `documents.property_id`, `application_id`
- `transactions.property_id`, `timestamp`

## GIS GeoJSON

`backend/geojson/demo_parcels.json` is a `FeatureCollection` of polygons (WGS84 lon/lat). Feature properties include `survey_number`, `property_id`, `locality`, `district`, `state`, `area_sqft`, `land_type`, `owner_wallet`.
