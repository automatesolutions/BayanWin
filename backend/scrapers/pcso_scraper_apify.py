"""PCSO website scraper using Apify cloud service."""
from datetime import datetime, timedelta, date
from services.instantdb_client import instantdb
from config import Config
from apify_client import ApifyClient
import traceback
import logging
import os
import asyncio

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PCSOScraperApify:
    """Scraper for PCSO lottery results using Apify cloud service."""
    
    def __init__(self):
        self.base_url = Config.PCSO_URL
        self.apify_token = os.getenv('APIFY_API_TOKEN')
        self.apify_actor_id = os.getenv('APIFY_ACTOR_ID', 'j0fes6RFpV1MFHUxh')
        if not self.apify_token:
            logger.warning("APIFY_API_TOKEN not set. Please add it to your .env file.")
        self.client = ApifyClient(self.apify_token) if self.apify_token else None
        self.max_retries = 3
        
    async def scrape_game_results(self, game_type, start_date=None, end_date=None):
        """
        Scrape results for a specific game with date range selection using Apify.
        
        Args:
            game_type: Game type identifier (e.g., 'ultra_lotto_6_58')
            start_date: Start date (datetime object, defaults to 30 days ago)
            end_date: End date (datetime object, defaults to today)
            
        Returns:
            List of result dictionaries
        """
        # Set default dates if not provided
        if not start_date:
            start_date = datetime.now() - timedelta(days=30)
        if not end_date:
            end_date = datetime.now()
        
        logger.info(f"Scraping {game_type} using Apify cloud service")
        
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
        
        try:
            # Use Apify's Web Scraper actor
            results = await self._scrape_with_apify(game_type, game_name, start_date, end_date)
            logger.info(f"Successfully scraped {len(results)} results for {game_type}")
            return results
        except Exception as e:
            logger.error(f"Error scraping {game_type}: {str(e)}")
            logger.error(traceback.format_exc())
            raise
    
    async def _scrape_with_apify(self, game_type, game_name, start_date, end_date):
        """
        Scrape using Apify actor with your custom actor ID.
        """
        
        if not self.client:
            logger.error("Cannot scrape: APIFY_API_TOKEN not configured")
            raise ValueError("APIFY_API_TOKEN not set in environment variables")
        
        # Prepare input for the actor
        # Adjust these based on what your actor expects
        apify_input = {
            "startUrls": [{"url": self.base_url}],
            "gameName": game_name,
            "startDate": {
                "month": start_date.month,
                "day": start_date.day,
                "year": start_date.year
            },
            "endDate": {
                "month": end_date.month,
                "day": end_date.day,
                "year": end_date.year
            }
        }
        
        # Start Apify actor run using SDK
        logger.info(f"Starting Apify actor {self.apify_actor_id} for {game_type}")
        
        try:
            # Run the actor
            run = self.client.actor(self.apify_actor_id).call(run_input=apify_input)
            run_id = run['data']['id']
            logger.info(f"Apify run started: {run_id}")
            
            # Wait for completion and get results
            results = await self._wait_for_apify_results_sdk(run_id)
            
            # Parse the extracted data
            parsed_results = self._parse_apify_results(results, game_type)
            
            return parsed_results
            
        except Exception as e:
            logger.error(f"Apify API error: {str(e)}")
            raise
    
    async def _wait_for_apify_results_sdk(self, run_id, timeout=300):
        """Wait for Apify run to complete and fetch results using SDK."""
        start_time = datetime.now()
        
        while (datetime.now() - start_time).seconds < timeout:
            # Check run status using SDK
            run = self.client.run(run_id).get()
            run_status = run['data']['status']
            
            logger.info(f"Apify run status: {run_status}")
            
            if run_status == 'SUCCEEDED':
                # Fetch results using SDK
                dataset_items = list(self.client.dataset(run['data']['defaultDatasetId']).iterate_items())
                return dataset_items
            
            elif run_status in ['FAILED', 'ABORTED', 'TIMED-OUT']:
                raise Exception(f"Apify run {run_status}: {run.get('data', {}).get('statusMessage', 'No error message')}")
            
            # Wait before checking again
            await asyncio.sleep(5)
        
        raise Exception(f"Apify run timeout after {timeout} seconds")
    
    def _parse_apify_results(self, apify_data, game_type):
        """Parse Apify results into our format."""
        results = []
        
        for item in apify_data:
            try:
                # Extract combination
                combination = item.get('combination', '')
                if not combination:
                    continue
                
                # Parse numbers
                numbers = []
                for part in combination.split('-'):
                    numbers.append(int(part.strip()))
                
                if len(numbers) != 6:
                    continue
                
                # Parse draw date
                draw_date_str = item.get('drawDate', '')
                try:
                    draw_date = datetime.strptime(draw_date_str, '%m/%d/%Y').date()
                except:
                    continue
                
                # Parse jackpot
                jackpot = None
                jackpot_str = item.get('jackpot', '')
                if jackpot_str:
                    try:
                        jackpot = float(jackpot_str.replace(',', '').replace('PHP', '').replace('₱', '').strip())
                    except:
                        pass
                
                # Parse winners
                winners = None
                winners_str = item.get('winners', '')
                if winners_str:
                    try:
                        winners = int(winners_str)
                    except:
                        pass
                
                results.append({
                    'draw_date': draw_date,
                    'draw_number': draw_date_str.replace('/', ''),
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
                logger.error(f"Error parsing result: {e}")
                continue
        
        return results
    
    async def scrape_all_games(self, start_date=None, end_date=None):
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
                logger.info(f"Scraping {game_type} with Apify...")
                
                results = await self.scrape_game_results(
                    game_type, 
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
                existing_keys.add(key)
                
            except Exception as e:
                logger.error(f"Error storing result: {e}")
                continue
        
        return new_count, duplicate_count

