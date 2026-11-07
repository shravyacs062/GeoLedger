import json
from pathlib import Path


BLOCK_LOG_PATH = Path(__file__).resolve().parents[1] / "blockchain" / "blocks.jsonl"


def append_confirmed_block(transaction: dict) -> None:
    BLOCK_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with BLOCK_LOG_PATH.open("a", encoding="utf-8", newline="\n") as log_file:
        log_file.write(json.dumps(transaction, sort_keys=True) + "\n")
        log_file.flush()


def backfill_confirmed_blocks(transactions) -> int:
    BLOCK_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    logged_hashes = set()
    if BLOCK_LOG_PATH.exists():
        with BLOCK_LOG_PATH.open("r", encoding="utf-8") as log_file:
            for line in log_file:
                if line.strip():
                    existing = json.loads(line)
                    if existing.get("tx_hash"):
                        logged_hashes.add(existing["tx_hash"])

    pending_records = []
    for transaction in transactions:
        tx_hash = transaction.get("tx_hash")
        status = str(transaction.get("status") or "").upper()
        if not tx_hash or status not in {"CONFIRMED", "COMPLETED"} or tx_hash in logged_hashes:
            continue

        record = dict(transaction)
        document_id = record.pop("_id", None)
        if document_id is not None:
            record["transaction_id"] = str(document_id)
        if "simulation" not in record:
            record["simulation"] = None
            record["record_source"] = "legacy_backfill"
        pending_records.append(record)
        logged_hashes.add(tx_hash)

    pending_records.sort(key=lambda record: str(record.get("timestamp") or ""))
    with BLOCK_LOG_PATH.open("a", encoding="utf-8", newline="\n") as log_file:
        for record in pending_records:
            log_file.write(json.dumps(record, sort_keys=True, default=str) + "\n")
        log_file.flush()
    return len(pending_records)
