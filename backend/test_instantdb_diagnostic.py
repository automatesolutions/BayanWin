"""Diagnostic test for InstantDB API to understand the actual response format."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import requests
from config import Config
import json

def test_instantdb_api():
    """Test InstantDB API with detailed diagnostics."""
    print("=" * 70)
    print("InstantDB API Diagnostic Test")
    print("=" * 70)
    
    app_id = Config.INSTANTDB_APP_ID
    admin_token = Config.INSTANTDB_ADMIN_TOKEN
    base_url = f"https://api.instantdb.com/v1/apps/{app_id}"
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {admin_token}'
    }
    
    print(f"\n[CONFIG]")
    print(f"  App ID: {app_id}")
    print(f"  Base URL: {base_url}")
    print(f"  Has Token: {bool(admin_token)}")
    
    # Test 1: Try to get schema info
    print(f"\n[TEST 1] Getting app info/schema...")
    try:
        response = requests.get(f"{base_url}", headers=headers, timeout=10)
        print(f"  Status: {response.status_code}")
        print(f"  Response: {response.text[:500]}")
    except Exception as e:
        print(f"  Error: {e}")
    
    # Test 2: Try to list entities
    print(f"\n[TEST 2] Listing entities...")
    try:
        response = requests.get(f"{base_url}/entities", headers=headers, timeout=10)
        print(f"  Status: {response.status_code}")
        print(f"  Response: {response.text[:500]}")
    except Exception as e:
        print(f"  Error: {e}")
    
    # Test 3: Try to create entity with transaction endpoint
    print(f"\n[TEST 3] Trying transaction endpoint...")
    test_data = {
        'ultra_lotto_6_58_results': {
            'id()': {
                'draw_date': '2025-01-01T00:00:00',
                'number_1': 1,
                'number_2': 2,
                'number_3': 3,
                'number_4': 4,
                'number_5': 5,
                'number_6': 6,
                'jackpot': 1000000.0,
                'winners': 0
            }
        }
    }
    try:
        response = requests.post(
            f"{base_url}/transact",
            headers=headers,
            json=test_data,
            timeout=10
        )
        print(f"  Status: {response.status_code}")
        print(f"  Response: {response.text[:500]}")
    except Exception as e:
        print(f"  Error: {e}")
    
    # Test 4: Try current endpoint format
    print(f"\n[TEST 4] Trying current endpoint format...")
    test_data = {
        'draw_date': '2025-01-01T00:00:00',
        'number_1': 1,
        'number_2': 2,
        'number_3': 3,
        'number_4': 4,
        'number_5': 5,
        'number_6': 6,
        'jackpot': 1000000.0,
        'winners': 0
    }
    try:
        response = requests.post(
            f"{base_url}/entities/ultra_lotto_6_58_results",
            headers=headers,
            json=test_data,
            timeout=10
        )
        print(f"  Status: {response.status_code}")
        print(f"  Headers: {dict(response.headers)}")
        print(f"  Response length: {len(response.content)}")
        print(f"  Response text: {response.text[:500]}")
        if response.content:
            try:
                print(f"  Response JSON: {json.dumps(response.json(), indent=2)}")
            except:
                print(f"  Response is not JSON")
    except Exception as e:
        print(f"  Error: {e}")
        import traceback
        traceback.print_exc()
    
    # Test 5: Try query endpoint
    print(f"\n[TEST 5] Querying existing data...")
    try:
        response = requests.get(
            f"{base_url}/entities/ultra_lotto_6_58_results",
            headers=headers,
            params={'limit': 5},
            timeout=10
        )
        print(f"  Status: {response.status_code}")
        print(f"  Response: {response.text[:500]}")
        if response.content:
            try:
                data = response.json()
                print(f"  Response JSON: {json.dumps(data, indent=2)}")
            except:
                pass
    except Exception as e:
        print(f"  Error: {e}")

if __name__ == "__main__":
    test_instantdb_api()

