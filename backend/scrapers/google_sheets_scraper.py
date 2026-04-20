"""Google Sheets scraper for PCSO lottery historical data."""
from datetime import datetime, date, timedelta
from typing import Any, List, Dict, Optional, Tuple
from services.instantdb_client import instantdb
from config import Config
import logging
import re
import os
import time
import urllib.parse
import pandas as pd
import requests

logger = logging.getLogger(__name__)

class GoogleSheetsScraper:
    """
    PCSO lottery data from Google Sheets.

    - **Incremental** (recommended): When `GOOGLE_SERVICE_ACCOUNT_FILE` exists, the sheet is shared
      with that service account, and `SHEETS_INCREMENTAL_ENABLED` is true, only a small row range
      is read via the Sheets API (see stored cursor in InstantDB). New rows are merged; existing
      `(draw_date, draw_number)` keys are skipped.
    - **Tail via Sheets REST**: If gspread incremental fails (e.g. API 400) but credentials exist,
      the same service account can call `values.get` for `A{cursor}:Z…` only — avoids downloading and
      parsing the whole CSV when you added one row.
    - **Full CSV**: If credentials are missing or `full_sync=true`, the public CSV export is used
      (downloads the **entire** sheet each time). Parsed rows are still **deduplicated** against
      InstantDB before insert — only missing draws are written.
    - **Append-only dedupe** (default on for CSV fallback): Only recent sheet rows + a tail window are
      checked against InstantDB, so routine syncs do not run thousands of OR queries. Use `full_sync`
      to re-check the whole sheet.
    """
    
    def __init__(self):
        self.games = Config.GAMES
        self.sheet_ids = Config.GOOGLE_SHEETS
        self._sheet_header_row: Dict[str, List] = {}
        self._csv_cache: Dict[str, Tuple[float, pd.DataFrame]] = {}

    @staticmethod
    def _a1_range(ws_name: str, row_start: int, row_end: int) -> str:
        """Build A1 notation for columns A–Z on a worksheet (quoted for special names)."""
        safe = "'" + str(ws_name).replace("'", "''") + "'"
        return f"{safe}!A{row_start}:Z{row_end}"

    def _sheets_rest_get_values(self, sheet_id: str, range_a1: str) -> Optional[List[List[Any]]]:
        """
        Read a cell range via Sheets API v4 (HTTP). Returns None on failure so caller can fall back.
        Uses the same service account file as gspread incremental.
        """
        try:
            from google.oauth2.service_account import Credentials
            from google.auth.transport.requests import Request as GARequest

            scopes = ["https://www.googleapis.com/auth/spreadsheets.readonly"]
            creds = Credentials.from_service_account_file(
                str(Config.GOOGLE_SERVICE_ACCOUNT_FILE), scopes=scopes
            )
            creds.refresh(GARequest())
            enc = urllib.parse.quote(range_a1, safe="")
            url = f"https://sheets.googleapis.com/v4/spreadsheets/{sheet_id}/values/{enc}"
            r = requests.get(
                url,
                headers={"Authorization": f"Bearer {creds.token}"},
                timeout=45,
            )
            if r.status_code != 200:
                logger.warning(
                    "Sheets REST values.get %s → HTTP %s %s",
                    range_a1,
                    r.status_code,
                    (r.text or "")[:240],
                )
                return None
            return r.json().get("values", [])
        except Exception as e:
            logger.warning("Sheets REST read failed: %s", e)
            return None

    def _try_tail_scrape_via_sheets_rest(
        self,
        game_type: str,
        sheet_id: str,
        game_name: str,
        sync_mode: str,
    ) -> Optional[Dict]:
        """
        When a cursor exists, read only new rows via Sheets REST (not full gviz CSV).
        Returns a stats dict if this path handled the scrape; None to use full CSV.
        """
        rec = instantdb.get_sheet_cursor(game_type)
        if not rec or rec.get("next_row") is None:
            return None
        if rec.get("sheet_id") and str(rec.get("sheet_id")) != str(sheet_id):
            return None

        next_row = int(rec["next_row"])
        ws = Config.SHEETS_WORKSHEET_NAME
        wcfg = int(Config.SHEETS_INCREMENTAL_WINDOW)
        window = max(5, min(wcfg, 500))
        max_passes = min(40, int(Config.SHEETS_TAIL_MAX_PASSES))

        probe = self._sheets_rest_get_values(sheet_id, self._a1_range(ws, next_row, next_row))
        if probe is None:
            return None
        if not probe or not probe[0] or not any(str(c).strip() for c in probe[0] if c is not None):
            logger.info(
                "Sheets tail probe: no data at row %s — skipping full CSV (%s)",
                next_row,
                sync_mode,
            )
            return self._finalize_parse_and_write(
                game_type,
                game_name,
                [],
                0,
                f"{sync_mode}_tail_probe_no_new_rows",
                next_row,
            )

        if sheet_id not in self._sheet_header_row:
            header_row = self._sheets_rest_get_values(sheet_id, self._a1_range(ws, 1, 1))
            if not header_row or not header_row[0]:
                logger.warning("Sheets REST: could not read header row 1; falling back to CSV")
                return None
            self._sheet_header_row[sheet_id] = header_row[0]

        header = self._sheet_header_row[sheet_id]
        all_parsed: List[Dict] = []
        rows_fetched = 0
        cur = next_row

        for _ in range(max_passes):
            end_r = cur + window - 1
            chunk = self._sheets_rest_get_values(sheet_id, self._a1_range(ws, cur, end_r))
            if chunk is None:
                logger.warning(
                    "Sheets REST tail read failed at row %s; falling back to full CSV",
                    cur,
                )
                return None
            if not chunk:
                break
            df = self._dataframe_from_matrix(header, chunk)
            part = self._parse_sheet_data(df, game_type)
            all_parsed.extend(part)
            rows_fetched += len(chunk)
            cur += len(chunk)
            if len(chunk) < window:
                break

        try:
            instantdb.upsert_sheet_cursor(game_type, cur, sheet_id)
        except Exception as e:
            logger.warning("Could not persist sheet cursor after REST tail read: %s", e)

        logger.info(
            "Sheets REST tail: read ~%s row(s) from row %s (not full CSV)",
            rows_fetched,
            next_row,
        )
        return self._finalize_parse_and_write(
            game_type,
            game_name,
            all_parsed,
            rows_fetched,
            f"{sync_mode}_sheets_rest_tail",
            cur,
        )
    
    def _extract_sheet_id(self, url: str) -> str:
        """Extract sheet ID from Google Sheets URL."""
        # Extract ID from various URL formats
        patterns = [
            r'/spreadsheets/d/([a-zA-Z0-9-_]+)',
            r'id=([a-zA-Z0-9-_]+)',
        ]
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        raise ValueError(f"Could not extract sheet ID from URL: {url}")
    
    def _parse_date(self, date_str: str) -> Optional[datetime]:
        """Parse date from various formats (M/D/YYYY, MM/DD/YYYY, etc.)."""
        if not date_str or date_str.strip() == '':
            return None
        
        date_str = date_str.strip()
        
        # Try different date formats
        formats = [
            '%m/%d/%Y',      # 4/1/2015
            '%m/%d/%y',      # 4/1/15
            '%d/%m/%Y',      # 1/4/2015
            '%d/%m/%y',      # 1/4/15
            '%Y-%m-%d',      # 2015-04-01
            '%m-%d-%Y',      # 04-01-2015
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        
        logger.warning(f"Could not parse date: {date_str}")
        return None
    
    def _parse_combinations(self, combo_str: str) -> Optional[List[int]]:
        """Parse combination string like '40-11-14-39-04-32' into list of integers."""
        if not combo_str or combo_str.strip() == '':
            return None
        
        try:
            # Split by hyphen and convert to integers
            numbers = [int(n.strip()) for n in combo_str.split('-')]
            if len(numbers) == 6:
                return sorted(numbers)  # Return sorted for consistency
            else:
                logger.warning(f"Expected 6 numbers, got {len(numbers)}: {combo_str}")
                return None
        except ValueError as e:
            logger.warning(f"Could not parse combinations: {combo_str} - {e}")
            return None
    
    def _parse_jackpot(self, jackpot_str: str) -> Optional[float]:
        """Parse jackpot string like '129,835,788.00' to float."""
        if not jackpot_str or jackpot_str.strip() == '':
            return None
        
        try:
            # Remove commas and convert to float
            return float(jackpot_str.replace(',', ''))
        except ValueError:
            logger.warning(f"Could not parse jackpot: {jackpot_str}")
            return None
    
    def _parse_winners(self, winners_str: str) -> Optional[int]:
        """Parse winners string to integer."""
        if not winners_str or winners_str.strip() == '':
            return 0
        
        try:
            return int(winners_str.strip())
        except ValueError:
            logger.warning(f"Could not parse winners: {winners_str}")
            return 0

    @staticmethod
    def _draw_date_sort_key(result: Dict) -> str:
        d = result.get("draw_date")
        if not d:
            return ""
        s = str(d)
        return s[:10] if len(s) >= 10 else s

    @staticmethod
    def _db_latest_draw_date(row: Optional[Dict]) -> Optional[date]:
        if not row:
            return None
        raw = row.get("draw_date")
        if not raw:
            return None
        s = str(raw).replace("Z", "+00:00")
        try:
            if "T" in s:
                return datetime.fromisoformat(s.split("+")[0]).date()
            return datetime.strptime(s[:10], "%Y-%m-%d").date()
        except ValueError:
            return None

    def _append_only_candidate_rows(
        self, game_type: str, sheet_results: List[Dict], sync_mode: str
    ) -> Optional[List[Dict]]:
        """
        Reduce dedupe to recent draws + sheet tail (append-only). Returns None = use full sheet.
        """
        if not getattr(Config, "SHEETS_APPEND_ONLY_DEDUPE", True):
            return None
        if sync_mode in ("full", "full_bootstrap"):
            return None
        if "incremental" in sync_mode or "sheets_rest_tail" in sync_mode or "tail_probe" in sync_mode:
            return None
        if not sheet_results:
            return None

        latest_rows = instantdb.get_results(
            game_type, limit=1, offset=0, order_by="draw_date.desc"
        )
        if not latest_rows:
            return None

        d_max = self._db_latest_draw_date(latest_rows[0])
        if d_max is None:
            return None

        skew = int(getattr(Config, "SHEETS_APPEND_ONLY_DATE_SKEW_DAYS", 5))
        start = (d_max - timedelta(days=skew)).isoformat()
        tail_n = int(getattr(Config, "SHEETS_DEDUPE_TAIL_ROWS", 80))

        by_date = [r for r in sheet_results if self._draw_date_sort_key(r) >= start]
        tail = sheet_results[-tail_n:] if len(sheet_results) > tail_n else list(sheet_results)

        merged: Dict[str, Dict] = {}
        for r in by_date + tail:
            merged[self._composite_key_parsed(r)] = r
        out = list(merged.values())
        logger.info(
            "Append-only dedupe: %s candidate row(s) vs %s sheet rows (latest DB date %s)",
            len(out),
            len(sheet_results),
            d_max.isoformat(),
        )
        return out
    
    def _read_sheet_public(self, sheet_id: str) -> pd.DataFrame:
        """Read public Google Sheet using pandas (short TTL cache per sheet_id to speed repeat syncs)."""
        try:
            ttl = float(getattr(Config, "SHEETS_CSV_CACHE_TTL_SEC", 120))
            now = time.monotonic()
            if ttl > 0 and sheet_id in self._csv_cache:
                ts, cached = self._csv_cache[sheet_id]
                if now - ts < ttl:
                    logger.info(
                        "Using in-memory CSV cache for sheet %s (%.0fs TTL, age %.1fs)",
                        sheet_id,
                        ttl,
                        now - ts,
                    )
                    return cached.copy()

            sheet_name = "Sheet1"
            url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv&sheet={sheet_name}"

            logger.info(f"Reading Google Sheet {sheet_id} using pandas...")
            df = pd.read_csv(url)

            logger.info(f"Successfully read {len(df)} rows from sheet {sheet_id}")
            logger.info(f"Columns: {list(df.columns)}")

            if ttl > 0:
                self._csv_cache[sheet_id] = (now, df)

            return df

        except Exception as e:
            logger.error(f"Failed to read Google Sheet {sheet_id}: {e}")
            raise Exception(f"Could not read Google Sheet {sheet_id}. Make sure it's publicly accessible. Error: {e}")
    
    def _read_sheet(self, sheet_id: str) -> pd.DataFrame:
        """Read Google Sheet data using pandas."""
        return self._read_sheet_public(sheet_id)
    
    def _parse_sheet_data(self, df: pd.DataFrame, game_type: str) -> List[Dict]:
        """Parse pandas DataFrame into result dictionaries."""
        results = []
        
        if df.empty:
            logger.warning(f"No data rows found in sheet for {game_type}")
            return results
        
        logger.info(f"Parsing {len(df)} rows from DataFrame")
        logger.debug("DataFrame columns: %s", list(df.columns))
        if len(df) <= 30:
            logger.debug("First few rows:\n%s", df.head(3))
        
        # Get expected game name for filtering
        expected_game_name = self.games[game_type]['name']
        logger.info(f"Filtering for game: {expected_game_name}")
        
        # Find column names (pandas already has headers)
        combinations_col = None
        draw_date_col = None
        jackpot_col = None
        winners_col = None
        lotto_game_col = None
        
        # Map column names (exact match first, then partial)
        for col in df.columns:
            col_upper = str(col).upper().strip()
            
            # Exact matches first
            if col_upper == 'LOTTO GAME' or col_upper == 'LOTTOGAME':
                lotto_game_col = col
                logger.info(f"Found LottoGame column: {col}")
            elif col_upper == 'COMBINATIONS':
                combinations_col = col
                logger.info(f"Found combinations column: {col}")
            elif col_upper == 'DRAW DATE' or col_upper == 'DATE':
                draw_date_col = col
                logger.info(f"Found draw date column: {col}")
            elif col_upper == 'JACKPOT (PHP)' or 'JACKPOT' in col_upper:
                jackpot_col = col
                logger.info(f"Found jackpot column: {col}")
            elif col_upper == 'WINNERS':
                winners_col = col
                logger.info(f"Found winners column: {col}")
            # Partial matches as fallback
            elif 'COMBINATION' in col_upper and not combinations_col:
                combinations_col = col
                logger.info(f"Found combinations column (partial match): {col}")
            elif ('DATE' in col_upper or 'DRAW' in col_upper) and not draw_date_col:
                draw_date_col = col
                logger.info(f"Found draw date column (partial match): {col}")
            elif ('JACKPOT' in col_upper or 'PRIZE' in col_upper) and not jackpot_col:
                jackpot_col = col
                logger.info(f"Found jackpot column (partial match): {col}")
            elif 'WINNER' in col_upper and not winners_col:
                winners_col = col
                logger.info(f"Found winners column (partial match): {col}")
        
        # If columns not found by name, try to detect by content
        if not combinations_col or not draw_date_col:
            logger.info("Auto-detecting columns by content...")
            for col in df.columns:
                sample_values = df[col].dropna().head(5).astype(str)
                
                # Check for combinations (has hyphens)
                if not combinations_col:
                    for val in sample_values:
                        if '-' in val and len(val.split('-')) == 6:
                            if all(p.strip().isdigit() for p in val.split('-')):
                                combinations_col = col
                                logger.info(f"Auto-detected combinations column: {col}")
                                break
                
                # Check for date (has slashes)
                if not draw_date_col:
                    for val in sample_values:
                        if '/' in val:
                            parts = val.split('/')
                            if len(parts) == 3 and all(p.strip().isdigit() for p in parts):
                                year = parts[2].strip()
                                if len(year) == 4 and (year.startswith('19') or year.startswith('20')):
                                    draw_date_col = col
                                    logger.info(f"Auto-detected draw date column: {col}")
                                    break
        
        # Verify we found the required columns
        if not combinations_col:
            raise ValueError(f"Could not find combinations column in sheet. Available columns: {list(df.columns)}")
        if not draw_date_col:
            raise ValueError(f"Could not find draw date column in sheet. Available columns: {list(df.columns)}")
        
        logger.info(f"Using columns - Combinations: {combinations_col}, Date: {draw_date_col}, Jackpot: {jackpot_col}, Winners: {winners_col}")
        
        # Parse each row
        parsed_count = 0
        skipped_count = 0
        
        for idx, row in df.iterrows():
            try:
                # Filter by LottoGame column if it exists
                if lotto_game_col:
                    lotto_game_value = str(row[lotto_game_col]) if lotto_game_col in row and pd.notna(row[lotto_game_col]) else ''
                    
                    if lotto_game_value:
                        # Normalize by removing spaces and converting to lowercase for comparison
                        # This handles variations like "Superlotto 6/49" vs "Super Lotto 6/49"
                        expected_normalized = expected_game_name.lower().replace(' ', '')
                        lotto_value_normalized = lotto_game_value.lower().replace(' ', '')
                        
                        # Check if normalized strings match (bidirectional check for flexibility)
                        if expected_normalized not in lotto_value_normalized and lotto_value_normalized not in expected_normalized:
                            # Skip rows that don't match the game type
                            continue
                
                # Get values from columns (handle NaN values)
                combinations_str = str(row[combinations_col]) if combinations_col and combinations_col in row and pd.notna(row[combinations_col]) else ''
                draw_date_str = str(row[draw_date_col]) if draw_date_col and draw_date_col in row and pd.notna(row[draw_date_col]) else ''
                jackpot_str = str(row[jackpot_col]) if jackpot_col and jackpot_col in row and pd.notna(row[jackpot_col]) else ''
                winners_str = str(row[winners_col]) if winners_col and winners_col in row and pd.notna(row[winners_col]) else ''
                
                # Clean up "nan" strings
                if combinations_str.lower() == 'nan':
                    combinations_str = ''
                if draw_date_str.lower() == 'nan':
                    draw_date_str = ''
                if jackpot_str.lower() == 'nan':
                    jackpot_str = ''
                if winners_str.lower() == 'nan':
                    winners_str = ''
                
                # Parse values
                numbers = self._parse_combinations(combinations_str)
                draw_date = self._parse_date(draw_date_str)
                jackpot = self._parse_jackpot(jackpot_str)
                winners = self._parse_winners(winners_str)
                
                # Skip if essential data is missing
                if not numbers or not draw_date:
                    skipped_count += 1
                    if idx < 5:  # Log first few failures for debugging
                        logger.debug(f"  Skipping row {idx}: combinations='{combinations_str[:30]}', date='{draw_date_str[:30]}', numbers={numbers is not None}, date={draw_date is not None}")
                    continue
                
                parsed_count += 1
                
                # Generate draw_number from combinations (format: "01-02-03-04-05-06")
                draw_number = '-'.join([f"{n:02d}" for n in sorted(numbers)])
                
                # Create result dictionary matching InstantDB schema exactly
                result = {
                    'draw_date': draw_date.isoformat(),  # From Google Sheets "Draw Date"
                    'draw_number': draw_number,  # Generated from 6 combinations
                    'number_1': numbers[0],  # First number from Combinations
                    'number_2': numbers[1],  # Second number from Combinations
                    'number_3': numbers[2],  # Third number from Combinations
                    'number_4': numbers[3],  # Fourth number from Combinations
                    'number_5': numbers[4],  # Fifth number from Combinations
                    'number_6': numbers[5],  # Sixth number from Combinations
                    'jackpot': jackpot,  # From Google Sheets "Jackpot"
                    'winners': winners,  # From Google Sheets "Winners"
                    # Note: 'id' and 'created_at' will be auto-generated by InstantDB
                }
                
                results.append(result)
                
            except Exception as e:
                logger.warning(f"Error parsing row {idx}: {e}")
                continue
        
        logger.info(f"Parsed {len(results)} results from sheet for {game_type} (skipped {skipped_count} invalid rows)")
        if len(results) == 0:
            logger.warning(f"No valid results parsed from sheet! Check column mapping and data format.")
        return results
    
    def _get_existing_results(self, game_type: str) -> Dict[str, Dict]:
        """Get existing results from InstantDB to check for duplicates."""
        try:
            existing = instantdb.get_results(game_type, limit=10000)  # Get all results
            # Create a lookup by draw_date AND draw_number for better duplicate detection
            lookup = {}
            for result in existing:
                draw_date = result.get('draw_date')
                draw_number = result.get('draw_number', '')
                
                if draw_date:
                    # Normalize date format for comparison
                    if isinstance(draw_date, str):
                        try:
                            dt = datetime.fromisoformat(draw_date.replace('Z', '+00:00'))
                            date_key = dt.date().isoformat()
                        except:
                            date_key = draw_date
                    else:
                        date_key = str(draw_date)
                    
                    # Create composite key: "date|draw_number"
                    composite_key = f"{date_key}|{draw_number}"
                    lookup[composite_key] = result
            
            return lookup
        except Exception as e:
            logger.warning(f"Could not fetch existing results: {e}")
            return {}

    @staticmethod
    def _composite_key_parsed(result: Dict) -> str:
        dt = datetime.fromisoformat(str(result["draw_date"]).replace("Z", "+00:00"))
        date_key = dt.date().isoformat()
        dn = result.get("draw_number")
        dn = "" if dn is None else str(dn)
        return f"{date_key}|{dn}"

    def _build_existing_lookup(
        self, game_type: str, sheet_results: List[Dict]
    ) -> Tuple[Dict[str, Dict], Optional[int]]:
        """
        Build composite_key -> row lookup for deduplication.
        Uses a small filtered InstantDB query when there are few candidates; otherwise one full scan.
        Returns (lookup, total_db_rows_used_for_dedupe or None if unknown).
        """
        n = len(sheet_results)
        threshold = getattr(Config, "SHEETS_DEDUPE_FULL_TABLE_THRESHOLD", 500)
        if n == 0:
            return {}, 0
        if n <= threshold:
            candidates = [
                {"draw_date": r["draw_date"], "draw_number": r.get("draw_number") or ""}
                for r in sheet_results
            ]
            try:
                keys = instantdb.fetch_existing_result_keys_for_candidates(game_type, candidates)
                lookup = {k: {} for k in keys}
                logger.info(
                    "Dedupe: targeted query for %s sheet row(s) (threshold %s) — skipping full results table load",
                    n,
                    threshold,
                )
                return lookup, None
            except Exception as e:
                logger.warning("Targeted dedupe failed; falling back to full table scan: %s", e)
        lookup = self._get_existing_results(game_type)
        return lookup, len(lookup)

    def _incremental_eligible(self) -> bool:
        if not getattr(Config, "SHEETS_INCREMENTAL_ENABLED", True):
            return False
        path = Config.GOOGLE_SERVICE_ACCOUNT_FILE
        return bool(path) and os.path.isfile(str(path))

    def _get_gspread_worksheet(self, sheet_id: str):
        import gspread
        from google.oauth2.service_account import Credentials

        scopes = ["https://www.googleapis.com/auth/spreadsheets.readonly"]
        creds = Credentials.from_service_account_file(Config.GOOGLE_SERVICE_ACCOUNT_FILE, scopes=scopes)
        gc = gspread.authorize(creds)
        sh = gc.open_by_key(sheet_id)
        return sh.worksheet(Config.SHEETS_WORKSHEET_NAME)

    def _dataframe_from_matrix(self, header: List[str], rows: List[List[Any]]) -> pd.DataFrame:
        if not rows:
            return pd.DataFrame()
        header = [str(h).strip() if h is not None else "" for h in header]
        ncol = len(header)
        padded = []
        for r in rows:
            r = r or []
            row = list(r) + [""] * ncol
            padded.append(row[:ncol])
        return pd.DataFrame(padded, columns=header)

    def _write_batches_to_instantdb(self, game_type: str, new_results: List[Dict]) -> Tuple[int, List[str]]:
        """Persist new result rows via save_results.js bridge."""
        import subprocess
        import json

        added_count = 0
        errors: List[str] = []
        if not new_results:
            return 0, errors

        batch_size = 250
        total_batches = (len(new_results) + batch_size - 1) // batch_size
        current_dir = os.path.dirname(os.path.abspath(__file__))
        script_path = os.path.normpath(os.path.join(current_dir, "..", "scripts", "save_results.js"))
        if not os.path.exists(script_path):
            alt_path = os.path.join(os.path.dirname(current_dir), "scripts", "save_results.js")
            if os.path.exists(alt_path):
                script_path = alt_path

        for batch_num in range(total_batches):
            batch_start = batch_num * batch_size
            batch_end = min(batch_start + batch_size, len(new_results))
            batch = new_results[batch_start:batch_end]
            try:
                batch_data = {"game_type": game_type, "results": batch}
                env = os.environ.copy()
                env["INSTANTDB_APP_ID"] = str(Config.INSTANTDB_APP_ID)
                env["INSTANTDB_ADMIN_TOKEN"] = str(Config.INSTANTDB_ADMIN_TOKEN)

                result = subprocess.run(
                    ["node", script_path],
                    input=json.dumps(batch_data),
                    text=True,
                    capture_output=True,
                    timeout=60,
                    env=env,
                    cwd=os.path.dirname(script_path) or os.getcwd(),
                )
                if result.returncode == 0:
                    try:
                        response = json.loads(result.stdout)
                        batch_added = response.get("added", len(batch))
                        added_count += batch_added
                    except json.JSONDecodeError:
                        added_count += len(batch)
                else:
                    error_msg = result.stderr or result.stdout
                    logger.error(f"Batch {batch_num + 1} failed: {error_msg}")
                    errors.append(f"Batch {batch_num + 1}: {error_msg}")
            except Exception as e:
                err = f"Error processing batch {batch_num + 1}: {e}"
                logger.error(err)
                errors.append(err)
        return added_count, errors

    def _finalize_parse_and_write(
        self,
        game_type: str,
        game_name: str,
        sheet_results: List[Dict],
        rows_fetched: int,
        sync_mode: str,
        cursor_after: Optional[int],
        existing_results: Optional[Dict[str, Dict]] = None,
    ) -> Dict:
        sheet_results = list(sheet_results)
        sheet_results.sort(key=lambda x: x["draw_date"])
        if sheet_results:
            logger.info(f"  First date: {sheet_results[0]['draw_date']}  Last: {sheet_results[-1]['draw_date']}")

        dedupe_rows = self._append_only_candidate_rows(game_type, sheet_results, sync_mode)
        if dedupe_rows is None:
            dedupe_rows = sheet_results
        narrow_keys = {self._composite_key_parsed(r) for r in dedupe_rows}

        existing_total: Optional[int]
        if existing_results is None:
            existing_results, existing_total = self._build_existing_lookup(game_type, dedupe_rows)
        else:
            existing_total = len(existing_results)
        new_results = []
        for result in sheet_results:
            composite_key = self._composite_key_parsed(result)
            if composite_key not in narrow_keys:
                continue
            if composite_key not in existing_results:
                new_results.append(result)

        logger.info(f"Found {len(new_results)} new results to add ({sync_mode}, rows_fetched={rows_fetched})")
        added_count, errors = self._write_batches_to_instantdb(game_type, new_results)

        out: Dict[str, Any] = {
            "game_type": game_type,
            "game_name": game_name,
            "total_in_sheet": len(sheet_results),
            "existing_in_db": existing_total,
            "new_results": len(new_results),
            "added": added_count,
            "errors": errors,
            "sync_mode": sync_mode,
            "rows_fetched": rows_fetched,
            "cursor_after": cursor_after,
        }
        return out

    async def _scrape_game_full_csv(
        self, game_type: str, sheet_id: str, game_name: str, sync_mode: str, persist_cursor: bool
    ) -> Dict:
        if not self._incremental_eligible():
            logger.warning(
                "Full Google Sheet CSV download (entire sheet). "
                "Set GOOGLE_SERVICE_ACCOUNT_FILE + share the spreadsheet with the service account "
                "to enable incremental row-range sync (much faster after the first run)."
            )
        elif persist_cursor and sync_mode != "full":
            tail_stats = self._try_tail_scrape_via_sheets_rest(
                game_type, sheet_id, game_name, sync_mode
            )
            if tail_stats is not None:
                return tail_stats

        df = self._read_sheet(sheet_id)
        logger.info(f"Read {len(df)} rows from sheet (CSV export, mode={sync_mode})")
        sheet_results = self._parse_sheet_data(df, game_type)
        next_row = 2 + len(df)
        if persist_cursor and self._incremental_eligible():
            try:
                instantdb.upsert_sheet_cursor(game_type, next_row, sheet_id)
            except Exception as e:
                logger.warning("Could not persist sheet cursor after full sync: %s", e)
        return self._finalize_parse_and_write(
            game_type, game_name, sheet_results, len(df), sync_mode, next_row if persist_cursor else None
        )

    async def scrape_game(self, game_type: str, full_sync: bool = False) -> Dict:
        """Scrape one game: incremental (gspread range) when eligible, else full CSV. Use full_sync=True to re-read entire sheet and reset cursor."""
        if game_type not in self.sheet_ids:
            raise ValueError(f"No Google Sheet configured for game type: {game_type}")

        sheet_id = self.sheet_ids[game_type]
        game_name = self.games[game_type]["name"]
        logger.info(f"Scraping {game_name} from Google Sheets (ID: {sheet_id})...")

        if full_sync or not self._incremental_eligible():
            if full_sync:
                logger.info("full_sync requested — using full CSV path")
            elif not self._incremental_eligible():
                logger.info("Incremental disabled or no GOOGLE_SERVICE_ACCOUNT_FILE — using full CSV path")
            return await self._scrape_game_full_csv(
                game_type, sheet_id, game_name, "full" if full_sync else "full_csv_fallback", persist_cursor=True
            )

        try:
            rec = instantdb.get_sheet_cursor(game_type)
            if rec and rec.get("sheet_id") and str(rec.get("sheet_id")) != str(sheet_id):
                logger.info("Stored sheet_id differs from config — running full CSV bootstrap")
                return await self._scrape_game_full_csv(game_type, sheet_id, game_name, "full_bootstrap", persist_cursor=True)
            if not rec or rec.get("next_row") is None:
                logger.info("No sheet cursor yet — full CSV bootstrap")
                return await self._scrape_game_full_csv(game_type, sheet_id, game_name, "full_bootstrap", persist_cursor=True)

            ws = self._get_gspread_worksheet(sheet_id)
            cursor = int(rec["next_row"])
            wcfg = int(Config.SHEETS_INCREMENTAL_WINDOW)
            window = max(5, min(wcfg, 500))
            end_row = cursor + window - 1
            range_a1 = f"A{cursor}:Z{end_row}"
            logger.info(
                "Incremental sync: reading %s only (~%s sheet rows), not the full spreadsheet",
                range_a1,
                end_row - cursor + 1,
            )
            values = ws.get(range_a1)
            if not values:
                # Advance by window so we don't get stuck if the sheet has blank gaps below the cursor.
                next_row = cursor + window
                try:
                    instantdb.upsert_sheet_cursor(game_type, next_row, sheet_id)
                except Exception as e:
                    logger.warning("Could not persist sheet cursor after empty chunk: %s", e)
                logger.info(
                    "Empty incremental chunk at cursor=%s — advancing cursor by window=%s to %s",
                    cursor,
                    window,
                    next_row,
                )
                return {
                    "game_type": game_type,
                    "game_name": game_name,
                    "total_in_sheet": 0,
                    "existing_in_db": None,
                    "new_results": 0,
                    "added": 0,
                    "errors": [],
                    "sync_mode": "incremental",
                    "rows_fetched": 0,
                    "cursor_after": next_row,
                }

            if sheet_id not in self._sheet_header_row:
                self._sheet_header_row[sheet_id] = ws.row_values(1)
            header = self._sheet_header_row[sheet_id]
            if not header:
                raise ValueError("Could not read row 1 header from sheet")
            df = self._dataframe_from_matrix(header, values)
            sheet_results = self._parse_sheet_data(df, game_type)
            next_row = cursor + len(values)
            try:
                instantdb.upsert_sheet_cursor(game_type, next_row, sheet_id)
            except Exception as e:
                logger.warning("Could not persist sheet cursor after incremental: %s", e)

            return self._finalize_parse_and_write(
                game_type, game_name, sheet_results, len(values), "incremental", next_row
            )
        except Exception as e:
            logger.warning("Incremental scrape failed (%s); falling back to full CSV", e)
            import traceback
            logger.debug(traceback.format_exc())
            return await self._scrape_game_full_csv(
                game_type, sheet_id, game_name, "full_csv_fallback_error", persist_cursor=True
            )
    
    async def scrape_all_games(self, full_sync: bool = False) -> Dict:
        """Scrape data for all games from Google Sheets."""
        logger.info("Starting to scrape all games from Google Sheets...")
        
        stats = {
            'total_games': len(self.sheet_ids),
            'games': {},
            'summary': {
                'total_results_in_sheets': 0,
                'total_existing_in_db': 0,
                'total_new_results': 0,
                'total_added': 0
            }
        }
        
        for game_type in self.sheet_ids.keys():
            try:
                game_stats = await self.scrape_game(game_type, full_sync=full_sync)
                stats['games'][game_type] = game_stats
                
                # Update summary
                stats['summary']['total_results_in_sheets'] += game_stats.get('total_in_sheet', 0)
                ex = game_stats.get('existing_in_db')
                if isinstance(ex, int):
                    stats['summary']['total_existing_in_db'] += ex
                stats['summary']['total_new_results'] += game_stats.get('new_results', 0)
                stats['summary']['total_added'] += game_stats.get('added', 0)
                
                # Log success
                if game_stats.get('added', 0) > 0:
                    logger.info(f"✅ {game_type}: Added {game_stats.get('added')} new results")
                else:
                    logger.info(f"ℹ️ {game_type}: No new results to add")
                
            except Exception as e:
                logger.error(f"❌ Failed to scrape {game_type}: {e}")
                import traceback
                logger.error(traceback.format_exc())
                stats['games'][game_type] = {
                    'error': str(e),
                    'added': 0,
                    'game_type': game_type
                }
        
        logger.info(f"Scraping complete. Added {stats['summary']['total_added']} new results")
        return stats

