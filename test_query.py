#!/usr/bin/env python3
import requests

print("Testing if predictions can be queried...")
try:
    response = requests.get("http://localhost:5000/api/predictions/ultra_lotto_6_58?limit=5")
    data = response.json()
    predictions = data.get('predictions', [])
    
    print(f"Found {len(predictions)} predictions")
    if predictions:
        print("\nFirst prediction:")
        p = predictions[0]
        print(f"  ID: {p['id']}")
        print(f"  Model: {p['model_type']}")
        print(f"  Target Date: {p['target_draw_date']}")
        print(f"  Numbers: {p['numbers']}")
    else:
        print("ERROR: No predictions returned!")
        
except Exception as e:
    print(f"Error: {e}")

