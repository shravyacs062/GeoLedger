# Frontend

Vite + React 19 + TypeScript. Entry: `frontend/src/main.tsx` → `frontend/src/App.tsx` → `frontend/src/app/App.tsx`.

Dev server: `npm run dev` (port 5173). API base: `VITE_API_BASE_URL` or `http://127.0.0.1:5000`.

## Auth model

`AuthProvider` (`src/app/context/AuthContext.tsx`) owns the JWT session:

1. Login/register → store token + user in `localStorage`
2. Axios sends `Authorization: Bearer <token>` via `setAuthToken`
3. `RequireAuth` / `RequireAdmin` guard routes
4. Logout clears token and calls `POST /auth/logout`

`WalletProvider` remains for optional MetaMask linking (Profile), not as the primary login gate.

## Routes

| Path | Screen | Guard |
|---|---|---|
| `/` | `Landing` | public |
| `/login` | `UserLogin` | public |
| `/admin/login` | `AdminLogin` | public |
| `/public/verify/:identifier` | `PublicVerify` | public |
| `/admin` | `AdminDashboard` | admin |
| `/admin/applications/:applicationId` | `ApplicationDetails` | admin |
| `/dashboard` | `Dashboard` | auth |
| `/properties` | `MyProperties` | auth |
| `/properties/:propertyId` | `PropertyDetails` | auth |
| `/search`, `/map` | `PropertySearch` | auth |
| `/applications` | `Applications` | auth |
| `/applications/:applicationId` | `ApplicationDetails` | auth |
| `/applications/new`, `/register` | `PropertyRegistration` | auth |
| `/transfer` | `PropertyTransfer` | auth |
| `/inheritance` | `InheritanceTransfer` | auth |
| `/valuation` | `LandValuation` | auth |
| `/verify` | `DocumentVerification` | auth |
| `/transactions` | `Transactions` | auth |
| `/notifications` | `Notifications` | auth |
| `/profile` | `Profile` | auth |

Sidebar nav differs for admin vs user (transfer, inheritance, valuation, admin dashboard).

## API client (`src/services/api.ts`)

| Namespace | Methods |
|---|---|
| `api.auth` | `login`, `adminLogin`, `registerAccount`, `me`, `updateProfile`, `logout`, `listUsers`, `setRole`, wallet `register` |
| `api.dashboard` | `admin`, `user` |
| `api.notifications` | `list`, `markRead`, `markAllRead` |
| `api.valuation` | `estimate`, `getParams`, `updateParams` |
| `api.qr` | `get`, `generate` |
| `api.properties` | `list`, `getBySurvey`, `create` |
| `api.applications` | `list`, `get`, `create`, `updateStatus`, `approve`, `reject`, `requestDocuments` |
| `api.documents` | `upload`, `getByApp`, `getByProperty`, `delete`, `getDownloadUrl` |
| `api.verification` | `verify`, `review` |
| `api.ownership` | `transfer`, `getHistory` |
| `api.gis` | `getBySurvey` |
| `api.blockchain` | `getProperty`, `register`, `transfer`, `getTransactions` |
| `api.publicVerify` | `verifyProperty` |

## Feature screens of note

- **InheritanceTransfer** — legal checklist upload + heir details
- **AdminDashboard** — live pending metrics
- **PublicVerify** — unauthenticated QR landing page
- **LandValuation** — estimate + admin params
- **PropertyDetails** — live property load + QR image
- **ApplicationDetails** — admin-only approve/reject/request-docs actions

## GIS map

Property search calls `/gis/property/:surveyNumber` and renders GeoJSON with Leaflet. Demo parcels around Thandavapura (Mysuru). Unknown surveys still render a synthetic rectangle.

## UI kit

`frontend/src/app/components/ui/` — shadcn/Radix-style components. Tailwind v4 via `@tailwindcss/vite`. Brand teal `#0F766E` on slate `#0F172A`.

Dead duplicate screens under `frontend/src/components/` are not mounted by `main.tsx`.
