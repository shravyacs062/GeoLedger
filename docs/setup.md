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

Create `backend/.env` before starting the API:

```dotenv
SECRET_KEY=replace-with-a-random-secret
ADMIN_EMAIL=registrar@example.test
ADMIN_PASSWORD=replace-with-a-unique-password-of-at-least-12-characters
MONGO_URI=mongodb://localhost:27017
DATABASE_NAME=geoledger
UPLOAD_FOLDER=uploads
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
BLOCKCHAIN_CONTRACT_ADDRESS=address-printed-by-the-deploy-step
BLOCKCHAIN_PRIVATE_KEY=local-hardhat-account-0-private-key
```

Generate a session secret with `python -c "import secrets; print(secrets.token_hex(32))"`.
The configured admin account is created on first startup; admin accounts cannot be
created through public registration. Never use the example Hardhat private key on a
public network. The development server refuses to start with the default Flask secret.

Then:

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

<<<<<<< Updated upstream
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
=======
### User and administrator accounts

Register a user at `/login`; users can only access their own applications,
properties and documents. Sign in as the provisioned registrar at `/admin/login`.
Users link a wallet from **Profile** by connecting MetaMask and signing a one-time
challenge; the private key never leaves the wallet.

Use **Hardhat Localhost** (chain id `31337`, RPC `http://127.0.0.1:8545`) and import
Hardhat account `#0` only for local development. Admin login does not use a wallet.
>>>>>>> Stashed changes

## Environment variables

### `backend/.env`

| Variable | Default | Purpose |
|---|---|---|
| `DEBUG` | `False` | Include exception details in 500 responses when true |
<<<<<<< Updated upstream
| `SECRET_KEY` | long dev default | Flask + JWT signing key (change in production) |
| `JWT_ALGORITHM` | `HS256` | JWT algorithm |
| `JWT_EXPIRES_HOURS` | `24` | Token lifetime |
| `FRONTEND_URL` | `http://127.0.0.1:5173` | Base URL embedded in property QR codes |
| `MONGO_URI` | `mongodb://localhost:27017` | Mongo connection; SQLite on failure |
=======
| `SECRET_KEY` | _(required)_ | Flask session signing secret; no default secret is accepted by the server |
| `ADMIN_EMAIL` | _(required for admin access)_ | Initial registrar email |
| `ADMIN_PASSWORD` | _(required for admin access)_ | Initial registrar password (12+ characters) |
| `FRONTEND_ORIGINS` | `http://127.0.0.1:5173,http://localhost:5173` | Allowed credentialed frontend origins, comma-separated |
| `MONGO_URI` | `mongodb://localhost:27017` | Mongo connection. On failure the API uses SQLite |
>>>>>>> Stashed changes
| `DATABASE_NAME` | `geoledger` | Mongo database name |
| `UPLOAD_FOLDER` | `uploads` | Document storage directory |
| `MAX_CONTENT_LENGTH` | `16777216` | Upload cap (16 MB) |
| `BLOCKCHAIN_RPC_URL` | `http://127.0.0.1:8545` | EVM JSON-RPC |
<<<<<<< Updated upstream
| `BLOCKCHAIN_CONTRACT_ADDRESS` | _(empty → simulation)_ | Deployed `GeoLedger` address |
| `BLOCKCHAIN_PRIVATE_KEY` | Hardhat `#0` key | Registrar key for chain writes |
| `BLOCKCHAIN_SIMULATION` | unset | Force simulation when `true` |
=======
| `BLOCKCHAIN_CONTRACT_ADDRESS` | _(required for application approvals)_ | Deployed `GeoLedger` address |
| `BLOCKCHAIN_PRIVATE_KEY` | _(required for application approvals)_ | Registrar key used by the backend |
| `SESSION_COOKIE_SECURE` | `False` | Set true when serving the API over HTTPS |
>>>>>>> Stashed changes

Example:

```
<<<<<<< Updated upstream
DEBUG=true
SECRET_KEY=geoledger-dev-secret-key-change-in-production-32b
JWT_EXPIRES_HOURS=24
FRONTEND_URL=http://127.0.0.1:5173
=======
DEBUG=false
SECRET_KEY=replace-with-output-from-secrets-token-hex
ADMIN_EMAIL=registrar@example.test
ADMIN_PASSWORD=replace-with-a-unique-password-of-at-least-12-characters
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
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
=======
| `Unable to connect to blockchain` (503) | Hardhat node is not running, or `BLOCKCHAIN_RPC_URL` is wrong |
| `Blockchain contract address is not configured` (500) | Missing `BLOCKCHAIN_CONTRACT_ADDRESS` |
| `GeoLedger contract artifact not found` (500) | Deploy (or copy ABI) so `backend/blockchain/GeoLedger.json` exists |
| Empty map / GIS 200 with `"status": "generated"` | Survey number is not in `demo_parcels.json`; a synthetic parcel was returned |
| Frontend lists empty while the API has data | `VITE_API_BASE_URL` does not match the Flask host/port |
| Mongo ignored, `geoledger.db` created | Mongo ping failed; SQLite fallback is working as designed |
| Admin login unavailable | Set `ADMIN_EMAIL` and `ADMIN_PASSWORD`, then restart the backend |
| Session disappears between frontend/API requests | Keep frontend and API on the configured origins; HTTPS deployments must set `SESSION_COOKIE_SECURE=true` |
>>>>>>> Stashed changes
