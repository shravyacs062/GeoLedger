# GeoLedger demonstration guide

Complete walkthrough of major workflows for demos and acceptance testing (`complete.md` §17).

## Prerequisites

1. Backend running on `:5000` (`cd backend && . venv/bin/activate && python app.py`)
2. Frontend running on `:5173` (`cd frontend && npm run dev`)
3. Optional: Hardhat node + deployed contract (otherwise blockchain simulation mode is used)

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Citizen | `user@geoledger.local` | `User@12345` |
| Admin | `admin@geoledger.local` | `Admin@12345` |

---

## Demo 1 — Separate logins and access control

1. Open `http://localhost:5173/` → **Citizen Login** → sign in as user.
2. Confirm redirect to `/dashboard`. Try navigating to `/admin` → redirected away.
3. Log out. Open **Admin** → sign in as admin → `/admin`.
4. Confirm citizen cannot call approve APIs (403 without admin token).

---

## Demo 2 — New land registration (end to end)

1. As **user**, go to **Register Property** (`/applications/new`).
2. Enter a unique survey (e.g. `SN-DEMO-REG-001`), owner details, location, area.
3. Upload `SALE_DEED`, `ID_PROOF`, `MUTATION_CERTIFICATE`.
4. Submit → note application id and status `SUBMITTED` / `UNDER_REVIEW`.
5. Log in as **admin** → Admin Dashboard → open the pending application.
6. **Verify Documents** → each doc status becomes Verified.
7. **Approve & Execute On-Chain** → status `COMPLETED`, tx hash shown.
8. As user: property appears under **My Properties**; QR available on property details.
9. Open public page `/public/verify/SN-DEMO-REG-001` (no login).

---

## Demo 3 — Ownership transfer

1. As **user** (owner wallet linked), open `/transfer` with an existing survey (e.g. demo or newly registered).
2. Enter buyer name + new wallet address.
3. Submit transfer application; upload required transfer documents.
4. As **admin**, verify docs → approve.
5. Confirm property owner wallet updated and transfer notification created.
6. Public verify page shows the new owner.

---

## Demo 4 — Inheritance transfer

1. As **user**, open `/inheritance`.
2. Enter survey of an existing property, deceased owner name, relationship, heir wallet, legal heirs list.
3. Upload all required legal documents (death certificate, legal heir certificate, family tree, NOC, mutation, existing ownership docs, new owner ID).
4. Submit → admin reviews checklist and extracted fields.
5. Approve → ownership transfers on-chain (does **not** attempt a second registration).
6. Confirm applicant notified and property owner updated.

---

## Demo 5 — Document verification & rejection path

1. Upload a document, then have admin mark it `REJECTED` with remarks.
2. Admin **Request Documents** with correction instructions.
3. User uploads a corrected file.
4. Admin verifies → approve (or reject the whole application).
5. Show integrity re-check: `POST /verification/document/<id>` after a successful upload.

---

## Demo 6 — GIS, QR, valuation

1. **GIS Map** `/map` — search `SN-DEMO-001`, show parcel polygon (demo GeoJSON).
2. **Property Details** — regenerate QR, scan or open the public URL.
3. **Land Valuation** `/valuation` — estimate for 2500 sq ft Residential / Mysuru; show disclaimer.
4. As admin, change residential base rate and re-estimate.

---

## Demo 7 — Dashboards and notifications

1. Admin dashboard shows pending counts and recent chain transactions.
2. User dashboard shows owned properties and application activity.
3. `/notifications` shows submit / approve / reject / transfer events; mark read.

---

## Acceptance checklist (quick)

- [ ] Separate admin and user logins with URL protection  
- [ ] Registration, transfer, and inheritance complete including approve  
- [ ] Document verification statuses and admin remarks work  
- [ ] Inheritance uses transfer on-chain after approval  
- [ ] Blockchain write only after admin approve  
- [ ] GIS map, QR, public verify work  
- [ ] Dashboards show real data  
- [ ] Reject / request-docs / resubmit path works  
