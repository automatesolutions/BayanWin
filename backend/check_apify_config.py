"""Quick verification script to check Apify configuration."""
import os
from dotenv import load_dotenv

load_dotenv()

print("=" * 50)
print("Apify Configuration Check")
print("=" * 50)

token = os.getenv('APIFY_API_TOKEN')
actor_id = os.getenv('APIFY_ACTOR_ID', 'j0fes6RFpV1MFHUxh')

print(f"APIFY_API_TOKEN: {'[OK] Set' if token else '[ERROR] NOT SET'}")
if token:
    print(f"  Token starts with: {token[:20]}...")

print(f"APIFY_ACTOR_ID: {actor_id}")
print(f"  Status: {'[OK] Using your actor ID' if actor_id == 'j0fes6RFpV1MFHUxh' else '[WARNING] Using default'}")

print("\n" + "=" * 50)
print("Next Steps:")
print("1. Make sure the server is STOPPED (Ctrl+C)")
print("2. Restart with: uvicorn app:app --host 0.0.0.0 --port 5000 --reload")
print("3. The new code should use Apify SDK, not requests")
print("=" * 50)

