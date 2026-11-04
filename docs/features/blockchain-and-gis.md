# Blockchain and GIS integration

Requirement source: `complete.md` §4, §5.

## Blockchain

Signed-in users and Admins can link a MetaMask address in Profile by signing a
one-time challenge. This proves control of an address without sending a transaction
or exposing the private key. A wallet signature alone does not grant property access
or establish legal ownership.

### Smart contract

`blockchain/contracts/GeoLedger.sol`

| Function | Purpose |
|---|---|
| `registerProperty(propertyId, owner)` | First-time on-chain title |
| `transferOwnership(propertyId, newOwner)` | Change owner (current owner or Admin signer) |
| `getProperty(propertyId)` | View property id, owner, registeredAt, exists |

On-chain key = cadastral **survey number**. Document hashes and polygons stay off-chain in the database.

### Authorized writes only

1. User workflows never call the chain directly from the browser.
2. Flask `BlockchainService` signs with the Admin private key (`BLOCKCHAIN_PRIVATE_KEY`).
3. Direct `POST /blockchain/register` and `POST /blockchain/transfer` require an **Admin session**.
4. Normal path: admin `POST /applications/<id>/approve` after documents are verified.

| Application type | Chain call on approve |
|---|---|
| `NEW_REGISTRATION` | `registerProperty` |
| `OWNERSHIP_TRANSFER` | `transferOwnership` |
| `INHERITANCE_TRANSFER` | `transferOwnership` |

### Transaction records

Each successful approve inserts a `transactions` row with:

- property / survey / application ids
- previous and new owner
- `tx_hash`, `block_number`, `status=CONFIRMED`
- timestamp

Failed RPC/tx → application `BLOCKCHAIN_FAILED` and user-visible error.

### Simulation mode

If `BLOCKCHAIN_CONTRACT_ADDRESS` is missing or Hardhat is offline, `BlockchainService` runs in **simulation mode** (deterministic fake hashes) so local demos and tests still complete. Set a real deployed address for true on-chain anchoring. Simulation is disabled when `APP_ENV=production`; the production server requires the configured RPC, contract, and signer to initialize.

### Verification

- `GET /blockchain/property/<id>` (authenticated)
- `GET /blockchain/transactions` (authenticated)
- Public: `GET /verify/property/<id>` joins off-chain + on-chain owner when available

---

## GIS mapping

### Stack

- Leaflet + OpenStreetMap tiles on the frontend (`PropertySearch` / map route)
- Backend `GISService` serves GeoJSON polygons

### Endpoints

`GET /gis/property/<survey_number>` (public)

Returns:

```json
{
  "survey_number": "SN-DEMO-001",
  "geojson": { "type": "Feature", "geometry": { "type": "Polygon", "coordinates": [...] } },
  "found": true
}
```

### Data sources

1. Static demo parcels: `backend/geojson/demo_parcels.json` (e.g. Thandavapura / Mysuru)
2. Synthetic rectangle when survey is unknown (`found: false` / generated)

**Important:** Demo/synthetic GeoJSON is **not** verified government cadastral data. The UI and API should treat `found` vs generated as the distinction between curated demo parcels and placeholders.

### Property linkage

Registered properties store `geojson_reference` (usually the survey number). Search by survey or property id loads the parcel overlay and links to registry records.

### Registration boundary input

Registration collects location/area fields and can associate a GIS reference. Full interactive polygon draw-to-submit is still evolving; map search/display of parcels is the primary GIS surface today.
