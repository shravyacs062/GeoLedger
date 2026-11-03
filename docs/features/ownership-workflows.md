# Three land ownership workflows

Requirement source: `complete.md` §2, §10.

All three workflows share the same application engine (`ApplicationService`), document checklist, verification path, and admin approve/reject gates. Blockchain writes run **only after** admin approval.

Application types (normalized on create):

| UI / alias | Stored type |
|---|---|
| Registration | `NEW_REGISTRATION` |
| Ownership transfer (sale/gift) | `OWNERSHIP_TRANSFER` |
| Inheritance | `INHERITANCE_TRANSFER` |

Every submission receives a unique application id (`_id` / `application_id`).

---

## 1. New land registration

**User path:** Dashboard → Register Property (`/applications/new`)

### Steps

1. Enter owner details and property information (survey number, location, area, land type).
2. Optionally supply map coordinates / GIS reference.
3. Upload required documents.
4. Submit → `POST /applications` (`NEW_REGISTRATION`).
5. Admin reviews documents and application.
6. Admin approves → backend calls `registerProperty(survey, owner)` on-chain.
7. Property row created (`GL-PROP-<survey>`), QR generated, shown on user dashboard.

### Required documents

- `SALE_DEED`
- `ID_PROOF`
- `MUTATION_CERTIFICATE`

### Duplicate / conflict checks

- Active application with the same survey + type blocks create (409).
- Duplicate file hashes are flagged during upload.

---

## 2. Ownership transfer (sale / gift / other)

**User path:** `/transfer` (also linked from property details)

### Steps

1. Existing owner selects property (survey number).
2. Enters new owner name and wallet.
3. Submits via `POST /ownership/transfer` (creates `OWNERSHIP_TRANSFER` application).
4. Uploads transfer documents on the application detail page.
5. System verifies seller ownership against the property record.
6. Admin reviews and approves → `transferOwnership(survey, newOwner)` on-chain.
7. `properties.owner_wallet` updated; status set to `TRANSFERRED`.
8. Both parties notified.

### Required documents

- `SALE_DEED`
- `SELLER_ID_PROOF`
- `BUYER_ID_PROOF`
- `MUTATION_CERTIFICATE`

Property must already exist in the registry.

---

## 3. Inheritance transfer (death of owner)

**User path:** `/inheritance`

### Steps

1. Applicant identifies deceased owner and registered property.
2. Enters relationship and all legal heirs.
3. Uploads the legal document checklist (mandatory).
4. Submit → `POST /applications` (`INHERITANCE_TRANSFER`).
5. Automated validation + admin legal review.
6. Admin approves → **on-chain ownership transfer** (not a new registration).
7. Property owner updated; applicant and relevant parties notified.

### Required documents

- `DEATH_CERTIFICATE`
- `LEGAL_HEIR_CERTIFICATE`
- `FAMILY_TREE`
- `NOC_FROM_LEGAL_HEIRS`
- `MUTATION_CERTIFICATE`
- `EXISTING_OWNERSHIP_DOCUMENTS`
- `NEW_OWNER_ID_PROOF`

### Inheritance-specific checks

- Property must already be registered.
- If `deceased_owner_wallet` is provided, it must match the current registered owner.
- New owner wallet is taken from heir / `party_details.buyer.wallet_address`.

---

## Shared application lifecycle

```
SUBMITTED
  → UNDER_REVIEW / DOCUMENTS_PENDING
  → VERIFIED (all required docs admin-verified)
  → BLOCKCHAIN_PENDING
  → COMPLETED
       or REJECTED
       or BLOCKCHAIN_FAILED
```

Admin actions (JWT admin only):

| Action | Endpoint |
|---|---|
| Approve + chain write | `POST /applications/<id>/approve` |
| Reject with remarks | `POST /applications/<id>/reject` |
| Request corrections | `POST /applications/<id>/request-documents` |

Users track every application under `/applications` and `/applications/:id`.
