#!/usr/bin/env python3
"""Test DRL learning with the improved error-distance-focused algorithm."""
import sys
import os

# Add backend to path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

from services.instantdb_client import instantdb
from ml_models.drl_agent import DRLAgent

# Get accuracy records
accuracy_records = instantdb.get_prediction_accuracy('ultra_lotto_6_58')
print(f"\n📊 Found {len(accuracy_records)} accuracy records")

# Filter for DRL predictions
predictions = instantdb.get_predictions('ultra_lotto_6_58', limit=1000)
drl_predictions = {p['id']: p for p in predictions if p.get('model_type') == 'DRL'}
drl_accuracy = [acc for acc in accuracy_records if acc.get('prediction_id') in drl_predictions]

print(f"📊 Found {len(drl_accuracy)} DRL accuracy records")

if len(drl_accuracy) >= 5:
    print("\n🚀 Testing IMPROVED DRL learning...")
    drl_agent = DRLAgent()
    
    try:
        drl_agent.learn_from_accuracy_records('ultra_lotto_6_58', drl_accuracy, instantdb)
        print("\n✅ DRL learning completed successfully!")
        print("✅ The improved algorithm:")
        print("   - Uses error_distance directly from accuracy records")
        print("   - Prioritizes low-error predictions for training")
        print("   - Adds error awareness to state representation")
        print("   - Uses gradient-descent-style reward function")
        print("\n📈 DRL should now make better predictions with lower error distance!")
    except Exception as e:
        print(f"\n❌ Error during DRL learning: {e}")
        import traceback
        traceback.print_exc()
else:
    print(f"\n⚠️ Need at least 5 DRL accuracy records, found {len(drl_accuracy)}")

