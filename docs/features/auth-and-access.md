# Authentication and access control

Requirement source: `complete.md` §1, §13, §15.

## Separate login portals

| Portal | Frontend route | Backend endpoint | Allowed roles |
|---|---|---|---|
| Citizen / User | `/login` | `POST /auth/login` | `USER` |
| Admin / Registrar | `/admin/login` | `POST /auth/admin/login` | `ADMIN`, `REGISTRAR` |

Users cannot sign in through the admin portal (403). Admins cannot use the citizen login portal (403).

Registration for citizens: `POST /auth/register` with `email`, `password` (min 8 chars), optional `full_name`, `phone`, `wallet_address`.

Legacy wallet-only registration remains available when the body contains only `wallet_address` (used when MetaMask connects).

## Session model

1. Successful login/register returns `{ user, token }`.
2. Frontend stores the JWT in `localStorage` (`geoledger_token`) and sends `Authorization: Bearer <token>`.
3. `POST /auth/logout` audits logout; the client discards the token (stateless JWT).
4. `GET /auth/me` and `PUT /auth/profile` require a valid token.

Passwords are stored with Werkzeug `generate_password_hash` / `check_password_hash`. Tokens are signed with `SECRET_KEY` (HS256, default 24h expiry).

## Role-based API protection

Decorators in `backend/utils/auth_decorators.py`:

| Decorator | Behavior |
|---|---|
| `@login_required` | Any authenticated user |
| `@admin_required` | `ADMIN` or `REGISTRAR` only |
| `@roles_required(...)` | Explicit role set |
| `@optional_auth` | Public routes that may enrich context |

Examples of admin-only operations:

- `POST /applications/<id>/approve`
- `POST /applications/<id>/reject`
- `POST /applications/<id>/request-documents`
- `POST /verification/document/<id>/review`
- `POST /blockchain/register` and `POST /blockchain/transfer`
- `PUT /valuation/params`
- `GET /auth/users`, `PUT /auth/users/<id>/role`

Frontend guards:

- `RequireAuth` → redirects to `/login`
- `RequireAdmin` → redirects to `/admin/login` or `/dashboard` if not admin
- Direct URL access to `/admin/*` is blocked without an admin JWT

## Seeded accounts (local demo)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@geoledger.local` | `Admin@12345` |
| User | `user@geoledger.local` | `User@12345` |

Created automatically on database init (`AuthService.ensure_seed_accounts`).

## Profile and wallet

Authenticated users can update `full_name`, `phone`, and linked `wallet_address` via `PUT /auth/profile`. MetaMask connect/disconnect remains available on the Profile screen for on-chain identity, but **application APIs require the JWT session**, not wallet alone.
