#!/usr/bin/env python3
"""
Quick script to check what dates are in predictions vs results
"""
import requests
import json

BASE_URL = "http://localhost:5000"
GAME_TYPE = "ultra_lotto_6_58"

print("\n" + "="*80)
print("CHECKING PREDICTION vs RESULT DATES")
print("="*80)

try:
    response = requests.get(f"{BASE_URL}/api/accuracy/diagnostics/{GAME_TYPE}")
    data = response.json()
    
    print(f"\nCounts:")
    print(f"   Predictions: {data['total_predictions']}")
    print(f"   Results: {data['total_results']}")
    print(f"   Accuracy Records: {data['total_accuracy_records']}")
    
    if data.get('prediction_date_range'):
        print(f"\nPrediction Date Range:")
        print(f"   Earliest: {data['prediction_date_range']['earliest']}")
        print(f"   Latest: {data['prediction_date_range']['latest']}")
    
    if data.get('result_date_range'):
        print(f"\nResult Date Range:")
        print(f"   Earliest: {data['result_date_range']['earliest']}")
        print(f"   Latest: {data['result_date_range']['latest']}")
    
    print(f"\nSample Prediction Dates (first 10):")
    for date in data.get('sample_prediction_dates', [])[:10]:
        print(f"   - {date}")
    
    print(f"\nSample Result Dates (first 10):")
    for date in data.get('sample_result_dates', [])[:10]:
        print(f"   - {date}")
    
    overlapping = data.get('overlapping_dates', [])
    print(f"\nOverlapping Dates: {len(overlapping)}")
    if overlapping:
        print(f"   Found matching dates:")
        for date in overlapping[:10]:
            print(f"   OK {date}")
    else:
        print(f"   NO OVERLAPPING DATES!")
    
    print(f"\nDiagnosis:")
    print(f"   {data.get('diagnosis', 'Unknown issue')}")
    
    print("\n" + "="*80)
    
except Exception as e:
    print(f"\nError: {e}")
    print("\nMake sure:")
    print("1. Backend is running on http://localhost:5000")
    print("2. You've deployed the updated schema")
    print("3. Run: cd lof-v2-db && npm run dev")

print()

