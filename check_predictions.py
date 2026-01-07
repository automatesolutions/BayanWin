#!/usr/bin/env python3
"""
Quick diagnostic script to check predictions and results in the database.
Run this to see what data exists and why accuracy calculation might not be working.
"""
import os
os.environ['PYTHONIOENCODING'] = 'utf-8'

import requests
import json

# Configuration
BASE_URL = "http://localhost:5000"
GAME_TYPE = "ultra_lotto_6_58"

def check_diagnostics():
    """Check diagnostics endpoint"""
    print("\n" + "="*80)
    print(f"DIAGNOSTICS FOR {GAME_TYPE}")
    print("="*80)
    
    try:
        response = requests.get(f"{BASE_URL}/api/accuracy/diagnostics/{GAME_TYPE}")
        data = response.json()
        
        print(f"\n📊 Database Counts:")
        print(f"   Total Results: {data['total_results']}")
        print(f"   Total Predictions: {data['total_predictions']}")
        print(f"   Total Accuracy Records: {data['total_accuracy_records']}")
        
        print(f"\n📅 Sample Result Dates:")
        for date in data['sample_result_dates'][:5]:
            print(f"   - {date}")
        
        print(f"\n🎯 Sample Prediction Dates:")
        for date in data['sample_prediction_dates'][:5]:
            print(f"   - {date}")
        
        print(f"\n✅ Validity:")
        print(f"   Has valid results: {data['has_valid_results']}")
        print(f"   Has valid predictions: {data['has_valid_predictions']}")
        
        # Analysis
        print(f"\n💡 Analysis:")
        if data['total_predictions'] == 0:
            print("   ⚠️  NO PREDICTIONS FOUND!")
            print("   → You need to generate predictions first by clicking '⚡ Generate Predictions' in the UI")
        elif data['total_results'] == 0:
            print("   ⚠️  NO RESULTS FOUND!")
            print("   → You need to scrape results from Google Sheets first")
        elif data['total_accuracy_records'] == 0:
            print("   ⚠️  NO ACCURACY RECORDS!")
            print("   → Predictions and results exist but haven't been matched")
            print("   → Try clicking 'Calculate Now' button in Error Distance Analysis")
        else:
            print(f"   ✅ Everything looks good! {data['total_accuracy_records']} accuracy records found")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\n   Make sure:")
        print("   1. Backend server is running on port 5000")
        print("   2. You've selected the correct game type")

def check_predictions():
    """Get actual predictions"""
    print("\n" + "="*80)
    print("CHECKING ACTUAL PREDICTIONS")
    print("="*80)
    
    try:
        response = requests.get(f"{BASE_URL}/api/predictions/{GAME_TYPE}?limit=5")
        data = response.json()
        predictions = data.get('predictions', [])
        
        if len(predictions) == 0:
            print("\n⚠️  NO PREDICTIONS FOUND IN DATABASE!")
            print("\nPossible reasons:")
            print("1. Predictions were never generated")
            print("2. Predictions are in a different game type")
            print("3. Database connection issue")
            print("\nSolution:")
            print("→ Go to the frontend UI")
            print("→ Select 'Ultra Lotto 6/58' from the game selector")
            print("→ Click '⚡ Generate Predictions' button")
        else:
            print(f"\n✅ Found {len(predictions)} predictions:")
            for i, pred in enumerate(predictions[:5], 1):
                print(f"\n   Prediction #{i}:")
                print(f"   - ID: {pred['id']}")
                print(f"   - Model: {pred['model_type']}")
                print(f"   - Target Date: {pred['target_draw_date']}")
                print(f"   - Numbers: {pred['numbers']}")
                print(f"   - Created: {pred['created_at']}")
    except Exception as e:
        print(f"\n❌ Error: {e}")

def check_results():
    """Get actual results"""
    print("\n" + "="*80)
    print("CHECKING ACTUAL RESULTS")
    print("="*80)
    
    try:
        response = requests.get(f"{BASE_URL}/api/results/{GAME_TYPE}?limit=5")
        data = response.json()
        results = data.get('results', [])
        
        if len(results) == 0:
            print("\n⚠️  NO RESULTS FOUND IN DATABASE!")
            print("\nSolution:")
            print("→ The system auto-scrapes when you select a game")
            print("→ Or manually trigger scraping by selecting the game again")
        else:
            print(f"\n✅ Found {data['total']} total results (showing first 5):")
            for i, result in enumerate(results[:5], 1):
                print(f"\n   Result #{i}:")
                print(f"   - Draw Date: {result['draw_date']}")
                print(f"   - Draw Number: {result['draw_number']}")
                print(f"   - Numbers: {result['numbers']}")
                print(f"   - Winners: {result['winners']}")
    except Exception as e:
        print(f"\n❌ Error: {e}")

def main():
    print("\n🔍 DATABASE DIAGNOSTIC TOOL")
    print("Checking what's in your InstantDB database...\n")
    
    check_diagnostics()
    check_predictions()
    check_results()
    
    print("\n" + "="*80)
    print("DIAGNOSTIC COMPLETE")
    print("="*80 + "\n")

if __name__ == "__main__":
    main()

