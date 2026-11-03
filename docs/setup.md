# Local setup

You need the Flask API and the Vite frontend. A local Hardhat node is optional (simulation mode is used when the contract is not configured).

## Prerequisites

- Node.js 18 or 20, with npm (or pnpm)
- Python 3.10+
- Optional: MongoDB. If it is not running, the API uses SQLite at `backend/geoledger.db`
- Optional: MetaMask (for linking a wallet on the Profile screen)

## 1. Backend (Flask)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env` (see [Environment variables](#environment-variables)). Then:

```bash
python app.py
```

The API listens on `http://0.0.0.0:5000`. `GET /` should return `{ "success": true, "message": "GeoLedger backend is running" }`.

On first boot the API seeds:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@geoledger.local` | `Admin@12345` |
| User | `user@geoledger.local` | `User@12345` |

### Tests

```bash
cd backend
source venv/bin/activate
pytest tests/test_app.py
```

Tests use JWT auth. Blockchain simulation mode is used when no contract address is configured.

## 2. Frontend (Vite)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

| Portal | URL |
|---|---|
| Landing | `/` |
| User login | `/login` |
| Admin login | `/admin/login` |
| Public verify | `/public/verify/SN-DEMO-001` |

Optional: `frontend/.env` with `VITE_API_BASE_URL=http://127.0.0.1:5000`.

### MetaMask (optional)

Wallet connect is no longer required for login. Use Profile → Connect MetaMask to link a Hardhat account for on-chain identity demos.

1. Install [MetaMask](https://metamask.io/download/).
2. Add Hardhat Localhost (chain id `31337`, RPC `http://127.0.0.1:8545`).
3. Import Hardhat account `#0` for local ETH (never use that key on a public network).

## 3. Smart contract (optional Hardhat)

```bash
cd blockchain
npm install
npx hardhat compile
npx hardhat node
```

In a second terminal:

```bash
cd blockchain
npx hardhat run deploy-local.js --network localhost
```

The deploy script copies the ABI to `backend/blockchain/GeoLedger.json` and writes `BLOCKCHAIN_CONTRACT_ADDRESS` into `backend/.env` when present.

Default Hardhat account `#0`:

```
Private key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
Address:     0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

Without a deployed contract, the backend uses **blockchain simulation mode** so approve flows still complete for demos and tests.

## Environment variables

### `backend/.env`

| Variable | Default | Purpose |
|---|---|---|
| `DEBUG` | `False` | Include exception details in 500 responses when true |
| `SECRET_KEY` | long dev default | Flask + JWT signing key (change in production) |
| `JWT_ALGORITHM` | `HS256` | JWT algorithm |
| `JWT_EXPIRES_HOURS` | `24` | Token lifetime |
| `FRONTEND_URL` | `http://127.0.0.1:5173` | Base URL embedded in property QR codes |
| `MONGO_URI` | `mongodb://localhost:27017` | Mongo connection; SQLite on failure |
| `DATABASE_NAME` | `geoledger` | Mongo database name |
| `UPLOAD_FOLDER` | `uploads` | Document storage directory |
| `MAX_CONTENT_LENGTH` | `16777216` | Upload cap (16 MB) |
| `BLOCKCHAIN_RPC_URL` | `http://127.0.0.1:8545` | EVM JSON-RPC |
| `BLOCKCHAIN_CONTRACT_ADDRESS` | _(empty → simulation)_ | Deployed `GeoLedger` address |
| `BLOCKCHAIN_PRIVATE_KEY` | Hardhat `#0` key | Registrar key for chain writes |
| `BLOCKCHAIN_SIMULATION` | unset | Force simulation when `true` |

Example:

```
DEBUG=true
SECRET_KEY=geoledger-dev-secret-key-change-in-production-32b
JWT_EXPIRES_HOURS=24
FRONTEND_URL=http://127.0.0.1:5173
MONGO_URI=mongodb://localhost:27017
DATABASE_NAME=geoledger
UPLOAD_FOLDER=uploads
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
BLOCKCHAIN_CONTRACT_ADDRESS=
BLOCKCHAIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### `frontend/.env`

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `http://127.0.0.1:5000` | Flask origin |
| `VITE_CHAIN_ID` | `31337` | Network MetaMask should use |
| `VITE_CHAIN_NAME` | `Hardhat Localhost` | Label when adding the chain |
| `VITE_RPC_URL` | `http://127.0.0.1:8545` | RPC URL added to MetaMask |

## Allowed upload types

`pdf`, `png`, `jpg`, `jpeg`, `doc`, `docx`, `txt`.

## Common issues

| Symptom | Likely cause |
|---|---|
| `401 Authentication required` | Missing/expired JWT; log in again |
| `403 Insufficient permissions` | User token used on an admin route |
| Chain approve works without Hardhat | Simulation mode (expected without contract address) |
| Empty map / GIS `"generated"` | Survey not in `demo_parcels.json`; synthetic parcel returned |
| Frontend empty while API has data | `VITE_API_BASE_URL` mismatch |
| Mongo ignored, `geoledger.db` created | Mongo ping failed; SQLite fallback is working |

## Next steps

- [Demo guide](./demo-guide.md)
- [Feature docs](./features/README.md)
- [API reference](./api.md)
