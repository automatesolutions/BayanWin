"""Google Sheets scraper for PCSO lottery historical data."""
from datetime import datetime
from typing import Any, List, Dict, Optional, Tuple
from services.instantdb_client import instantdb
from config import Config
import logging
import re
import os
import pandas as pd

logger = logging.getLogger(__name__)

class GoogleSheetsScraper:
    """Scraper for reading PCSO lottery data from Google Sheets."""
    
    def __init__(self):
        self.games = Config.GAMES
        self.sheet_ids = Config.GOOGLE_SHEETS
    
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
    
    def _read_sheet_public(self, sheet_id: str) -> pd.DataFrame:
        """Read public Google Sheet using pandas."""
        try:
            # Use pandas to read CSV directly from Google Sheets
            sheet_name = "Sheet1"  # Default sheet name
            url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv&sheet={sheet_name}"
            
            logger.info(f"Reading Google Sheet {sheet_id} using pandas...")
            df = pd.read_csv(url)
            
            logger.info(f"Successfully read {len(df)} rows from sheet {sheet_id}")
            logger.info(f"Columns: {list(df.columns)}")
            
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
        logger.info(f"DataFrame columns: {list(df.columns)}")
        logger.info(f"First few rows:\n{df.head(3)}")
        
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

        batch_size = 100
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
        self, game_type: str, game_name: str, sheet_results: List[Dict], rows_fetched: int, sync_mode: str, cursor_after: Optional[int]
    ) -> Dict:
        sheet_results = list(sheet_results)
        sheet_results.sort(key=lambda x: x["draw_date"])
        if sheet_results:
            logger.info(f"  First date: {sheet_results[0]['draw_date']}  Last: {sheet_results[-1]['draw_date']}")

        existing_results = self._get_existing_results(game_type)
        new_results = []
        for result in sheet_results:
            draw_date = datetime.fromisoformat(result["draw_date"]).date().isoformat()
            draw_number = result.get("draw_number", "")
            composite_key = f"{draw_date}|{draw_number}"
            if composite_key not in existing_results:
                new_results.append(result)

        logger.info(f"Found {len(new_results)} new results to add ({sync_mode}, rows_fetched={rows_fetched})")
        added_count, errors = self._write_batches_to_instantdb(game_type, new_results)

        out: Dict[str, Any] = {
            "game_type": game_type,
            "game_name": game_name,
            "total_in_sheet": len(sheet_results),
            "existing_in_db": len(existing_results),
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
            window = max(10, int(Config.SHEETS_INCREMENTAL_WINDOW))
            end_row = cursor + window - 1
            range_a1 = f"A{cursor}:Z{end_row}"
            logger.info("Incremental gspread range %s", range_a1)
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
                    "existing_in_db": len(self._get_existing_results(game_type)),
                    "new_results": 0,
                    "added": 0,
                    "errors": [],
                    "sync_mode": "incremental",
                    "rows_fetched": 0,
                    "cursor_after": next_row,
                }

            header = ws.row_values(1)
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
                stats['summary']['total_existing_in_db'] += game_stats.get('existing_in_db', 0)
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

