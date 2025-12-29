"""Test the full scraper flow: Google Sheets -> Parse -> InstantDB."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import asyncio
from scrapers.google_sheets_scraper import GoogleSheetsScraper
from services.instantdb_client import instantdb
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def test_full_flow():
    """Test the complete scraping flow."""
    print("=" * 70)
    print("Testing Full Scraper Flow")
    print("=" * 70)
    
    scraper = GoogleSheetsScraper()
    game_type = 'ultra_lotto_6_58'
    
    print(f"\n[STEP 1] Scraping {game_type}...")
    try:
        # Test scraping one game
        stats = await scraper.scrape_game(game_type)
        
        print(f"\n[RESULTS]")
        print(f"  Total in sheet: {stats.get('total_in_sheet', 0)}")
        print(f"  Existing in DB: {stats.get('existing_in_db', 0)}")
        print(f"  New results: {stats.get('new_results', 0)}")
        print(f"  Added: {stats.get('added', 0)}")
        print(f"  Errors: {len(stats.get('errors', []))}")
        
        if stats.get('errors'):
            print(f"\n[ERRORS]")
            for error in stats.get('errors', [])[:5]:  # Show first 5 errors
                print(f"  - {error}")
        
        # Verify data was saved
        print(f"\n[STEP 2] Verifying data in InstantDB...")
        existing = instantdb.get_results(game_type, limit=10)
        print(f"  Found {len(existing)} results in InstantDB")
        
        if len(existing) > 0:
            print(f"\n[SUCCESS] Data is being saved!")
            print(f"  Sample record: {existing[0]}")
            return True
        else:
            print(f"\n[WARNING] No data found in InstantDB")
            print(f"  This might mean:")
            print(f"    1. Data wasn't saved (API issue)")
            print(f"    2. Query format is wrong")
            print(f"    3. Data needs time to propagate")
            return False
            
    except Exception as e:
        print(f"\n[ERROR] Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_full_flow())
    sys.exit(0 if success else 1)

