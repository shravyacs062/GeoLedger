# Authentication and access control

## Separate login portals

| Portal | Frontend route | Backend endpoint | Allowed role |
|---|---|---|---|
| User | `/login` | `POST /auth/login` | `user` |
| Admin | `/admin/login` | `POST /auth/login` | `admin` |

Both portals use the role submitted with the login request. Public registration
(`POST /auth/register`) requires `name`, `email`, and a password of at least 10
characters; it always creates a `user` account. Admin accounts are provisioned from
`ADMIN_EMAIL` and `ADMIN_PASSWORD`, not through public registration.

## Session model

1. Successful login or registration stores the signed-in user in a Flask session.
2. The browser sends the session cookie with credentialed API requests.
3. `POST /auth/logout` clears the session.
4. `GET /auth/me` and `PATCH /auth/profile` require an active session.

Passwords are stored using Werkzeug password hashing. Session cookies are signed
with `SECRET_KEY`.

## Role-based API protection

`require_user()` protects authenticated routes; `require_user("admin")` protects
Admin-only operations, including:

- Approving, rejecting, and requesting documents for applications
- Reviewing documents
- Direct blockchain registration and transfer
- Updating valuation parameters
- Listing users and changing account roles

Shared authenticated pages are available to both account types. Admin pages require
an Admin session.

## Local demo data

The configured Admin is provisioned at startup. Development may seed demo property
and transaction records; production startup skips demo data.

## Profile and wallet

Any signed-in account can update its name through `PATCH /auth/profile` and link a
wallet by signing a one-time ownership challenge. The signature proves control of
the address without sending a transaction or revealing its private key. Application
and Admin APIs continue to require the authenticated session; a wallet address alone
does not grant access.
