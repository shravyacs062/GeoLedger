import json
import os
import sqlite3
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional


class InsertResult:
    def __init__(self, inserted_id: str):
        self.inserted_id = inserted_id


class UpdateResult:
    def __init__(self, matched_count: int, modified_count: int):
        self.matched_count = matched_count
        self.modified_count = modified_count


class DeleteResult:
    def __init__(self, deleted_count: int):
        self.deleted_count = deleted_count


def _serialize_val(val: Any) -> Any:
    if isinstance(val, datetime):
        return val.isoformat()
    if hasattr(val, "__str__") and not isinstance(val, (int, float, bool, list, dict, type(None))):
        return str(val)
    return val


def _sanitize_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    cleaned = {}
    for k, v in doc.items():
        if isinstance(v, dict):
            cleaned[k] = _sanitize_doc(v)
        elif isinstance(v, list):
            cleaned[k] = [_sanitize_doc(i) if isinstance(i, dict) else _serialize_val(i) for i in v]
        else:
            cleaned[k] = _serialize_val(v)
    return cleaned


class SQLiteCursor:
    def __init__(self, docs: List[Dict[str, Any]]):
        self.docs = docs

    def sort(self, key: str, direction: int = 1):
        reverse = direction == -1
        self.docs.sort(key=lambda d: str(d.get(key, "")), reverse=reverse)
        return self

    def limit(self, count: int):
        self.docs = self.docs[:count]
        return self

    def __iter__(self):
        return iter(self.docs)

    def __len__(self):
        return len(self.docs)


