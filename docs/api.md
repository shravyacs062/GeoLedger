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

## Authentication

Protected routes require an active HTTP-only Flask session cookie. Browser clients
must send requests with credentials enabled. Public routes do not require a session:
`GET /`, `GET /gis/property/<survey>`, and `GET /verify/property/<id>`.

---

## Health

### `GET /`

Message: `"GeoLedger backend is running"`.

---

## Auth

Authentication uses an HTTP-only, same-site Flask session cookie. Frontend API
requests must include credentials. `user` and `admin` roles are enforced by the
backend; registering with a role field never grants administrator access.

### `POST /auth/register`

| Field | Type | Required |
|---|---|---|
| `name` | string | yes |
| `email` | string | yes |
| `password` | string | yes (10+ characters) |

**201** — user account created and signed in. **409** — email already registered.

### `POST /auth/login`

Fields: `email`, `password`, and optional `role` (`user` by default, or `admin`).
An admin login only succeeds for an existing provisioned administrator.

### `GET /auth/me` · `POST /auth/logout` · `PATCH /auth/profile`

Return the current account, end its session, or update the user's name. Administrators
are provisioned using `ADMIN_EMAIL` and `ADMIN_PASSWORD`; no public admin registration
exists.

### `GET /auth/users` · `PUT /auth/users/<user_id>/role` — admin

List accounts or change a user's role. The only supported roles are `user` and
`admin`.

### Wallet ownership proof

1. `POST /auth/wallet-challenge` with `wallet_address` returns a one-time message.
2. `PATCH /auth/profile` with `wallet_address` and the wallet's `personal_sign`
   `signature` verifies and links the address. Merely knowing an address is not proof
   of control.

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

Requires a user session and a wallet linked by signature. A conflicting active
application for the survey, an already-registered survey for a new registration, or
a non-owner transfer request is rejected.

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

Public, unauthenticated, read-only record lookup by `survey_number`, `property_id`, or `_id`. Returns cadastral fields, document integrity hashes and review statuses, and `blockchain_tx_hash`; it does not return owner wallet addresses or private document contents.

`blockchain_verified` is true only when the property is found on the configured chain.
`blockchain_source` is `blockchain` when the node was queried, or `database_cached`
when the chain is unavailable. The cached registry record is still returned in the
latter case. Document hashes establish integrity relative to the stored baseline;
they do not establish that a source document is legally authentic.

The frontend's unauthenticated QR destination is
`/verify/property/<survey_number>`.

**404** if the parcel is not in the registry.
