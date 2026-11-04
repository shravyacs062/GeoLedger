# Architecture

GeoLedger is a three-layer cadastral registry prototype. Land parcels are stored off-chain with GIS metadata and supporting documents. Ownership is anchored on an Ethereum-compatible smart contract when a reviewer approves an application.

```
┌─────────────────────────────────────────────────────────────┐
│  React SPA (Vite)                                           │
│  Leaflet map · registration wizard · document hash UI       │
│  Axios client → VITE_API_BASE_URL (default :5000)           │
└─────────────────────────────┬───────────────────────────────┘
                              │ REST + multipart uploads
┌─────────────────────────────▼───────────────────────────────┐
│  Flask API                                                  │
│  routes → controllers → services → models                   │
│  SHA-256 on upload · application state machine              │
│  GIS lookup against GeoJSON (or synthesized parcel)         │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
     MongoDB or SQLite              Hardhat / EVM node
     geoledger DB                   GeoLedger.sol
     (SQLite if Mongo is down)      registerProperty
                                    transferOwnership
```

## Layers

### Frontend (`frontend/`)

React 19 + TypeScript, Vite, Tailwind CSS v4, Radix/shadcn-style UI, Leaflet/react-leaflet, Axios, and ethers.js.

The live application lives under `frontend/src/app/`. `frontend/src/App.tsx` re-exports that router. A second, older copy of some screens exists under `frontend/src/components/` and is not what `main.tsx` mounts.

The browser talks to the Flask API for registry data. Primary identity is email/password with a Flask session (`AuthProvider`). Separate portals exist for users (`/login`) and admins (`/admin/login`). MetaMask remains optional for linking a wallet on the Profile screen. Contract writes still go through the backend Admin signing key, not the user’s MetaMask signature.

### Backend (`backend/`)

Flask application factory in `backend/app.py`. CORS is enabled for all origins. Blueprints are registered from `backend/routes/__init__.py`.

Typical request path:

1. Route in `backend/routes/`
2. Controller in `backend/controllers/` (thin HTTP adapter)
3. Service in `backend/services/` (business rules)
4. Dataclass models in `backend/models/`
5. Persistence through `database.client.get_database()`

Blockchain writes go through `BlockchainService`, which uses Web3.py against the Hardhat RPC and the ABI at `backend/blockchain/GeoLedger.json`.

### Blockchain (`blockchain/`)

Hardhat 3 workspace. Solidity `^0.8.20`. The contract stores `propertyId → { owner, registeredAt, exists }`. The deployer is recorded in the contract's `registrar` field and has Admin-level transfer authority. Current owners may also transfer their own parcels.

`deploy-local.js` deploys the compiled artifact, copies the ABI into the backend, and writes `BLOCKCHAIN_CONTRACT_ADDRESS` into `backend/.env` if that file exists.

## Persistence

`database/client.py` tries MongoDB first (`MONGO_URI`, default `mongodb://localhost:27017`, database `geoledger`). If the ping fails, it falls back to `backend/geoledger.db` via `SQLiteDatabase`, a Mongo-like wrapper over SQLite tables.

On first empty property collection, `seed_data.py` inserts demo parcel `SN-DEMO-001` (Thandavapura, Nanjangud, Mysuru) owned by Hardhat account `0xf39F…2266`.

Collections: `users`, `properties`, `applications`, `documents`, `transactions`, `notifications`, `audit_logs`, `valuation_params`.

## GIS

`GISService` loads `backend/geojson/demo_parcels.json`. If the survey number is not in that file, it synthesizes a rectangular polygon near Mysuru (`12.18°N, 76.68°E`) from an MD5 of the survey number so the map always has something to draw. Demo vs generated parcels must not be treated as verified government cadastral data.

## Security model

- JWT auth with role-based decorators (`login_required`, `admin_required`) on protected routes.
- Separate Admin and User login portals; approve/reject/review/blockchain write require admin.
- Documents are hashed with SHA-256 at upload; OCR/heuristic extraction and cross-checks run automatically; admins mark authenticity.
- On-chain writes are signed by the backend's `BLOCKCHAIN_PRIVATE_KEY`, only after approved applications (or explicit Admin blockchain routes).
- CORS is open for local development. Change secrets and tighten CORS before any production deploy.

Feature documentation: [features/README.md](./features/README.md).
