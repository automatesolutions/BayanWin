"""Test script to diagnose Bright Data Browser API connection issues."""
import os
import sys
from dotenv import load_dotenv

# Fix encoding for Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

load_dotenv()

def test_browser_api():
    """Test Bright Data Browser API connection."""
    browser_api_url = os.getenv('BRIGHT_DATA_BROWSER_API')
    
    if not browser_api_url:
        print("[ERROR] BRIGHT_DATA_BROWSER_API not found in .env")
        return
    
    print(f"[OK] Found Browser API URL: {browser_api_url[:60]}...")
    print(f"[INFO] Testing connection (this may take 30 seconds)...")
    
    try:
        from playwright.sync_api import sync_playwright
        import threading
        import time
        
        connection_result = {'browser': None, 'error': None, 'done': False}
        
        def connect():
            try:
                with sync_playwright() as p:
                    print(f"[INFO] Attempting to connect via connect_over_cdp...")
                    browser = p.chromium.connect_over_cdp(browser_api_url)
                    connection_result['browser'] = browser
                    connection_result['done'] = True
                    print(f"[SUCCESS] Connected!")
            except Exception as e:
                connection_result['error'] = e
                connection_result['done'] = True
                print(f"[ERROR] Connection failed: {e}")
        
        # Try connection with timeout
        conn_thread = threading.Thread(target=connect, daemon=True)
        conn_thread.start()
        conn_thread.join(timeout=30)
        
        if not connection_result['done']:
            print(f"[ERROR] Connection timed out after 30 seconds")
            print(f"[INFO] Possible issues:")
            print(f"       1. Browser API not activated in Bright Data dashboard")
            print(f"       2. WebSocket endpoint incorrect")
            print(f"       3. Network/firewall blocking WebSocket connection")
            print(f"       4. Credentials incorrect")
        elif connection_result['error']:
            print(f"[ERROR] Connection failed: {connection_result['error']}")
            print(f"[INFO] Error type: {type(connection_result['error']).__name__}")
        elif connection_result['browser']:
            print(f"[SUCCESS] Browser API connection successful!")
            print(f"[INFO] You can now use Browser API in your scraper")
            connection_result['browser'].close()
        else:
            print(f"[WARNING] Unknown connection state")
            
    except ImportError:
        print(f"[ERROR] Playwright not installed. Run: pip install playwright")
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_browser_api()

