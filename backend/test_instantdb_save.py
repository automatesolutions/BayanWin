"""Test script to verify InstantDB saving is working."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.instantdb_client import instantdb
from datetime import datetime
import logging

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_instantdb_save():
    """Test saving to InstantDB."""
    print("=" * 70)
    print("Testing InstantDB Save Operation")
    print("=" * 70)
    
    # Test data
    test_result = {
        'draw_date': '2025-01-01T00:00:00',
        'draw_number': None,
        'number_1': 1,
        'number_2': 2,
        'number_3': 3,
        'number_4': 4,
        'number_5': 5,
        'number_6': 6,
        'jackpot': 1000000.0,
        'winners': 0,
        'created_at': datetime.now().isoformat()
    }
    
    game_type = 'ultra_lotto_6_58'
    
    print(f"\n[TEST 1] Configuration Check:")
    print(f"  App ID: {instantdb.app_id}")
    print(f"  Base URL: {instantdb.base_url}")
    print(f"  Headers: {instantdb.headers}")
    
    print(f"\n[TEST 2] Test Data:")
    print(f"  Game Type: {game_type}")
    print(f"  Draw Date: {test_result['draw_date']}")
    print(f"  Numbers: {test_result['number_1']}-{test_result['number_2']}-{test_result['number_3']}-{test_result['number_4']}-{test_result['number_5']}-{test_result['number_6']}")
    
    print(f"\n[TEST 3] Attempting to save to InstantDB...")
    try:
        response = instantdb.create_result(game_type, test_result)
        print(f"  [OK] Response received: {response}")
        print(f"  [OK] Save operation completed!")
        
        # Try to retrieve it
        print(f"\n[TEST 4] Attempting to retrieve saved data...")
        existing = instantdb.get_results(game_type, limit=5)
        print(f"  [OK] Found {len(existing)} results in database")
        if existing:
            print(f"  Latest result: {existing[0]}")
        
        return True
        
    except Exception as e:
        print(f"  [ERROR] Failed to save: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_instantdb_save()
    
    if success:
        print("\n[OK] InstantDB saving is working!")
    else:
        print("\n[ERROR] InstantDB saving failed!")
        print("\nPossible issues:")
        print("  1. InstantDB schema not deployed - entities need to be defined in schema")
        print("  2. Invalid API endpoint format")
        print("  3. Authentication token issue")
        print("  4. Entity name format incorrect")
    
    sys.exit(0 if success else 1)

