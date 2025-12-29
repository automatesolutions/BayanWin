"""Direct test of InstantDB API to see what's happening."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.instantdb_client import instantdb
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Test data
test_result = {
    'game_type': 'ultra_lotto_6_58',
    'draw_date': '2025-01-01T00:00:00',
    'number_1': 1,
    'number_2': 2,
    'number_3': 3,
    'number_4': 4,
    'number_5': 5,
    'number_6': 6,
    'jackpot': 1000000.0,
    'winners': 0,
    'draw_number': None
}

print("=" * 60)
print("Testing InstantDB Direct Save")
print("=" * 60)

try:
    print(f"\n1. Testing create_result...")
    print(f"   Game type: {test_result['game_type']}")
    print(f"   Draw date: {test_result['draw_date']}")
    
    response = instantdb.create_result(test_result['game_type'], test_result)
    print(f"✅ Success! Response: {response}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    
    # Check if it's an API issue
    print(f"\n2. Checking InstantDB configuration...")
    print(f"   App ID: {instantdb.app_id}")
    print(f"   Base URL: {instantdb.base_url}")
    print(f"   Headers: {instantdb.headers}")
    
    # Try to get existing results
    try:
        print(f"\n3. Testing get_results...")
        existing = instantdb.get_results(test_result['game_type'], limit=5)
        print(f"✅ Found {len(existing)} existing results")
    except Exception as e2:
        print(f"❌ Error getting results: {e2}")