class SQLiteCollection:
    def __init__(self, db_path: str, name: str):
        self.db_path = db_path
        self.name = name
        self._init_table()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_table(self):
        with self._get_connection() as conn:
            conn.execute(
                f"CREATE TABLE IF NOT EXISTS {self.name} ("
                "id TEXT PRIMARY KEY, "
                "data TEXT NOT NULL, "
                "created_at TEXT NOT NULL, "
                "updated_at TEXT NOT NULL)"
            )
            conn.commit()

    def _match(self, doc: Dict[str, Any], query: Optional[Dict[str, Any]]) -> bool:
        if not query:
            return True
        for k, v in query.items():
            if k == "$or" and isinstance(v, list):
                if not any(self._match(doc, sub_q) for sub_q in v):
                    return False
                continue
            if k == "_id":
                if str(v) != str(doc.get("_id", "")):
                    return False
                continue
            doc_val = doc.get(k)
            if isinstance(v, dict):
                if "$nin" in v and doc_val in v["$nin"]:
                    return False
                if "$in" in v and doc_val not in v["$in"]:
                    return False
                if "$ne" in v and doc_val == v["$ne"]:
                    return False
            else:
                if v is None:
                    if doc_val is not None:
                        return False
                elif doc_val is None:
                    return False
                elif str(doc_val).strip() != str(v).strip():
                    return False
        return True

    def find_one(self, query: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.execute(f"SELECT data FROM {self.name}")
            for row in cursor.fetchall():
                doc = json.loads(row["data"])
                if self._match(doc, query):
                    return doc
        return None

    def find(self, query: Optional[Dict[str, Any]] = None) -> SQLiteCursor:
        matched = []
        with self._get_connection() as conn:
            cursor = conn.execute(f"SELECT data FROM {self.name}")
            for row in cursor.fetchall():
                doc = json.loads(row["data"])
                if self._match(doc, query):
                    matched.append(doc)
        return SQLiteCursor(matched)

    def insert_one(self, document: Dict[str, Any]) -> InsertResult:
        doc = dict(document)
        doc_id = str(doc.get("_id") or uuid.uuid4().hex[:24])
        doc["_id"] = doc_id
        cleaned = _sanitize_doc(doc)
        now = datetime.utcnow().isoformat()
        with self._get_connection() as conn:
            conn.execute(
                f"INSERT INTO {self.name} (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)",
                (doc_id, json.dumps(cleaned), now, now),
            )
            conn.commit()
        return InsertResult(inserted_id=doc_id)

    def update_one(self, filter_query: Dict[str, Any], update_ops: Dict[str, Any]) -> UpdateResult:
        with self._get_connection() as conn:
            cursor = conn.execute(f"SELECT id, data FROM {self.name}")
            for row in cursor.fetchall():
                doc = json.loads(row["data"])
                if self._match(doc, filter_query):
                    target_id = row["id"]
                    if "$set" in update_ops:
                        for k, v in update_ops["$set"].items():
                            doc[k] = _serialize_val(v)
                    if "$unset" in update_ops:
                        for k in update_ops["$unset"]:
                            doc.pop(k, None)
                    if "$addToSet" in update_ops:
                        for k, v in update_ops["$addToSet"].items():
                            curr_list = doc.setdefault(k, [])
                            if not isinstance(curr_list, list):
                                curr_list = [curr_list]
                                doc[k] = curr_list
                            item = _serialize_val(v)
                            if item not in curr_list:
                                curr_list.append(item)

                    cleaned = _sanitize_doc(doc)
                    now = datetime.utcnow().isoformat()
                    conn.execute(
                        f"UPDATE {self.name} SET data = ?, updated_at = ? WHERE id = ?",
                        (json.dumps(cleaned), now, target_id),
                    )
                    conn.commit()
                    return UpdateResult(matched_count=1, modified_count=1)
        return UpdateResult(matched_count=0, modified_count=0)

    def update_many(self, filter_query: Dict[str, Any], update_ops: Dict[str, Any]) -> UpdateResult:
        matched = 0
        modified = 0
        with self._get_connection() as conn:
            cursor = conn.execute(f"SELECT id, data FROM {self.name}")
            for row in cursor.fetchall():
                doc = json.loads(row["data"])
                if self._match(doc, filter_query):
                    target_id = row["id"]
                    matched += 1
                    if "$set" in update_ops:
                        for k, v in update_ops["$set"].items():
                            doc[k] = _serialize_val(v)
                    cleaned = _sanitize_doc(doc)
                    now = datetime.utcnow().isoformat()
                    conn.execute(
                        f"UPDATE {self.name} SET data = ?, updated_at = ? WHERE id = ?",
                        (json.dumps(cleaned), now, target_id),
                    )
                    modified += 1
            conn.commit()
        return UpdateResult(matched_count=matched, modified_count=modified)

    def find_one_and_update(self, filter_query: Dict[str, Any], update_ops: Dict[str, Any], return_document: bool = True) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.execute(f"SELECT id, data FROM {self.name}")
            for row in cursor.fetchall():
                doc = json.loads(row["data"])
                if self._match(doc, filter_query):
                    target_id = row["id"]
                    if "$set" in update_ops:
                        for k, v in update_ops["$set"].items():
                            doc[k] = _serialize_val(v)
                    if "$addToSet" in update_ops:
                        for k, v in update_ops["$addToSet"].items():
                            curr_list = doc.setdefault(k, [])
                            if not isinstance(curr_list, list):
                                curr_list = [curr_list]
                                doc[k] = curr_list
                            item = _serialize_val(v)
                            if item not in curr_list:
                                curr_list.append(item)

                    cleaned = _sanitize_doc(doc)
                    now = datetime.utcnow().isoformat()
                    conn.execute(
                        f"UPDATE {self.name} SET data = ?, updated_at = ? WHERE id = ?",
                        (json.dumps(cleaned), now, target_id),
                    )
                    conn.commit()
                    return cleaned
        return None

    def find_one_and_delete(self, filter_query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.execute(f"SELECT id, data FROM {self.name}")
            for row in cursor.fetchall():
                doc = json.loads(row["data"])
                if self._match(doc, filter_query):
                    target_id = row["id"]
                    conn.execute(f"DELETE FROM {self.name} WHERE id = ?", (target_id,))
                    conn.commit()
                    return doc
        return None

    def delete_one(self, filter_query: Dict[str, Any]) -> DeleteResult:
        with self._get_connection() as conn:
            cursor = conn.execute(f"SELECT id, data FROM {self.name}")
            for row in cursor.fetchall():
                doc = json.loads(row["data"])
                if self._match(doc, filter_query):
                    target_id = row["id"]
                    conn.execute(f"DELETE FROM {self.name} WHERE id = ?", (target_id,))
                    conn.commit()
                    return DeleteResult(deleted_count=1)
        return DeleteResult(deleted_count=0)

    def delete_many(self, filter_query: Optional[Dict[str, Any]] = None) -> DeleteResult:
        count = 0
        with self._get_connection() as conn:
            cursor = conn.execute(f"SELECT id, data FROM {self.name}")
            for row in cursor.fetchall():
                doc = json.loads(row["data"])
                if self._match(doc, filter_query):
                    target_id = row["id"]
                    conn.execute(f"DELETE FROM {self.name} WHERE id = ?", (target_id,))
                    count += 1
            conn.commit()
        return DeleteResult(deleted_count=count)

    def count_documents(self, query: Optional[Dict[str, Any]] = None) -> int:
        return len(self.find(query).docs)


class SQLiteDatabase:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._collections: Dict[str, SQLiteCollection] = {}

    def __getattr__(self, name: str) -> SQLiteCollection:
        if name not in self._collections:
            self._collections[name] = SQLiteCollection(self.db_path, name)
        return self._collections[name]

    def __getitem__(self, name: str) -> SQLiteCollection:
        return self.__getattr__(name)
