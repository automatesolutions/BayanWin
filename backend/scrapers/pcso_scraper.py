"""PCSO website scraper for lottery results."""
import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from datetime import datetime, timedelta, date
from services.instantdb_client import instantdb
from config import Config
import time
import traceback
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PCSOScraper:
    """Scraper for PCSO lottery results."""
    
    def __init__(self):
        self.base_url = Config.PCSO_URL
        self.timeout = Config.SCRAPING_TIMEOUT
        self.max_retries = 3
        
    def setup_driver(self):
        """Setup Selenium WebDriver with robust Windows-compatible options."""
        chrome_options = Options()
        
        # Essential options for stability
        chrome_options.add_argument('--headless=new')  # New headless mode
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        
        # Additional stability options for Windows
        chrome_options.add_argument('--disable-software-rasterizer')
        chrome_options.add_argument('--disable-extensions')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_argument('--disable-infobars')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--start-maximized')
        
        # Prevent crashes
        chrome_options.add_argument('--disable-crash-reporter')
        chrome_options.add_argument('--disable-in-process-stack-traces')
        chrome_options.add_argument('--disable-logging')
        chrome_options.add_argument('--disable-dev-tools')
        chrome_options.add_argument('--log-level=3')
        chrome_options.add_argument('--silent')
        
        # Use single process to avoid multi-process issues
        chrome_options.add_argument('--single-process')
        
        # Memory management
        chrome_options.add_argument('--disable-web-security')
        chrome_options.add_argument('--allow-running-insecure-content')
        chrome_options.add_argument('--disable-features=VizDisplayCompositor')
        
        # Set preferences
        prefs = {
            'profile.default_content_setting_values': {
                'images': 2,  # Disable images for faster loading
                'javascript': 1  # Enable JavaScript
            },
            'profile.managed_default_content_settings': {
                'images': 2
            }
        }
        chrome_options.add_experimental_option('prefs', prefs)
        
        # Exclude automation flags
        chrome_options.add_experimental_option('excludeSwitches', ['enable-automation', 'enable-logging'])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        try:
            # Use webdriver-manager to automatically handle ChromeDriver
            service = Service(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=chrome_options)
            driver.set_page_load_timeout(self.timeout)
            logger.info("ChromeDriver initialized successfully")
            return driver
        except Exception as e:
            logger.error(f"Failed to initialize ChromeDriver: {e}")
            logger.error(traceback.format_exc())
            raise
    
    def scrape_game_results(self, game_type, driver=None, start_date=None, end_date=None):
        """
        Scrape results for a specific game with date range selection.
        
        Args:
            game_type: Game type identifier (e.g., 'ultra_lotto_6_58')
            driver: Optional Selenium WebDriver instance
            start_date: Start date (datetime object, defaults to 30 days ago)
            end_date: End date (datetime object, defaults to today)
            
        Returns:
            List of result dictionaries
        """
        # Retry logic for handling crashes
        for attempt in range(self.max_retries):
            close_driver = False
            local_driver = driver
            
            try:
                if local_driver is None:
                    local_driver = self.setup_driver()
                    close_driver = True
                
                # Set default dates if not provided
                if not start_date:
                    start_date = datetime.now() - timedelta(days=30)
                if not end_date:
                    end_date = datetime.now()
                
                logger.info(f"Attempt {attempt + 1}/{self.max_retries}: Scraping {game_type}")
                
                results = self._scrape_with_driver(local_driver, game_type, start_date, end_date)
                
                logger.info(f"Successfully scraped {len(results)} results for {game_type}")
                return results
                
            except Exception as e:
                logger.error(f"Attempt {attempt + 1}/{self.max_retries} failed for {game_type}: {str(e)}")
                logger.error(traceback.format_exc())
                
                if attempt < self.max_retries - 1:
                    logger.info(f"Retrying in 3 seconds...")
                    time.sleep(3)
                else:
                    logger.error(f"All {self.max_retries} attempts failed for {game_type}")
                    raise
                    
            finally:
                if close_driver and local_driver:
                    try:
                        local_driver.quit()
                    except:
                        pass
        
        return []
    
    def _scrape_with_driver(self, driver, game_type, start_date, end_date):
        """Internal method to perform the actual scraping."""
        try:
            driver.get(self.base_url)
            logger.info(f"Navigated to {self.base_url}")
            
            # Wait for page to load - wait for form elements
            WebDriverWait(driver, self.timeout).until(
                EC.presence_of_element_located((By.TAG_NAME, "select"))
            )
            
            # Small delay to ensure page is fully loaded
            time.sleep(2)
            
            # Map game types to PCSO game names
            game_options = {
                'ultra_lotto_6_58': 'Ultra Lotto 6/58',
                'grand_lotto_6_55': 'Grand Lotto 6/55',
                'super_lotto_6_49': 'Super Lotto 6/49',
                'mega_lotto_6_45': 'Mega Lotto 6/45',
                'lotto_6_42': 'Lotto 6/42'
            }
            
            game_name = game_options.get(game_type)
            if not game_name:
                raise ValueError(f"Unknown game type: {game_type}")
            
            # Set Start Date (From) - try multiple possible selectors
            self._set_date_dropdowns(
                driver, 
                start_date, 
                ['ddlStartMonth', 'ddlFromMonth', 'startMonth'],
                ['ddlStartDay', 'ddlFromDay', 'startDay'],
                ['ddlStartYear', 'ddlFromYear', 'startYear']
            )
            
            # Set End Date (To) - try multiple possible selectors
            self._set_date_dropdowns(
                driver,
                end_date,
                ['ddlEndMonth', 'ddlToMonth', 'endMonth'],
                ['ddlEndDay', 'ddlToDay', 'endDay'],
                ['ddlEndYear', 'ddlToYear', 'endYear']
            )
            
            # Select game from dropdown - try multiple possible selectors
            game_selected = False
            game_selectors = ['ddlGameType', 'ddlGame', 'gameType', 'ddlLottoGame']
            
            for selector in game_selectors:
                try:
                    game_dropdown = Select(driver.find_element(By.ID, selector))
                    game_dropdown.select_by_visible_text(game_name)
                    game_selected = True
                    logger.info(f"Selected game: {game_name}")
                    break
                except:
                    try:
                        game_dropdown = Select(driver.find_element(By.NAME, selector))
                        game_dropdown.select_by_visible_text(game_name)
                        game_selected = True
                        logger.info(f"Selected game: {game_name}")
                        break
                    except:
                        continue
            
            if not game_selected:
                logger.warning(f"Could not find game dropdown, trying to search for all games")
            
            # Click Search button - try multiple possible selectors
            search_clicked = False
            search_selectors = ['btnSearch', 'btnSearchLotto', 'searchButton', 'btnSubmit']
            
            for selector in search_selectors:
                try:
                    search_button = driver.find_element(By.ID, selector)
                    search_button.click()
                    search_clicked = True
                    logger.info("Search button clicked")
                    break
                except:
                    try:
                        search_button = driver.find_element(By.NAME, selector)
                        search_button.click()
                        search_clicked = True
                        logger.info("Search button clicked")
                        break
                    except:
                        try:
                            # Try by button text
                            search_button = driver.find_element(By.XPATH, f"//input[@type='submit' and contains(@value, 'Search')]")
                            search_button.click()
                            search_clicked = True
                            logger.info("Search button clicked")
                            break
                        except:
                            continue
            
            if not search_clicked:
                raise Exception("Could not find or click search button")
            
            # Wait for results table to load
            WebDriverWait(driver, self.timeout).until(
                EC.presence_of_element_located((By.TAG_NAME, "table"))
            )
            
            # Additional wait for table content
            time.sleep(3)
            
            # Parse results with BeautifulSoup
            soup = BeautifulSoup(driver.page_source, 'html.parser')
            results = self._parse_results(soup, game_type)
            
            return results
            
        except Exception as e:
            logger.error(f"Error in _scrape_with_driver for {game_type}: {str(e)}")
            raise
    
    def _set_date_dropdowns(self, driver, date_obj, month_selectors, day_selectors, year_selectors):
        """Helper method to set date dropdowns."""
        month_set = False
        day_set = False
        year_set = False
        
        # Set month
        for selector in month_selectors:
            try:
                month_dropdown = Select(driver.find_element(By.ID, selector))
                month_dropdown.select_by_value(str(date_obj.month))
                month_set = True
                break
            except:
                try:
                    month_dropdown = Select(driver.find_element(By.NAME, selector))
                    month_dropdown.select_by_value(str(date_obj.month))
                    month_set = True
                    break
                except:
                    continue
        
        # Set day
        for selector in day_selectors:
            try:
                day_dropdown = Select(driver.find_element(By.ID, selector))
                day_dropdown.select_by_value(str(date_obj.day))
                day_set = True
                break
            except:
                try:
                    day_dropdown = Select(driver.find_element(By.NAME, selector))
                    day_dropdown.select_by_value(str(date_obj.day))
                    day_set = True
                    break
                except:
                    continue
        
        # Set year
        for selector in year_selectors:
            try:
                year_dropdown = Select(driver.find_element(By.ID, selector))
                year_dropdown.select_by_value(str(date_obj.year))
                year_set = True
                break
            except:
                try:
                    year_dropdown = Select(driver.find_element(By.NAME, selector))
                    year_dropdown.select_by_value(str(date_obj.year))
                    year_set = True
                    break
                except:
                    continue
        
        if not (month_set and day_set and year_set):
            logger.warning(f"Could not set all date dropdowns for {date_obj}")
    
    def _parse_results(self, soup, game_type):
        """
        Parse results from the results table.
        Based on PCSO website structure with columns: LOTTO GAME, COMBINATIONS, DRAW DATE, JACKPOT (PHP), WINNERS
        """
        results = []
        
        # Find the results table - try multiple possible selectors
        results_table = None
        table_selectors = [
            ('id', 'gvResults'),
            ('id', 'resultsTable'),
            ('class', 'results-table'),
            ('class', 'lotto-results'),
        ]
        
        for attr, value in table_selectors:
            if attr == 'id':
                results_table = soup.find('table', id=value)
            elif attr == 'class':
                results_table = soup.find('table', class_=value)
            
            if results_table:
                break
        
        # If no specific table found, try to find any table with results
        if not results_table:
            tables = soup.find_all('table')
            for table in tables:
                # Check if table has result-like structure (multiple rows with td elements)
                rows = table.find_all('tr')
                if len(rows) > 1:  # Has header + data rows
                    first_data_row = rows[1] if len(rows) > 1 else None
                    if first_data_row:
                        cells = first_data_row.find_all('td')
                        if len(cells) >= 3:  # Has multiple columns
                            results_table = table
                            break
        
        if not results_table:
            logger.warning("Could not find results table")
            return results
        
        # Find all rows (skip header row)
        rows = results_table.find_all('tr')
        
        # Skip header row(s) - usually first row
        data_rows = rows[1:] if len(rows) > 1 else []
        
        for row in data_rows:
            try:
                cells = row.find_all('td')
                
                # Need at least 3 columns: Game, Combinations, Date, (Jackpot, Winners optional)
                if len(cells) < 3:
                    continue
                
                # Extract data from cells
                # Column order: LOTTO GAME, COMBINATIONS, DRAW DATE, JACKPOT (PHP), WINNERS
                lotto_game = cells[0].get_text(strip=True)
                combinations = cells[1].get_text(strip=True)
                draw_date_str = cells[2].get_text(strip=True)
                
                # Filter by game type if needed (in case "All Games" was selected)
                game_name_map = {
                    'ultra_lotto_6_58': 'Ultra Lotto 6/58',
                    'grand_lotto_6_55': 'Grand Lotto 6/55',
                    'super_lotto_6_49': 'Super Lotto 6/49',
                    'mega_lotto_6_45': 'Mega Lotto 6/45',
                    'lotto_6_42': 'Lotto 6/42'
                }
                
                expected_game = game_name_map.get(game_type, '')
                if expected_game and expected_game.lower() not in lotto_game.lower():
                    continue  # Skip rows that don't match the selected game
                
                # Parse draw date (format: MM/DD/YYYY)
                try:
                    draw_date = datetime.strptime(draw_date_str, '%m/%d/%Y').date()
                except ValueError:
                    try:
                        draw_date = datetime.strptime(draw_date_str, '%Y-%m-%d').date()
                    except ValueError:
                        logger.warning(f"Could not parse date: {draw_date_str}")
                        continue
                
                # Parse winning numbers from combinations (format: "41-16-45-20-52-01")
                numbers = []
                try:
                    number_parts = combinations.split('-')
                    for part in number_parts:
                        num_text = part.strip()
                        # Handle leading zeros (e.g., "01" -> 1)
                        num = int(num_text)
                        numbers.append(num)
                except ValueError:
                    logger.warning(f"Could not parse numbers from: {combinations}")
                    continue
                
                if len(numbers) != 6:
                    continue
                
                # Extract jackpot (if available) - usually 4th column
                jackpot = None
                if len(cells) >= 4:
                    jackpot_str = cells[3].get_text(strip=True)
                    if jackpot_str:
                        # Remove commas, currency symbols, and spaces
                        jackpot_clean = jackpot_str.replace(',', '').replace('PHP', '').replace('₱', '').replace(' ', '').strip()
                        try:
                            jackpot = float(jackpot_clean)
                        except ValueError:
                            pass
                
                # Extract winners (if available) - usually 5th column
                winners = None
                if len(cells) >= 5:
                    winners_str = cells[4].get_text(strip=True)
                    if winners_str:
                        try:
                            winners = int(winners_str)
                        except ValueError:
                            pass
                
                # Generate draw number from date
                draw_number = draw_date_str.replace('/', '')
                
                results.append({
                    'draw_date': draw_date,
                    'draw_number': draw_number,
                    'number_1': numbers[0],
                    'number_2': numbers[1],
                    'number_3': numbers[2],
                    'number_4': numbers[3],
                    'number_5': numbers[4],
                    'number_6': numbers[5],
                    'jackpot': jackpot,
                    'winners': winners
                })
                
            except Exception as e:
                logger.error(f"Error parsing row: {e}")
                continue
        
        return results
    
    def scrape_all_games(self, start_date=None, end_date=None):
        """
        Scrape results for all games and store in InstantDB.
        
        Args:
            start_date: Optional start date (defaults to 30 days ago)
            end_date: Optional end date (defaults to today)
            
        Returns:
            Dictionary with scraping statistics
        """
        # Set default dates if not provided
        if not start_date:
            start_date = datetime.now() - timedelta(days=30)
        if not end_date:
            end_date = datetime.now()
        
        # Create a fresh driver for each scraping session
        # Don't reuse driver to avoid crashes
        stats = {
            'total_new': 0,
            'total_duplicates': 0,
            'games_updated': [],
            'errors': []
        }
        
        game_types = ['ultra_lotto_6_58', 'grand_lotto_6_55', 'super_lotto_6_49', 
                     'mega_lotto_6_45', 'lotto_6_42']
        
        for game_type in game_types:
            try:
                logger.info(f"Scraping {game_type}...")
                
                # Each game gets its own driver instance to prevent crashes
                results = self.scrape_game_results(
                    game_type, 
                    driver=None,  # Force new driver for each game
                    start_date=start_date,
                    end_date=end_date
                )
                
                logger.info(f"Found {len(results)} results for {game_type}")
                
                new_count, dup_count = self._store_results(game_type, results)
                
                stats['total_new'] += new_count
                stats['total_duplicates'] += dup_count
                stats['games_updated'].append({
                    'game': game_type,
                    'new_records': new_count,
                    'duplicates': dup_count
                })
                
                # Delay between games to avoid overwhelming the server and let resources clean up
                time.sleep(5)
                
            except Exception as e:
                error_msg = f"Error scraping {game_type}: {str(e)}"
                logger.error(error_msg)
                logger.error(traceback.format_exc())
                stats['errors'].append(error_msg)
        
        return stats
    
    def _store_results(self, game_type: str, results: list):
        """
        Store results in InstantDB, checking for duplicates.
        
        Args:
            game_type: Game type identifier
            results: List of result dictionaries
            
        Returns:
            Tuple of (new_count, duplicate_count)
        """
        new_count = 0
        duplicate_count = 0
        
        # Get existing results to check for duplicates
        existing_results = instantdb.get_results(game_type, limit=10000, offset=0)
        existing_keys = set()
        for existing in existing_results:
            draw_date = existing.get('draw_date')
            draw_number = existing.get('draw_number')
            if draw_date and draw_number:
                existing_keys.add((str(draw_date), str(draw_number)))
        
        for result_data in results:
            try:
                # Check for duplicate
                draw_date = result_data.get('draw_date')
                draw_number = result_data.get('draw_number')
                
                if draw_date and draw_number:
                    # Convert to string for comparison
                    if isinstance(draw_date, datetime):
                        draw_date = draw_date.isoformat()
                    elif isinstance(draw_date, date):
                        draw_date = draw_date.isoformat()
                    
                    key = (str(draw_date), str(draw_number))
                    if key in existing_keys:
                        duplicate_count += 1
                        continue
                
                # Format draw_date for InstantDB
                if isinstance(draw_date, datetime):
                    draw_date_str = draw_date.isoformat()
                elif isinstance(draw_date, date):
                    draw_date_str = draw_date.isoformat()
                else:
                    draw_date_str = str(draw_date)
                
                # Create new record in InstantDB
                instantdb.create_result(game_type, {
                    'draw_date': draw_date_str,
                    'draw_number': result_data.get('draw_number'),
                    'number_1': result_data.get('number_1'),
                    'number_2': result_data.get('number_2'),
                    'number_3': result_data.get('number_3'),
                    'number_4': result_data.get('number_4'),
                    'number_5': result_data.get('number_5'),
                    'number_6': result_data.get('number_6'),
                    'jackpot': result_data.get('jackpot'),
                    'winners': result_data.get('winners'),
                    'created_at': datetime.now().isoformat()
                })
                
                new_count += 1
                existing_keys.add(key)  # Add to set to avoid duplicates in same batch
                
            except Exception as e:
                logger.error(f"Error storing result: {e}")
                continue
        
        return new_count, duplicate_count

