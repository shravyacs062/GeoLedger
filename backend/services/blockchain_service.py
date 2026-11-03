import json
import os
import hashlib
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from web3 import Web3

from utils.errors import APIError


env_path = Path(__file__).resolve().parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path, override=True)
else:
    load_dotenv()


class _SimAccount:
    address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"


class BlockchainService:
    """Web3 bridge with automatic simulation fallback when Hardhat is offline."""

    def __init__(self):
        self.rpc_url = os.getenv("BLOCKCHAIN_RPC_URL", "http://127.0.0.1:8545")
        self.contract_address = os.getenv("BLOCKCHAIN_CONTRACT_ADDRESS")
        self.private_key = os.getenv("BLOCKCHAIN_PRIVATE_KEY")
        self.simulation_mode = False
        self._sim_store = {}
        self.account = _SimAccount()
        self.web3 = None
        self.contract = None

        force_sim = os.getenv("BLOCKCHAIN_SIMULATION", "").lower() in ("1", "true", "yes")
        if force_sim or not self.contract_address or not self.private_key:
            self.simulation_mode = True
            return

        try:
            self.web3 = Web3(Web3.HTTPProvider(self.rpc_url, request_kwargs={"timeout": 2}))
            if not self.web3.is_connected():
                self.simulation_mode = True
                return

            artifact_path = os.path.join(
                os.path.dirname(__file__), "..", "blockchain", "GeoLedger.json"
            )
            with open(artifact_path, "r", encoding="utf-8") as file:
                artifact = json.load(file)

            self.contract = self.web3.eth.contract(
                address=Web3.to_checksum_address(self.contract_address),
                abi=artifact["abi"],
            )
            self.account = self.web3.eth.account.from_key(self.private_key)
        except Exception:
            self.simulation_mode = True

    def _sim_hash(self, *parts) -> str:
        raw = "|".join(str(p) for p in parts) + "|" + datetime.utcnow().isoformat()
        return "0x" + hashlib.sha256(raw.encode()).hexdigest()

    def register_property(self, property_id: str, wallet_address: str) -> dict:
        if self.simulation_mode:
            wallet_address = Web3.to_checksum_address(wallet_address)
            if self._sim_store.get(property_id, {}).get("exists"):
                raise APIError("Property already registered on blockchain", status_code=409)
            tx_hash = self._sim_hash("register", property_id, wallet_address)
            self._sim_store[property_id] = {
                "property_id": property_id,
                "owner": wallet_address,
                "registered_at": int(datetime.utcnow().timestamp()),
                "exists": True,
            }
            return {
                "property_id": property_id,
                "wallet_address": wallet_address,
                "transaction_hash": tx_hash,
                "block_number": len(self._sim_store),
                "status": "confirmed",
                "simulation": True,
            }

        try:
            wallet_address = Web3.to_checksum_address(wallet_address)
            transaction = (
                self.contract.functions.registerProperty(property_id, wallet_address)
                .build_transaction({
                    "from": self.account.address,
                    "nonce": self.web3.eth.get_transaction_count(self.account.address),
                    "gas": 300000,
                    "gasPrice": self.web3.eth.gas_price,
                })
            )
            signed_transaction = self.web3.eth.account.sign_transaction(
                transaction, self.private_key
            )
            tx_hash = self.web3.eth.send_raw_transaction(signed_transaction.raw_transaction)
            receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash)
            return {
                "property_id": property_id,
                "wallet_address": wallet_address,
                "transaction_hash": tx_hash.hex(),
                "block_number": receipt["blockNumber"],
                "status": "confirmed",
            }
        except Exception as exc:
            raise APIError(f"Blockchain registration failed: {str(exc)}", status_code=502)

    def property_exists(self, property_id: str) -> bool:
        if self.simulation_mode:
            return bool(self._sim_store.get(property_id, {}).get("exists"))
        try:
            result = self.contract.functions.getProperty(property_id).call()
            return result[3]
        except Exception as exc:
            raise APIError(f"Blockchain lookup failed: {str(exc)}", status_code=502)

    def get_property(self, property_id: str) -> dict:
        if self.simulation_mode:
            stored = self._sim_store.get(property_id)
            if not stored:
                # Fall back to DB-synced view for public verify after restart
                try:
                    from database.client import get_database
                    prop = get_database().properties.find_one({"survey_number": property_id})
                    if prop:
                        return {
                            "property_id": property_id,
                            "owner": prop.get("owner_wallet"),
                            "registered_at": 0,
                            "exists": True,
                            "simulation": True,
                        }
                except Exception:
                    pass
                return {
                    "property_id": property_id,
                    "owner": None,
                    "registered_at": 0,
                    "exists": False,
                    "simulation": True,
                }
            return {**stored, "simulation": True}

        try:
            result = self.contract.functions.getProperty(property_id).call()
            return {
                "property_id": result[0],
                "owner": result[1],
                "registered_at": result[2],
                "exists": result[3],
            }
        except Exception as exc:
            raise APIError(f"Blockchain lookup failed: {str(exc)}", status_code=502)

    def transfer_property(self, property_id: str, new_owner: str) -> dict:
        if self.simulation_mode:
            new_owner = Web3.to_checksum_address(new_owner)
            stored = self._sim_store.get(property_id)
            if not stored:
                # Allow transfer if property exists in DB (inheritance/sale after restart)
                try:
                    from database.client import get_database
                    prop = get_database().properties.find_one({"survey_number": property_id})
                    if not prop:
                        raise APIError("Property not registered on blockchain", status_code=404)
                    stored = {
                        "property_id": property_id,
                        "owner": prop.get("owner_wallet"),
                        "registered_at": 0,
                        "exists": True,
                    }
                except APIError:
                    raise
                except Exception:
                    raise APIError("Property not registered on blockchain", status_code=404)

            tx_hash = self._sim_hash("transfer", property_id, new_owner)
            stored["owner"] = new_owner
            self._sim_store[property_id] = stored
            return {
                "property_id": property_id,
                "new_owner": new_owner,
                "transaction_hash": tx_hash,
                "block_number": max(1, len(self._sim_store)),
                "status": "confirmed",
                "simulation": True,
            }

        try:
            new_owner = Web3.to_checksum_address(new_owner)
            transaction = (
                self.contract.functions.transferOwnership(property_id, new_owner)
                .build_transaction({
                    "from": self.account.address,
                    "nonce": self.web3.eth.get_transaction_count(self.account.address),
                    "gas": 300000,
                    "gasPrice": self.web3.eth.gas_price,
                })
            )
            signed_transaction = self.web3.eth.account.sign_transaction(
                transaction, self.private_key
            )
            tx_hash = self.web3.eth.send_raw_transaction(signed_transaction.raw_transaction)
            receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash)
            return {
                "property_id": property_id,
                "new_owner": new_owner,
                "transaction_hash": tx_hash.hex(),
                "block_number": receipt["blockNumber"],
                "status": "confirmed",
            }
        except Exception as exc:
            raise APIError(f"Blockchain transfer failed: {str(exc)}", status_code=502)
