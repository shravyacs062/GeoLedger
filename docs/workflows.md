# Workflows

Canonical feature guide: [Ownership workflows](./features/ownership-workflows.md).

These are the paths the system implements end to end. All mutating admin steps require an **Admin/Registrar JWT**.

## New registration

```
Applicant                  API                         Chain
   │                       │                            │
   │ POST /auth/login      │  JWT                       │
   │ POST /applications    │                            │
   │ type=NEW_REGISTRATION │  status = SUBMITTED        │
   │                       │  required_documents set    │
   │                       │                            │
   │ POST /documents/upload│  SHA-256 + OCR checks      │
   │  (each required type) │  status → UNDER_REVIEW     │
   │                       │                            │
   │                       │  admin:                    │
   │                       │  POST …/review VERIFIED    │
   │                       │  all required verified     │
   │                       │  status → VERIFIED         │
   │                       │                            │
   │                       │  admin POST …/approve      │
   │                       │  BLOCKCHAIN_PENDING        │
   │                       │  registerProperty(survey) ─┼─► PropertyRegistered
   │                       │  insert properties row     │
   │                       │  generate QR               │
   │                       │  status → COMPLETED        │
```

Required files: `SALE_DEED`, `ID_PROOF`, `MUTATION_CERTIFICATE`.

Approve will not run the chain call until every required type is uploaded **and** `verification_status == VERIFIED`. Missing types → `DOCUMENTS_PENDING` (409). Unverified types → `UNDER_REVIEW` (409). Failed RPC/tx → `BLOCKCHAIN_FAILED` (502).

On success the property id is `GL-PROP-<survey_number>`, documents are linked, QR is generated, and the applicant wallet becomes `owner_wallet`.

## Ownership transfer

```
Seller                     API                         Chain
   │ POST /ownership/transfer                           │
   │  survey + buyer_wallet│  OWNERSHIP_TRANSFER app    │
   │                       │                            │
   │ upload required docs  │  same review path as above │
   │ admin POST …/approve  │  transferOwnership(survey)─┼─► OwnershipTransferred
   │                       │  properties.owner_wallet   │
   │                       │    = buyer wallet          │
   │                       │  status = TRANSFERRED      │
```

Required files: `SALE_DEED`, `SELLER_ID_PROOF`, `BUYER_ID_PROOF`, `MUTATION_CERTIFICATE`.

New owner is `party_details.buyer.wallet_address`, falling back to `applicant_wallet`. Chain call is signed by the backend registrar key.

## Inheritance transfer

```
Heir                       API                         Chain
   │ POST /applications    │                            │
   │ INHERITANCE_TRANSFER  │  legal checklist required  │
   │ upload death/heir docs│  OCR + manual review       │
   │ admin POST …/approve  │  transferOwnership(survey)─┼─► OwnershipTransferred
```

Required files:

- `DEATH_CERTIFICATE`
- `LEGAL_HEIR_CERTIFICATE`
- `FAMILY_TREE`
- `NOC_FROM_LEGAL_HEIRS`
- `MUTATION_CERTIFICATE`
- `EXISTING_OWNERSHIP_DOCUMENTS`
- `NEW_OWNER_ID_PROOF`

Inheritance **transfers** existing on-chain ownership; it does not call `registerProperty`.

## Document integrity

See [Document verification](./features/document-verification.md).

1. Upload stores `document_hash = sha256(file_bytes)` and runs extraction/cross-checks.
2. `POST /verification/document/<id>` re-reads the file and compares hashes.
3. `POST /verification/document/<id>/review` is the admin authenticity decision.

## Public lookup

`GET /verify/property/<survey_or_property_id>` is unauthenticated. Frontend page: `/public/verify/:identifier`.

## Status machine

```
SUBMITTED ──► UNDER_REVIEW ──► DOCUMENTS_PENDING
                 │
                 ▼
              VERIFIED ──► BLOCKCHAIN_PENDING ──► COMPLETED
                 │                                  │
                 └──────── REJECTED          BLOCKCHAIN_FAILED
```

| Event | Status |
|---|---|
| `create_application` | `SUBMITTED` |
| First document linked | `UNDER_REVIEW` |
| Missing required types | `DOCUMENTS_PENDING` |
| All required types `VERIFIED` | `VERIFIED` |
| Approve starts | `BLOCKCHAIN_PENDING` |
| Chain success | `COMPLETED` |
| Chain failure | `BLOCKCHAIN_FAILED` |
| Reject / request docs | `REJECTED` / `DOCUMENTS_PENDING` |

Property statuses: `REGISTERED`, `PENDING_TRANSFER`, `TRANSFERRED`, `UNDER_DISPUTE`.
