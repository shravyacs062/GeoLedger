# GeoLedger Implementation Status (vs feature docs)

Audited against `docs/features/*` and fixed gaps in this pass.

## Feature status

| Feature doc | Status | Notes |
|---|---|---|
| Auth & access | **Implemented** | User/Admin login, JWT, RBAC, `/admin/users` role management |
| Ownership workflows | **Implemented** | Registration checklist fixed; transfer uploads; inheritance; seller ownership check; app detail re-upload |
| Document verification | **Implemented** | API-backed `/verify` screen; per-doc review; extracted fields + checks |
| Blockchain & GIS | **Implemented** | Approve-gated chain writes; GIS demo vs synthetic labeling |
| QR & public verify | **Implemented** | QR on property details; public page field-aligned with API |
| Land valuation | **Implemented** | Estimate + full admin param editor (rates + multipliers) |
| Dashboards & notifications | **Implemented** | Live admin/user stats; unread badge; notification API UI |

## Seeded accounts

- Admin: `admin@geoledger.local` / `Admin@12345`
- User: `user@geoledger.local` / `User@12345`

## Still optional / deferred

- Full Tesseract OCR (heuristic extraction works without it)
- Cloud / IPFS document storage (local disk + hash)
- Interactive polygon draw on registration map (lat/lon + GIS search exist)
- Solidity `onlyRegistrar` on `registerProperty` (backend already gates writes)
- Production hardening (HTTPS, CORS lockdown, secret rotation)

## Verify

```bash
cd backend && . venv/bin/activate && pytest tests/test_app.py
cd frontend && npx tsc -b
```

See [demo-guide.md](./demo-guide.md) for end-to-end walkthroughs.
