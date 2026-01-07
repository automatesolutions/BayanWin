#!/usr/bin/env python3
import requests
import json

print("Triggering accuracy calculation...")
try:
    response = requests.post(
        "http://localhost:5000/api/accuracy/auto-calculate",
        json={"game_type": "ultra_lotto_6_58"},
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Response: {json.dumps(data, indent=2)}")
    
    if data.get('success'):
        print(f"\nSUCCESS! Calculated {data.get('total_calculated')} accuracy records")
    else:
        print(f"\nFAILED: {data.get('message')}")
        
except Exception as e:
    print(f"Error: {e}")

