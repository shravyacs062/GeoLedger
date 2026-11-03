# Dashboards, notifications, and profile

Requirement source: `complete.md` §8, §9, §11, §13.

## Admin dashboard

Route: `/admin` (admin JWT required)  
API: `GET /dashboard/admin`

Shows live counts for:

- Total registered properties
- Pending registrations / transfers / inheritance
- Approved and rejected applications
- Pending document verification
- Flagged / suspicious documents
- Recent blockchain transactions
- Total users

From the admin dashboard, registrars open application review (`/admin/applications/:id`) to verify documents, approve, reject, or request corrections.

## User dashboard

Route: `/dashboard`  
API: `GET /dashboard/user`

Shows:

- Registered properties for the linked wallet / account
- Submitted and pending applications
- Recent activity
- Quick actions: register, transfer, inheritance, valuation

## Notifications

API:

| Method | Path |
|---|---|
| `GET` | `/notifications` |
| `POST` | `/notifications/<id>/read` |
| `POST` | `/notifications/read-all` |

Events that create notifications include:

- Application submitted (user + admin alert)
- Documents verified / flagged / additional docs required
- Application approved or rejected
- Ownership successfully transferred (applicant and previous owner when applicable)

UI: `/notifications` with unread badges and mark-read / mark-all-read.

## Profile

Route: `/profile`

- View/edit full name, phone, linked wallet
- Email is read-only account identifier
- Connect / disconnect MetaMask and switch to Hardhat local network
- Secure logout (clears JWT + optional wallet session)
