# Local setup

You need the Flask API and the Vite frontend. MongoDB, MetaMask, and a local Hardhat node are optional for a local demo. The local demo uses SQLite if MongoDB is unavailable and blockchain simulation if no contract is configured.

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
ADMIN_EMAIL=admin@example.test
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

### Tests

```bash
cd backend
source venv/bin/activate
pytest tests/test_app.py
```

Tests use Flask session authentication. For local demos, the backend can use
blockchain simulation mode when no contract address is configured.

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

By default, the frontend connects to the API on port `5000` using the same host
(`localhost` or `127.0.0.1`) that you used to open the frontend. If you set
`VITE_API_BASE_URL` in `frontend/.env`, keep its hostname consistent with the
frontend hostname so the browser sends the session cookie.

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

Register a user at `/login`; users can only access their own applications,
properties and documents. Sign in as the provisioned administrator at
`/admin/login`. Any signed-in account can link a wallet from **Profile** by connecting MetaMask and
signing a one-time challenge; the private key never leaves the wallet. This is a
message signature, not a blockchain transaction.

## Environment variables

### `backend/.env`

| Variable | Default | Purpose |
|---|---|---|
| `APP_ENV` | `development` | Use `production` to disable demo seeding, SQLite fallback, and blockchain simulation |
| `DEBUG` | `False` | Include exception details in 500 responses when true |
| `SECRET_KEY` | _(required)_ | Flask session signing secret; no default secret is accepted by the server |
| `ADMIN_EMAIL` | _(required for admin access)_ | Initial Admin email |
| `ADMIN_PASSWORD` | _(required for admin access)_ | Initial Admin password (12+ characters) |
| `FRONTEND_ORIGINS` | `http://127.0.0.1:5173,http://localhost:5173` | Allowed credentialed frontend origins, comma-separated |
| `MONGO_URI` | `mongodb://localhost:27017` | Mongo connection. Development falls back to SQLite; production requires MongoDB |
| `FRONTEND_URL` | `http://127.0.0.1:5173` | Base URL embedded in property QR codes |
| `DATABASE_NAME` | `geoledger` | Mongo database name |
| `UPLOAD_FOLDER` | `uploads` | Document storage directory |
| `MAX_CONTENT_LENGTH` | `16777216` | Upload cap (16 MB) |
| `BLOCKCHAIN_RPC_URL` | `http://127.0.0.1:8545` | EVM JSON-RPC |
| `BLOCKCHAIN_CONTRACT_ADDRESS` | empty | Deployed `GeoLedger` address; empty enables simulation mode |
| `BLOCKCHAIN_PRIVATE_KEY` | empty | Backend transaction signer; use a managed secret and funded deployment account |
| `SESSION_COOKIE_SECURE` | `False` | Set true when serving the API over HTTPS |

Example:

```
DEBUG=false
SECRET_KEY=replace-with-output-from-secrets-token-hex
ADMIN_EMAIL=admin@example.test
ADMIN_PASSWORD=replace-with-a-unique-password-of-at-least-12-characters
FRONTEND_ORIGINS=http://127.0.0.1:5173,http://localhost:5173
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
| `VITE_API_BASE_URL` | API port `5000` on the frontend's current host | Flask origin |
| `VITE_CHAIN_ID` | `31337` | Target EVM network id |
| `VITE_CHAIN_NAME` | `Hardhat Localhost` | Target network label shown to users and MetaMask |
| `VITE_RPC_URL` | `http://127.0.0.1:8545` | Target RPC URL offered to MetaMask |

Connecting a wallet does not change its network automatically. If it is on another
network, GeoLedger shows the configured target and lets the user switch explicitly.

## Production deployment boundary

The repository is a project prototype, not a ready-made production deployment.
`APP_ENV=production` requires a reachable MongoDB and a configured, reachable
deployed contract with a valid backend signing key. It disables SQLite fallback,
demo database seeding, and blockchain simulation and fails startup if production
secrets, HTTPS session cookies, or HTTPS frontend origins are missing.

Before deploying, also configure HTTPS, a strong unique `SECRET_KEY`, exact
`FRONTEND_ORIGINS`, `SESSION_COOKIE_SECURE=true`, a managed MongoDB and durable
document-upload storage, and a real chain/RPC/contract. Keep the frontend and API on
the same site (for example, sibling subdomains) so the session cookie works with the
configured `SameSite=Lax` policy. The bundled GIS data remains
sample/synthetic and is not an authoritative cadastral source; integrate and verify
an authorized GIS provider before using real land records. Set frontend `VITE_*`
network variables to the same chain as the backend contract. Do not use Hardhat
keys or local RPC endpoints in a public deployment.

## Allowed upload types

`pdf`, `png`, `jpg`, `jpeg`, `doc`, `docx`, `txt`.

## Common issues

| Symptom | Likely cause |
|---|---|
| `401 Authentication required` | No active session; sign in again |
| `403 Insufficient permissions` | Signed-in account does not have the required role |
| `Unable to connect to blockchain` (503) | Hardhat node is not running, or `BLOCKCHAIN_RPC_URL` is wrong |
| `Blockchain contract address is not configured` (500) | Chain writes require a deployed contract address |
| `GeoLedger contract artifact not found` (500) | Deploy (or copy ABI) so `backend/blockchain/GeoLedger.json` exists |
| Empty map / GIS 200 with `"status": "generated"` | Survey number is not in `demo_parcels.json`; a synthetic parcel was returned |
| Frontend lists empty while the API has data | `VITE_API_BASE_URL` does not match the Flask host/port |
| Mongo ignored, `geoledger.db` created | Mongo ping failed; SQLite fallback is working as designed |
| Admin login unavailable | Set `ADMIN_EMAIL` and `ADMIN_PASSWORD`, then restart the backend |
| Session disappears between frontend/API requests | Keep frontend and API on the configured origins; HTTPS deployments must set `SESSION_COOKIE_SECURE=true` |

## Next steps

- [Demo guide](./demo-guide.md)
- [Feature docs](./features/README.md)
- [API reference](./api.md)
