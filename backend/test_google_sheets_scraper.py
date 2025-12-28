"""Test script to verify Google Sheets scraper and InstantDB integration."""
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from scrapers.google_sheets_scraper import GoogleSheetsScraper
from services.instantdb_client import instantdb
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def test_scraper():
    """Test the Google Sheets scraper."""
    logger.info("=" * 60)
    logger.info("Testing Google Sheets Scraper")
    logger.info("=" * 60)
    
    scraper = GoogleSheetsScraper()
    
    # Test with one game first
    game_type = 'ultra_lotto_6_58'
    logger.info(f"\nTesting with game: {game_type}")
    
    try:
        # Test reading sheet
        sheet_id = scraper.sheet_ids[game_type]
        logger.info(f"Reading sheet ID: {sheet_id}")
        df = scraper._read_sheet(sheet_id)
        logger.info(f"✅ Successfully read {len(df)} rows")
        logger.info(f"Columns: {list(df.columns)}")
        logger.info(f"\nFirst 3 rows:")
        print(df.head(3).to_string())
        
        # Test parsing
        logger.info(f"\nParsing data...")
        results = scraper._parse_sheet_data(df, game_type)
        logger.info(f"✅ Parsed {len(results)} results")
        
        if len(results) > 0:
            logger.info(f"\nFirst parsed result:")
            import json
            print(json.dumps(results[0], indent=2))
            
            # Test saving to InstantDB (just one record)
            logger.info(f"\nTesting InstantDB save (first result only)...")
            test_result = results[0]
            
            # Check if it already exists
            existing = instantdb.get_results(game_type, limit=10)
            logger.info(f"Found {len(existing)} existing results in DB")
            
            # Try to save
            try:
                response = instantdb.create_result(game_type, test_result)
                logger.info(f"✅ Successfully saved to InstantDB!")
                logger.info(f"Response: {response}")
            except Exception as e:
                logger.error(f"❌ Failed to save to InstantDB: {e}")
                import traceback
                logger.error(traceback.format_exc())
        else:
            logger.error("❌ No results parsed! Check column mapping.")
            
    except Exception as e:
        logger.error(f"❌ Test failed: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False
    
    return True

if __name__ == "__main__":
    success = asyncio.run(test_scraper())
    sys.exit(0 if success else 1)

