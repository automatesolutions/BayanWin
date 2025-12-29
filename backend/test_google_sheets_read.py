"""Test script to verify Google Sheets reading is working."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import pandas as pd
from config import Config
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_read_google_sheet(sheet_id: str, game_name: str):
    """Test reading a Google Sheet."""
    print("=" * 70)
    print(f"Testing Google Sheet Read: {game_name}")
    print(f"Sheet ID: {sheet_id}")
    print("=" * 70)
    
    try:
        # Test 1: Read the sheet
        print("\n[TEST 1] Reading Google Sheet using pandas...")
        sheet_name = "Sheet1"
        url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv&sheet={sheet_name}"
        
        print(f"URL: {url}")
        df = pd.read_csv(url)
        
        print(f"[OK] SUCCESS! Read {len(df)} rows")
        print(f"Columns: {list(df.columns)}")
        
        # Test 2: Show first few rows
        print("\n[TEST 2] First 5 rows of raw data:")
        print(df.head(5).to_string())
        
        # Test 3: Check for required columns
        print("\n[TEST 3] Checking for required columns...")
        required_keywords = {
            'combinations': ['COMBINATION', 'NUMBER'],
            'date': ['DATE', 'DRAW'],
            'jackpot': ['JACKPOT', 'PRIZE'],
            'winners': ['WINNER']
        }
        
        found_columns = {}
        for col in df.columns:
            col_upper = str(col).upper()
            for key, keywords in required_keywords.items():
                if any(kw in col_upper for kw in keywords):
                    if key not in found_columns:
                        found_columns[key] = col
                        print(f"  [OK] Found {key} column: '{col}'")
        
        # Test 4: Show sample data from each column
        print("\n[TEST 4] Sample data from each column:")
        for col in df.columns:
            sample_values = df[col].dropna().head(3).tolist()
            print(f"  {col}: {sample_values}")
        
        # Test 5: Try to parse a few rows manually
        print("\n[TEST 5] Testing data parsing...")
        if 'combinations' in found_columns and 'date' in found_columns:
            combo_col = found_columns['combinations']
            date_col = found_columns['date']
            
            for idx in range(min(3, len(df))):
                row = df.iloc[idx]
                combo_str = str(row[combo_col]) if pd.notna(row[combo_col]) else ''
                date_str = str(row[date_col]) if pd.notna(row[date_col]) else ''
                
                print(f"\n  Row {idx + 1}:")
                print(f"    Combinations: '{combo_str}'")
                print(f"    Date: '{date_str}'")
                
                # Try parsing
                if combo_str and '-' in combo_str:
                    try:
                        numbers = [int(n.strip()) for n in combo_str.split('-')]
                        print(f"    [OK] Parsed numbers: {numbers}")
                    except Exception as e:
                        print(f"    [ERROR] Failed to parse: {e}")
                else:
                    print(f"    [WARNING] No valid combination format")
        
        print("\n" + "=" * 70)
        print("[OK] ALL TESTS COMPLETED")
        print("=" * 70)
        return True
        
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    # Test with Ultra Lotto 6/58
    sheet_id = Config.GOOGLE_SHEETS['ultra_lotto_6_58']
    success = test_read_google_sheet(sheet_id, "Ultra Lotto 6/58")
    
    if success:
        print("\n[OK] Google Sheets reading is working!")
    else:
        print("\n[ERROR] Google Sheets reading failed!")
    
    sys.exit(0 if success else 1)

