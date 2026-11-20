"""
Read the bottom of a results Sheet. One Sheets API call per sync reads columns A:E; measured
0.7-1.2 s for ~1,800 rows, about the same as a 40-row range. With no stored row cursor,
nothing can drift past the data (the old cursor bug), and edits to recent rows are seen too.
"""
from __future__ import annotations

import threading
import time
import urllib.parse
from typing import Any, List, Optional, Sequence, Tuple

import requests

SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]


class SheetError(RuntimeError):
    def __init__(self, message: str, status: Optional[int] = None):
        super().__init__(message)
        self.status = status

    @property
    def is_quota(self) -> bool:
        return self.status == 429


def trim_rows(values: Sequence[Sequence[Any]]) -> List[List[Any]]:
    """Drop trailing blank rows. gspread and the API can return [[]] or [] for empty ranges."""
    rows = [list(r) for r in values]
    while rows and all(str(c).strip() == "" for c in rows[-1]):
        rows.pop()
    return rows


def tail_with_row_numbers(values: Sequence[Sequence[Any]], tail: int) -> Tuple[List[Any], List[Tuple[int, List[Any]]]]:
    """(header, [(sheet_row_number, cells)]) for the last `tail` data rows. Row 1 is the header."""
    rows = trim_rows(values)
    if not rows:
        return [], []
    header, data = rows[0], rows[1:]
    start = max(0, len(data) - tail)
    return header, [(i + 2, data[i]) for i in range(start, len(data))]


class SheetReader:
    def __init__(self, service_account_file: str, worksheet: str = "Sheet1", timeout: float = 20.0):
        self._file = service_account_file
        self._ws = worksheet
        self._timeout = timeout
        self._creds = None
        self._lock = threading.Lock()
        self._session = requests.Session()

    def _token(self) -> str:
        from google.auth.transport.requests import Request as GARequest
        from google.oauth2.service_account import Credentials

        with self._lock:
            if self._creds is None:
                self._creds = Credentials.from_service_account_file(self._file, scopes=SCOPES)
            if not self._creds.valid:
                self._creds.refresh(GARequest())
            return self._creds.token

    def read_values(self, sheet_id: str) -> List[List[Any]]:
        rng = urllib.parse.quote(f"'{self._ws}'!A:E", safe="")
        url = f"https://sheets.googleapis.com/v4/spreadsheets/{sheet_id}/values/{rng}"
        try:
            r = self._session.get(url, headers={"Authorization": f"Bearer {self._token()}"}, timeout=self._timeout)
        except requests.RequestException as e:
            raise SheetError(f"Sheets API request failed: {e}") from e
        if r.status_code != 200:
            raise SheetError(f"Sheets API HTTP {r.status_code}: {r.text[:200]}", r.status_code)
        return r.json().get("values", [])

    def read_tail(self, sheet_id: str, tail: int) -> Tuple[List[Any], List[Tuple[int, List[Any]]], float]:
        t0 = time.perf_counter()
        values = self.read_values(sheet_id)
        header, rows = tail_with_row_numbers(values, tail)
        return header, rows, (time.perf_counter() - t0) * 1000
