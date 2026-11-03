# REST API

Base URL: `http://127.0.0.1:5000`

JSON responses (except document download) use:

```json
{
  "success": true,
  "message": "…",
  "data": {}
}
```

Errors:

```json
{
  "success": false,
  "message": "…",
  "details": "only present when DEBUG=true on unhandled 500s"
}
```

## Authentication header

Protected routes require:

```
Authorization: Bearer <jwt>
```

Public (no auth): `GET /`, `GET /gis/property/<survey>`, `GET /verify/property/<id>`.

---

## Health

### `GET /`

Message: `"GeoLedger backend is running"`.

---

## Auth

### `POST /auth/register`

**Password registration**

| Field | Required |
|---|---|
| `email` | yes |
| `password` | yes (min 8) |
| `full_name`, `phone`, `wallet_address` | no |

**201** `{ user, token }`. Role is always `USER`.

**Wallet-only (legacy)** — body with only `wallet_address` registers/links a wallet user.

### `POST /auth/login`

Citizen portal. Body: `{ email, password }`.  
**200** `{ user, token }` for role `USER`. **403** if account is admin/registrar.

### `POST /auth/admin/login`

Admin portal. Same body.  
**200** for `ADMIN` / `REGISTRAR`. **403** for citizen accounts.

### `GET /auth/me` — login required

### `PUT /auth/profile` — login required

Updatable: `full_name`, `phone`, `wallet_address`.

### `POST /auth/logout` — login required

### `GET /auth/users` — admin

### `PUT /auth/users/<user_id>/role` — admin

Body: `{ "role": "USER" | "ADMIN" | "REGISTRAR" }`.

---

## Dashboard

### `GET /dashboard/admin` — admin

Pending counts, flagged docs, recent transactions, user count.

### `GET /dashboard/user` — login required

Properties and applications for the current user/wallet.

---

## Properties

### `GET /properties` — login required

### `GET /properties/<survey_number>` — login required

### `POST /properties` — admin

Legacy create from an `APPROVED` application. Prefer approve flow.

### `PUT /properties/<property_id>` — admin

### `DELETE /properties/<property_id>` — admin

---

## Applications

Prefix: `/applications`.

### `POST /applications` — login required

| Field | Required |
|---|---|
| `application_type` | yes |
| `survey_number` | yes |
| `applicant_wallet` / `wallet_address` | yes (or taken from JWT wallet) |
| party / inheritance fields | see workflows |

Aliases: `REGISTRATION`→`NEW_REGISTRATION`, `TRANSFER`→`OWNERSHIP_TRANSFER`, `INHERITANCE`→`INHERITANCE_TRANSFER`.

**409** active duplicate survey+type. Transfer/inheritance require an existing property.

### `GET /applications` — login required

Query: `applicant_wallet`, `status`, `application_type`.  
Non-admins only see their own applications.

### `GET /applications/<id>` — login required (owner or admin)

### `PUT /applications/<id>/status` — admin

### `POST /applications/<id>/approve` — admin

Verifies docs, runs chain register/transfer, completes application, may generate QR.

### `POST /applications/<id>/reject` — admin

Body: `{ "rejection_reason": "…" }`.

### `POST /applications/<id>/request-documents` — admin

Body: `{ "remarks": "…", "required_documents": ["EXTRA_TYPE"] }`.

---

## Documents

### `POST /documents/upload` — login required

`multipart/form-data`: `file`, `document_type`, `application_id` and/or `property_id`.

Returns hash, `extracted_fields`, `verification_checks`, initial status (`PENDING` or `REQUIRES_MANUAL_REVIEW`).

### `GET /documents/application/<application_id>` — login required

### `GET /documents/property/<property_id>` — login required

### `GET /documents/download/<document_id>` — login required

### `DELETE /documents/<document_id>` — login required

---

## Verification

### `POST /verification/document/<id>` — login required

SHA-256 integrity re-check. Optional body `{ status, remarks }` acts as review for admins.

### `POST /verification/document/<id>/review` — admin

```json
{ "status": "VERIFIED", "remarks": "…" }
```

Allowed: `VERIFIED`, `REJECTED`, `REQUIRES_MANUAL_REVIEW`, `PENDING`.

---

## Ownership

### `POST /ownership/transfer` — login required

Creates `OWNERSHIP_TRANSFER` application (no immediate chain write).

### `GET /ownership/history/<property_id>` — login required

Use `ALL` for full ledger.

---

## Notifications

### `GET /notifications` — login required

### `POST /notifications/<id>/read` — login required

### `POST /notifications/read-all` — login required

---

## Valuation

### `POST /valuation/estimate` — login required

### `GET /valuation/params` — login required

### `PUT /valuation/params` — admin

---

## QR codes

### `GET /qr/property/<identifier>` — login required

### `POST /qr/generate` — login required

Body: `{ "survey_number" }` or `{ "property_id" }`. Returns `verify_url` and optional `qr_image_base64`.

---

## GIS

### `GET /gis/property/<survey_number>` — public

`status`: `"found"` (demo GeoJSON) or `"generated"` (synthetic rectangle).

---

## Blockchain bridge

### `POST /blockchain/register` — admin

### `POST /blockchain/transfer` — admin

### `GET /blockchain/property/<property_id>` — login required

### `GET /blockchain/transactions` — login required

Prefer application approve for workflow-gated chain writes.

---

## Public verification

### `GET /verify/property/<identifier>` — public

Cadastral fields, owner wallets, document hashes, blockchain match when available. No private file contents.
