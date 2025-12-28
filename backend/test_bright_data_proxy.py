"""Test script to verify Bright Data proxy is working correctly."""
import os
import sys
from playwright.sync_api import sync_playwright
from dotenv import load_dotenv

# Fix encoding for Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Load environment variables
load_dotenv()

def test_proxy():
    """Test if Bright Data proxy is working."""
    proxy_server = os.getenv('BRIGHT_DATA_PROXY')
    
    if not proxy_server:
        print("[ERROR] BRIGHT_DATA_PROXY not found in .env file")
        return
    
    print(f"[OK] Found proxy: {proxy_server[:50]}...")
    
    # Parse proxy
    proxy_url = proxy_server.replace('http://', '').replace('https://', '')
    auth_part, server_part = proxy_url.split('@')
    username, password = auth_part.split(':')
    host, port = server_part.split(':')
    
    proxy_config = {
        'server': f'http://{host}:{port}',
        'username': username,
        'password': password
    }
    
    print(f"[INFO] Connecting through Bright Data proxy: {host}:{port}")
    zone_name = username.split('-zone-')[1] if '-zone-' in username else 'unknown'
    print(f"       Zone: {zone_name}")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=['--disable-blink-features=AutomationControlled']
        )
        
        context = browser.new_context(
            proxy=proxy_config,
            ignore_https_errors=True
        )
        
        page = context.new_page()
        
        # Test 1: Check IP address
        print("\n[TEST 1] Checking IP address through proxy...")
        try:
            page.goto('https://api.ipify.org?format=json', timeout=30000)
            ip_response = page.content()
            print(f"        Response: {ip_response}")
            if 'ip' in ip_response.lower():
                print("        [OK] Proxy is working - got IP response")
            else:
                print("        [WARNING] Got response but couldn't parse IP")
        except Exception as e:
            print(f"        [ERROR] Failed to get IP: {e}")
        
        # Test 2: Try accessing PCSO website
        print("\n[TEST 2] Testing access to PCSO website...")
        try:
            page.goto('https://www.pcso.gov.ph/SearchLottoResult.aspx', 
                     wait_until='networkidle', timeout=60000)
            title = page.title()
            url = page.url
            
            print(f"        Title: {title}")
            print(f"        URL: {url}")
            
            if 'Access Denied' in title:
                print("        [ERROR] Still getting 'Access Denied' - website detecting Playwright")
                print("        [INFO] This means:")
                print("              - Proxy IS working (connection successful)")
                print("              - But website is detecting Playwright's browser fingerprint")
                print("              - Solution: Use Bright Data Scraping Browser or enhance stealth")
            elif 'Search Lotto' in title or 'SearchLottoResult' in url:
                print("        [SUCCESS] Website loaded correctly!")
            else:
                print(f"        [WARNING] Unexpected response: {title}")
                
        except Exception as e:
            print(f"        [ERROR] Failed to access PCSO: {e}")
        
        browser.close()
    
    print("\n" + "="*60)
    print("SUMMARY:")
    print("If you see 'Access Denied' even with Bright Data proxy:")
    print("1. The proxy IS working (connection successful)")
    print("2. But PCSO website is detecting Playwright's fingerprint")
    print("3. Options:")
    print("   a) Use Bright Data Scraping Browser (different service)")
    print("   b) Try without country restriction in proxy username")
    print("   c) Wait and try again (IP might be temporarily flagged)")
    print("="*60)

if __name__ == "__main__":
    test_proxy()

