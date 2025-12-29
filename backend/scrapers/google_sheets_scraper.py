"""Google Sheets scraper for PCSO lottery historical data."""
from datetime import datetime
from typing import List, Dict, Optional
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
                    # Check if this row matches the expected game
                    if lotto_game_value and expected_game_name.lower() not in lotto_game_value.lower():
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
            # Create a lookup by draw_date
            lookup = {}
            for result in existing:
                draw_date = result.get('draw_date')
                if draw_date:
                    # Normalize date format for comparison
                    if isinstance(draw_date, str):
                        try:
                            dt = datetime.fromisoformat(draw_date.replace('Z', '+00:00'))
                            lookup[dt.date().isoformat()] = result
                        except:
                            lookup[draw_date] = result
                    else:
                        lookup[str(draw_date)] = result
            return lookup
        except Exception as e:
            logger.warning(f"Could not fetch existing results: {e}")
            return {}
    
    async def scrape_game(self, game_type: str) -> Dict:
        """Scrape data for a specific game from Google Sheets."""
        if game_type not in self.sheet_ids:
            raise ValueError(f"No Google Sheet configured for game type: {game_type}")
        
        sheet_id = self.sheet_ids[game_type]
        game_name = self.games[game_type]['name']
        
        logger.info(f"Scraping {game_name} from Google Sheets (ID: {sheet_id})...")
        
        try:
            # Read sheet data using pandas
            df = self._read_sheet(sheet_id)
            logger.info(f"Read {len(df)} rows from sheet")
            
            # Parse data
            sheet_results = self._parse_sheet_data(df, game_type)
            logger.info(f"Parsed {len(sheet_results)} results from sheet")
            
            # Get existing results from InstantDB
            existing_results = self._get_existing_results(game_type)
            logger.info(f"Found {len(existing_results)} existing results in database")
            
            # Filter out duplicates
            new_results = []
            for result in sheet_results:
                draw_date = datetime.fromisoformat(result['draw_date']).date().isoformat()
                if draw_date not in existing_results:
                    new_results.append(result)
            
            logger.info(f"Found {len(new_results)} new results to add")
            
            # Add new results to InstantDB using batch saves via Node.js Admin SDK
            added_count = 0
            errors = []
            
            logger.info(f"Attempting to add {len(new_results)} new results to InstantDB...")
            
            if len(new_results) == 0:
                logger.info("No new results to add - all data already exists in database")
            else:
                # Use batch processing with Node.js Admin SDK bridge
                # Process in batches of 100 to avoid overwhelming the system
                batch_size = 100
                total_batches = (len(new_results) + batch_size - 1) // batch_size
                
                logger.info(f"Processing {len(new_results)} results in {total_batches} batches of {batch_size}...")
                
                for batch_num in range(total_batches):
                    batch_start = batch_num * batch_size
                    batch_end = min(batch_start + batch_size, len(new_results))
                    batch = new_results[batch_start:batch_end]
                    
                    logger.info(f"Processing batch {batch_num + 1}/{total_batches}: records {batch_start + 1}-{batch_end} of {len(new_results)}")
                    
                    try:
                        # Save batch using Node.js Admin SDK bridge
                        import subprocess
                        import json
                        import os
                        
                        # Find the Node.js script
                        current_dir = os.path.dirname(os.path.abspath(__file__))
                        script_path = os.path.join(current_dir, '..', 'scripts', 'save_results.js')
                        script_path = os.path.normpath(script_path)
                        
                        if not os.path.exists(script_path):
                            alt_path = os.path.join(os.path.dirname(current_dir), 'scripts', 'save_results.js')
                            if os.path.exists(alt_path):
                                script_path = alt_path
                        
                        # Prepare batch data
                        batch_data = {
                            'game_type': game_type,
                            'results': batch
                        }
                        
                        # Set environment variables
                        env = os.environ.copy()
                        from config import Config
                        env['INSTANTDB_APP_ID'] = str(Config.INSTANTDB_APP_ID)
                        env['INSTANTDB_ADMIN_TOKEN'] = str(Config.INSTANTDB_ADMIN_TOKEN)
                        
                        # Call Node.js script
                        result = subprocess.run(
                            ['node', script_path],
                            input=json.dumps(batch_data),
                            text=True,
                            capture_output=True,
                            timeout=60,
                            env=env,
                            cwd=os.path.dirname(script_path) or os.getcwd()
                        )
                        
                        if result.returncode == 0:
                            try:
                                response = json.loads(result.stdout)
                                batch_added = response.get('added', len(batch))
                                added_count += batch_added
                                logger.info(f"[OK] Batch {batch_num + 1} saved: {batch_added} results")
                            except json.JSONDecodeError:
                                # Assume success if script ran without error
                                added_count += len(batch)
                                logger.info(f"[OK] Batch {batch_num + 1} saved: {len(batch)} results (response not JSON)")
                        else:
                            error_msg = result.stderr or result.stdout
                            logger.error(f"Batch {batch_num + 1} failed: {error_msg}")
                            errors.append(f"Batch {batch_num + 1}: {error_msg}")
                    
                    except Exception as e:
                        error_msg = f"Error processing batch {batch_num + 1}: {e}"
                        logger.error(error_msg)
                        import traceback
                        logger.error(traceback.format_exc())
                        errors.append(error_msg)
                
                logger.info(f"[OK] Finished adding results: {added_count} successful, {len(errors)} errors")
            
            return {
                'game_type': game_type,
                'game_name': game_name,
                'total_in_sheet': len(sheet_results),
                'existing_in_db': len(existing_results),
                'new_results': len(new_results),
                'added': added_count,
                'errors': errors
            }
            
        except Exception as e:
            logger.error(f"Error scraping {game_name}: {e}")
            import traceback
            logger.error(traceback.format_exc())
            raise
    
    async def scrape_all_games(self) -> Dict:
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
                game_stats = await self.scrape_game(game_type)
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

