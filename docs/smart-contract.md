# Smart contract

Source: `blockchain/contracts/GeoLedger.sol`  
License: MIT  
Solidity: `^0.8.20`

The contract is a minimal title registry. It does **not** store polygons, document hashes, or application state. Those stay in the Flask database. The on-chain key is the cadastral **survey number** (passed as `propertyId`).

## State

```solidity
struct Property {
    string propertyId;
    address owner;
    uint256 registeredAt;
    bool exists;
}

mapping(string => Property) private properties;
address public registrar;  // set to msg.sender in the constructor
```

## Functions

### `registerProperty(string propertyId, address owner)`

- `propertyId` must be non-empty
- `owner` must not be the zero address
- Parcel must not already `exists`

Stores the record with `registeredAt = block.timestamp` and emits `PropertyRegistered`.

There is **no** `onlyRegistrar` check. Any caller who can send a transaction (in this prototype, the backend signer) may register.

### `transferOwnership(string propertyId, address newOwner)`

- Parcel must exist
- Caller must be the current `owner` **or** `registrar`
- `newOwner` must not be the zero address

Updates `owner` and emits `OwnershipTransferred`.

The Flask approve path always uses the registrar key, so transfers succeed even when the applicant never signs.

### `getProperty(string propertyId) view`

Returns `(propertyId, owner, registeredAt, exists)`. Missing parcels return empty string, zero address, `0`, and `false`.

## Events

```solidity
event PropertyRegistered(string indexed propertyId, address indexed owner, uint256 timestamp);
event OwnershipTransferred(string indexed propertyId, address indexed previousOwner, address indexed newOwner, uint256 timestamp);
```

Note: `string indexed` indexes the hash of the string, not the string itself.

## Backend bridge

`backend/services/blockchain_service.py`:

| Env | Role |
|---|---|
| `BLOCKCHAIN_RPC_URL` | Web3 HTTP provider (default `http://127.0.0.1:8545`) |
| `BLOCKCHAIN_CONTRACT_ADDRESS` | Deployed address |
| `BLOCKCHAIN_PRIVATE_KEY` | Account that signs `registerProperty` / `transferOwnership` |

ABI is read from `backend/blockchain/GeoLedger.json` (copied by `deploy-local.js` from Hardhat artifacts).

Writes use 300000 gas and `eth.gas_price`. The service waits for the receipt and returns `transaction_hash` + `block_number`.

## Hardhat workspace

| File | Role |
|---|---|
| `hardhat.config.js` | Solidity 0.8.20, `@nomicfoundation/hardhat-viem` |
| `deploy-local.js` | Deploy via viem `walletClient.deployContract`, sync ABI + `.env` |
| `test-contract.js` | Manual register / read / transfer against a hardcoded address |
| `deployed-address.json` | Last local deploy record |

Typical local flow: `npx hardhat compile` → `npx hardhat node` → `npx hardhat run deploy-local.js --network localhost`.

`test-contract.js` currently hardcodes `0x5fbdb2315678afecb367f032d93f642f64180aa3`. After a fresh deploy, update that address (or use `deployed-address.json`) before running it.
