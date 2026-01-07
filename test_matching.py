#!/usr/bin/env python3
from datetime import datetime, timedelta

def parse_date_str(s):
    if not s:
        return None
    d = s.split('T')[0] if 'T' in s else s[:10]
    try:
        return datetime.strptime(d, '%Y-%m-%d').date()
    except:
        return None

# Test dates from actual data
prediction_dates = [
    "2026-01-07",
    "2026-01-05",
    "2026-01-04",
    "2026-01-03"
]

result_dates = [
    "2026-01-06T00:00:00",
    "2026-01-04T00:00:00",
    "2026-01-02T00:00:00"
]

print("Testing date matching logic:\n")
print("="*60)

for result_date_str in result_dates:
    result_date_obj = parse_date_str(result_date_str)
    print(f"\nResult: {result_date_str} -> {result_date_obj}")
    print("  Matching predictions:")
    
    matches = 0
    for pred_date_str in prediction_dates:
        pred_date_obj = parse_date_str(pred_date_str)
        
        # Exact match
        if pred_date_obj == result_date_obj:
            print(f"    EXACT: {pred_date_str}")
            matches += 1
        # Future match (prediction made before)
        elif pred_date_obj < result_date_obj and (result_date_obj - pred_date_obj) <= timedelta(days=7):
            days_before = (result_date_obj - pred_date_obj).days
            print(f"    FUTURE: {pred_date_str} ({days_before} days before)")
            matches += 1
    
    if matches == 0:
        print("    NO MATCHES!")
    else:
        print(f"  Total matches: {matches}")

print("\n" + "="*60)

