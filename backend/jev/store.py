"""
InstantDB access for Jev over the Admin HTTP API: one persistent connection, no Node.js
process per call. Measured from the Philippines: 0.3-1.1 s per query, against 1.6-7.9 s
for the old Node bridge (which loaded and sorted the whole table on every request).
"""
from __future__ import annotations

import logging
import threading
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional

import requests

logger = logging.getLogger(__name__)

API = "https://api.instantdb.com/admin"


class StoreError(RuntimeError):
    pass


class Store:
    def __init__(self, app_id: str, admin_token: str, timeout: float = 30.0):
        if not app_id or not admin_token:
            raise StoreError("INSTANTDB_APP_ID and INSTANTDB_ADMIN_TOKEN are required")
        self._headers = {"Authorization": f"Bearer {admin_token.strip()}", "App-Id": app_id.strip()}
        self._timeout = timeout
        self._local = threading.local()
        # None = not checked yet. Becomes True once draw_date is indexed in the schema.
        self.draw_date_indexed: Optional[bool] = None

    def _session(self) -> requests.Session:
        s = getattr(self._local, "session", None)
        if s is None:
            s = self._local.session = requests.Session()
        return s

    def _post(self, path: str, body: Dict[str, Any]) -> requests.Response:
        return self._session().post(f"{API}/{path}", json=body, headers=self._headers, timeout=self._timeout)

    def query(self, q: Dict[str, Any]) -> Dict[str, Any]:
        r = self._post("query", {"query": q})
        if not r.ok:
            raise StoreError(f"InstantDB query HTTP {r.status_code}: {r.text[:300]}")
        return r.json()

    def transact(self, steps: List[list]) -> None:
        r = self._post("transact", {"steps": steps})
        if not r.ok:
            raise StoreError(f"InstantDB transact HTTP {r.status_code}: {r.text[:300]}")

    # --- results -----------------------------------------------------------
    def latest_results(self, game: str, limit: int) -> List[Dict[str, Any]]:
        """Newest draws first. Uses an ordered query once draw_date is indexed; until then one full read."""
        entity = f"{game}_results"
        if self.draw_date_indexed is not False:
            r = self._post("query", {"query": {entity: {"$": {"limit": limit, "order": {"draw_date": "desc"}}}}})
            if r.ok:
                self.draw_date_indexed = True
                return r.json().get(entity, [])
            if "not indexed" not in r.text:
                raise StoreError(f"InstantDB query HTTP {r.status_code}: {r.text[:300]}")
            logger.warning("draw_date is not indexed yet; reading the full %s table (push the schema to fix)", entity)
            self.draw_date_indexed = False
        rows = self.query({entity: {}}).get(entity, [])
        rows.sort(key=lambda x: str(x.get("draw_date") or ""), reverse=True)
        return rows[:limit]

    def results_on_dates(self, game: str, dates_iso: Iterable[str]) -> List[Dict[str, Any]]:
        values = sorted(set(dates_iso))
        if not values:
            return []
        entity = f"{game}_results"
        return self.query({entity: {"$": {"where": {"draw_date": {"$in": values}}}}}).get(entity, [])

    def insert_result(self, game: str, row: Dict[str, Any]) -> str:
        rid = str(uuid.uuid4())
        data = {**row, "created_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")}
        self.transact([["update", f"{game}_results", rid, data]])
        return rid


_store: Optional[Store] = None


def get() -> Store:
    global _store
    if _store is None:
        from config import Config

        _store = Store(Config.INSTANTDB_APP_ID or "", Config.INSTANTDB_ADMIN_TOKEN or "")
    return _store


def numbers_of(row: Dict[str, Any]) -> tuple:
    return tuple(sorted(int(row[f"number_{i}"]) for i in range(1, 7)))
