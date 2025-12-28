"""PCSO website scraper using Playwright Sync API in thread executor (works with Python 3.13)."""
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
from bs4 import BeautifulSoup
from datetime import datetime, timedelta, date
from services.instantdb_client import instantdb
from config import Config
import asyncio
import concurrent.futures
import traceback
import logging
import time
import os
import random

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PCSOScraperPlaywright:
    """Scraper for PCSO lottery results using Playwright Sync API in thread executor."""
    
    def __init__(self):
        self.base_url = Config.PCSO_URL
        self.timeout = Config.SCRAPING_TIMEOUT * 1000  # Playwright uses milliseconds
        self.max_retries = 3
        self.executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)
        
        # Bright Data Browser API configuration (preferred - handles bot detection automatically)
        # Can be disabled by setting BRIGHT_DATA_USE_BROWSER_API=false
        self.use_browser_api = os.getenv('BRIGHT_DATA_USE_BROWSER_API', 'true').lower() == 'true'
        self.browser_api_url = os.getenv('BRIGHT_DATA_BROWSER_API') if self.use_browser_api else None
        
        # Bright Data proxy configuration (fallback)
        self.proxy_server = os.getenv('BRIGHT_DATA_PROXY')
        
        if self.browser_api_url and self.use_browser_api:
            logger.info("✅ Bright Data Browser API configured - will bypass bot detection automatically")
        elif self.proxy_server:
            logger.info("Bright Data proxy configured (using regular proxy)")
        else:
            logger.warning("No proxy/Browser API configured - may get blocked")
        
    async def scrape_game_results(self, game_type, start_date=None, end_date=None):
        """
        Scrape results for a specific game with date range selection.
        
        Args:
            game_type: Game type identifier (e.g., 'ultra_lotto_6_58')
            start_date: Start date (datetime object, defaults to January 2025)
            end_date: End date (datetime object, defaults to today)
            
        Returns:
            List of result dictionaries
        """
        # Retry logic for handling crashes
        for attempt in range(self.max_retries):
            try:
                # Set default dates if not provided
                if not start_date:
                    start_date = datetime(2025, 1, 1)  # January 2025 as requested
                if not end_date:
                    end_date = datetime.now()
                
                logger.info(f"Attempt {attempt + 1}/{self.max_retries}: Scraping {game_type} from {start_date.date()} to {end_date.date()}")
                
                # Run sync Playwright in thread executor to avoid asyncio subprocess issue
                loop = asyncio.get_event_loop()
                results = await loop.run_in_executor(
                    self.executor,
                    self._scrape_with_playwright_sync,
                    game_type,
                    start_date,
                    end_date
                )
                
                logger.info(f"Successfully scraped {len(results)} results for {game_type}")
                return results
                
            except Exception as e:
                logger.error(f"Attempt {attempt + 1}/{self.max_retries} failed for {game_type}: {str(e)}")
                logger.error(traceback.format_exc())
                
                if attempt < self.max_retries - 1:
                    logger.info(f"Retrying in 3 seconds...")
                    await asyncio.sleep(3)
                else:
                    logger.error(f"All {self.max_retries} attempts failed for {game_type}")
                    raise
        
        return []
    
    def _get_random_browser_profile(self):
        """Generate random browser fingerprint like Bright Data."""
        user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
        ]
        
        viewports = [
            {'width': 1920, 'height': 1080},
            {'width': 1366, 'height': 768},
            {'width': 1536, 'height': 864},
            {'width': 1440, 'height': 900}
        ]
        
        timezones = ['America/New_York', 'Asia/Manila', 'Asia/Singapore', 'America/Los_Angeles']
        locales = ['en-US', 'en-GB', 'en-PH']
        
        return {
            'user_agent': random.choice(user_agents),
            'viewport': random.choice(viewports),
            'timezone': random.choice(timezones),
            'locale': random.choice(locales)
        }
    
    def _get_random_headers(self):
        """Rotate headers like Bright Data."""
        return {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': random.choice(['en-US,en;q=0.9', 'en-GB,en;q=0.9', 'en-PH,en;q=0.9']),
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': random.choice(['none', 'same-origin']),
            'Sec-Fetch-User': '?1',
            'Cache-Control': random.choice(['max-age=0', 'no-cache']),
            'DNT': random.choice(['1', '0'])
        }
    
    def _scrape_with_playwright_sync(self, game_type, start_date, end_date):
        """Internal method to perform the actual scraping with Playwright Sync API."""
        with sync_playwright() as p:
            # Try Browser API first, fall back to proxy if KYC error
            use_browser_api = self.browser_api_url and self.use_browser_api
            browser = None
            kyc_error_occurred = False
            
            if use_browser_api:
                logger.info(f"Connecting to Bright Data Browser API...")
                try:
                    # Connect directly - test shows this works!
                    logger.info(f"Attempting connection to Browser API...")
                    browser = p.chromium.connect_over_cdp(self.browser_api_url)
                    logger.info("✅ Connected to Bright Data Browser API - bot detection bypass enabled")
                except Exception as e:
                    logger.error(f"Failed to connect to Bright Data Browser API: {e}")
                    logger.info("Falling back to local browser with proxy...")
                    browser = None
                    use_browser_api = False
            
            # If Browser API not available, launch local browser with proxy
            if browser is None:
                logger.info("Launching local browser with stealth options...")
                browser = p.chromium.launch(
                    headless=True,
                    args=[
                        '--disable-blink-features=AutomationControlled',
                        '--disable-dev-shm-usage',
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-web-security',
                        '--disable-features=IsolateOrigins,site-per-process',
                        '--disable-infobars',
                        '--disable-extensions',
                        '--disable-plugins-discovery',
                        '--start-maximized',
                        '--disable-background-timer-throttling',
                        '--disable-backgrounding-occluded-windows',
                        '--disable-renderer-backgrounding',
                        '--disable-features=TranslateUI',
                        '--disable-ipc-flooding-protection',
                        '--window-size=1920,1080'
                    ]
                )
            
            try:
                # Only use proxy if NOT using Browser API (Browser API handles this automatically)
                proxy_config = None
                if not use_browser_api and self.proxy_server:
                    try:
                        # Parse: http://username:password@host:port
                        proxy_url = self.proxy_server.replace('http://', '').replace('https://', '')
                        
                        if '@' in proxy_url:
                            # Authenticated proxy (Bright Data format)
                            auth_part, server_part = proxy_url.split('@')
                            username, password = auth_part.split(':')
                            host, port = server_part.split(':')
                            
                            proxy_config = {
                                'server': f'http://{host}:{port}',
                                'username': username,
                                'password': password
                            }
                            logger.info(f"✅ Bright Data proxy configured: {host}:{port}")
                            logger.info(f"   Username: {username[:20]}... (zone: pcso_scraper)")
                            logger.info(f"   This should bypass bot detection - if still blocked, website may be detecting Playwright fingerprint")
                        else:
                            # Simple proxy (no auth)
                            host, port = proxy_url.split(':')
                            proxy_config = {
                                'server': f'http://{host}:{port}'
                            }
                            logger.info(f"Using proxy: {host}:{port}")
                    except Exception as e:
                        logger.error(f"Failed to parse proxy config: {e}")
                        proxy_config = None
                
                # When using Browser API, it handles everything automatically
                # When using regular proxy, apply stealth measures
                if use_browser_api:
                    # Browser API - use default context or create new one
                    # Browser API already handles bot detection, so minimal configuration needed
                    try:
                        # Try to get existing context (Browser API may provide one)
                        contexts = browser.contexts
                        if contexts:
                            context = contexts[0]
                            logger.info("Using existing Browser API context")
                        else:
                            # Create new context with minimal config (Browser API handles the rest)
                            context = browser.new_context(
                                viewport={'width': 1920, 'height': 1080},
                                locale='en-US'
                            )
                            logger.info("Created new Browser API context")
                    except:
                        # Fallback: create new context
                        context = browser.new_context(
                            viewport={'width': 1920, 'height': 1080},
                            locale='en-US'
                        )
                else:
                    # Regular proxy mode - apply all stealth measures
                    profile = self._get_random_browser_profile()
                    context = browser.new_context(
                        proxy=proxy_config,  # Bright Data proxy
                        ignore_https_errors=True,  # Accept proxy's SSL certificate
                        viewport=profile['viewport'],
                        user_agent=profile['user_agent'],
                        locale=profile['locale'],
                        timezone_id=profile['timezone'],
                        permissions=['geolocation'],
                        extra_http_headers=self._get_random_headers()
                    )
                
                # Create new page
                page = context.new_page()
                page.set_default_timeout(self.timeout)
                
                # Verify connection (only for regular proxy, Browser API handles this automatically)
                if not use_browser_api and proxy_config:
                    try:
                        logger.info("Verifying proxy connection by checking IP address...")
                        page.goto('https://api.ipify.org?format=json', wait_until='networkidle', timeout=30000)
                        ip_info = page.content()
                        logger.info(f"Proxy IP check response: {ip_info[:200]}...")
                        if 'ip' in ip_info.lower():
                            logger.info("✅ Proxy connection verified - IP address check successful")
                        else:
                            logger.warning("⚠️ Could not verify proxy IP - but continuing anyway")
                    except Exception as ip_check_error:
                        logger.warning(f"⚠️ Could not verify proxy IP: {ip_check_error} - but continuing anyway")
                
                # Add comprehensive stealth script (only for regular proxy, Browser API handles this automatically)
                if not use_browser_api:
                    page.add_init_script("""
                    // Remove webdriver property
                    Object.defineProperty(navigator, 'webdriver', {
                        get: () => undefined
                    });
                    
                    // Fake Chrome runtime
                    window.navigator.chrome = {
                        runtime: {},
                        loadTimes: function() {},
                        csi: function() {},
                        app: {}
                    };
                    
                    // Override plugins
                    Object.defineProperty(navigator, 'plugins', {
                        get: () => [1, 2, 3, 4, 5]
                    });
                    
                    // Override languages
                    Object.defineProperty(navigator, 'languages', {
                        get: () => ['en-US', 'en']
                    });
                    
                    // Override permissions
                    const originalQuery = window.navigator.permissions.query;
                    window.navigator.permissions.query = (parameters) => (
                        parameters.name === 'notifications' ?
                            Promise.resolve({ state: Notification.permission }) :
                            originalQuery(parameters)
                    );
                    
                    // Override platform
                    Object.defineProperty(navigator, 'platform', {
                        get: () => 'Win32'
                    });
                    
                    // Override hardwareConcurrency
                    Object.defineProperty(navigator, 'hardwareConcurrency', {
                        get: () => 8
                    });
                    
                    // Override deviceMemory
                    Object.defineProperty(navigator, 'deviceMemory', {
                        get: () => 8
                    });
                    
                    // Fake connection
                    Object.defineProperty(navigator, 'connection', {
                        get: () => ({
                            effectiveType: '4g',
                            rtt: 50,
                            downlink: 10,
                            saveData: false
                        })
                    });
                    
                    // Override getBattery
                    navigator.getBattery = () => Promise.resolve({
                        charging: true,
                        chargingTime: 0,
                        dischargingTime: Infinity,
                        level: 1
                    });
                    
                    // Override WebGL vendor
                    const getParameter = WebGLRenderingContext.prototype.getParameter;
                    WebGLRenderingContext.prototype.getParameter = function(parameter) {
                        if (parameter === 37445) {
                            return 'Intel Inc.';
                        }
                        if (parameter === 37446) {
                            return 'Intel Iris OpenGL Engine';
                        }
                        return getParameter.call(this, parameter);
                    };
                    
                    // Canvas fingerprint protection
                    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
                    HTMLCanvasElement.prototype.toDataURL = function(type) {
                        if (type === 'image/png' || type === 'image/jpeg') {
                            const context = this.getContext('2d');
                            if (context) {
                                const imageData = context.getImageData(0, 0, this.width, this.height);
                                for (let i = 0; i < imageData.data.length; i += 4) {
                                    imageData.data[i] += Math.floor(Math.random() * 3) - 1;
                                }
                                context.putImageData(imageData, 0, 0);
                            }
                        }
                        return originalToDataURL.apply(this, arguments);
                    };
                    
                    // Override toString to hide automation
                    window.outerHeight = window.innerHeight;
                    window.outerWidth = window.innerWidth;
                    """)
                
                # Random delay before navigation (human-like)
                time.sleep(random.uniform(1, 3))
                
                logger.info(f"Navigating to {self.base_url}")
                navigation_successful = False
                try:
                    # Use networkidle to wait for all resources to load (more realistic)
                    page.goto(self.base_url, wait_until='networkidle', timeout=90000)
                    navigation_successful = True
                except Exception as nav_error:
                    # Check if it's a KYC/government site restriction
                    error_msg = str(nav_error)
                    if use_browser_api and ('KYC' in error_msg or 'government site' in error_msg.lower() or 'special permissions' in error_msg.lower()):
                        logger.warning("⚠️ Bright Data Browser API requires KYC verification for government sites")
                        logger.warning(f"   Error: {error_msg[:200]}")
                        logger.info("   Solution: Complete KYC at https://brightdata.com/cp/kyc")
                        logger.info("   Automatically falling back to regular proxy in this attempt...")
                        # Close Browser API connection and resources
                        try:
                            page.close()
                            context.close()
                            browser.close()
                        except:
                            pass
                        # Mark that we should use proxy instead
                        kyc_error_occurred = True
                        use_browser_api = False
                        # Will fall through to proxy retry below
                    else:
                        # Re-raise other navigation errors
                        raise
                
                # If navigation was successful (Browser API worked), check for Access Denied
                if navigation_successful and not kyc_error_occurred:
                    # Wait for potential Cloudflare/Akamai challenge to complete
                    logger.info("Waiting for page to fully load and any challenges to complete...")
                    max_wait_time = 15
                    wait_interval = 2
                    waited = 0
                    while waited < max_wait_time:
                        time.sleep(wait_interval)
                        waited += wait_interval
                        current_title = page.title()
                        current_url = page.url
                        if 'challenge' not in current_url.lower() and 'cf-browser-verification' not in current_url.lower():
                            try:
                                page_content = page.content()
                                if 'ddlStartMonth' in page_content or 'SearchLottoResult' in page_content:
                                    logger.info("Challenge appears to have completed")
                                    break
                            except:
                                pass
                        if waited >= max_wait_time:
                            break
                    time.sleep(random.uniform(2, 4))
                    try:
                        page.mouse.move(random.randint(100, 500), random.randint(100, 500))
                        time.sleep(random.uniform(0.5, 1.5))
                    except:
                        pass
                    page_title = page.title()
                    logger.info(f"Page loaded. Title: {page_title}")
                    if 'Access Denied' in page_title or 'access denied' in page_title.lower():
                        logger.error("Access Denied detected in page title!")
                        try:
                            page_content = page.content()
                            if 'Access Denied' in page_content or 'permission' in page_content.lower() or 'edgesuite.net' in page_content:
                                error_msg = (
                                    "PCSO website blocked access (Access Denied).\n"
                                    "The website is using Akamai/Cloudflare protection that detects automated browsers.\n\n"
                                    "Note: Browser API connected but website still blocked. Complete KYC at https://brightdata.com/cp/kyc\n"
                                    "This is a website protection issue, not a code issue."
                                )
                                logger.error(error_msg)
                                raise Exception(error_msg)
                        except Exception as content_error:
                            if 'Access Denied' not in str(content_error):
                                raise Exception(
                                    "PCSO website blocked access (Access Denied). "
                                    "The website detected automated access. Try again later or complete KYC."
                                )
                            raise
                
                # If KYC error occurred, retry with proxy
                if kyc_error_occurred:
                    logger.info("Retrying with regular proxy after KYC error...")
                    # Launch local browser with proxy
                    browser = p.chromium.launch(
                        headless=True,
                        args=[
                            '--disable-blink-features=AutomationControlled',
                            '--disable-dev-shm-usage',
                            '--no-sandbox',
                            '--disable-setuid-sandbox',
                            '--disable-web-security',
                            '--disable-features=IsolateOrigins,site-per-process',
                            '--disable-infobars',
                            '--disable-extensions',
                            '--disable-plugins-discovery',
                            '--start-maximized',
                            '--disable-background-timer-throttling',
                            '--disable-backgrounding-occluded-windows',
                            '--disable-renderer-backgrounding',
                            '--disable-features=TranslateUI',
                            '--disable-ipc-flooding-protection',
                            '--window-size=1920,1080'
                        ]
                    )
                    
                    # Setup proxy
                    proxy_config = None
                    if self.proxy_server:
                        try:
                            proxy_url = self.proxy_server.replace('http://', '').replace('https://', '')
                            if '@' in proxy_url:
                                auth_part, server_part = proxy_url.split('@')
                                username, password = auth_part.split(':')
                                host, port = server_part.split(':')
                                proxy_config = {
                                    'server': f'http://{host}:{port}',
                                    'username': username,
                                    'password': password
                                }
                                logger.info(f"✅ Using Bright Data proxy: {host}:{port}")
                        except Exception as e:
                            logger.error(f"Failed to parse proxy config: {e}")
                            proxy_config = None
                    
                    # Create context with proxy
                    profile = self._get_random_browser_profile()
                    context = browser.new_context(
                        proxy=proxy_config,
                        ignore_https_errors=True,
                        viewport=profile['viewport'],
                        user_agent=profile['user_agent'],
                        locale=profile['locale'],
                        timezone_id=profile['timezone'],
                        permissions=['geolocation'],
                        extra_http_headers=self._get_random_headers()
                    )
                    
                    # Create new page
                    page = context.new_page()
                    page.set_default_timeout(self.timeout)
                    
                    # Add comprehensive stealth script
                    page.add_init_script("""
                    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
                    window.navigator.chrome = { runtime: {}, loadTimes: function() {}, csi: function() {}, app: {} };
                    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
                    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
                    const originalQuery = window.navigator.permissions.query;
                    window.navigator.permissions.query = (parameters) => (parameters.name === 'notifications' ? Promise.resolve({ state: Notification.permission }) : originalQuery(parameters));
                    Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
                    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
                    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
                    Object.defineProperty(navigator, 'connection', { get: () => ({ effectiveType: '4g', rtt: 50, downlink: 10, saveData: false }) });
                    navigator.getBattery = () => Promise.resolve({ charging: true, chargingTime: 0, dischargingTime: Infinity, level: 1 });
                    const getParameter = WebGLRenderingContext.prototype.getParameter;
                    WebGLRenderingContext.prototype.getParameter = function(parameter) { if (parameter === 37445) return 'Intel Inc.'; if (parameter === 37446) return 'Intel Iris OpenGL Engine'; return getParameter.call(this, parameter); };
                    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
                    HTMLCanvasElement.prototype.toDataURL = function(type) { if (type === 'image/png' || type === 'image/jpeg') { const context = this.getContext('2d'); if (context) { const imageData = context.getImageData(0, 0, this.width, this.height); for (let i = 0; i < imageData.data.length; i += 4) { imageData.data[i] += Math.floor(Math.random() * 3) - 1; } context.putImageData(imageData, 0, 0); } } return originalToDataURL.apply(this, arguments); };
                    window.outerHeight = window.innerHeight; window.outerWidth = window.innerWidth;
                    """)
                    
                    # Navigate again with proxy
                    try:
                        logger.info(f"Navigating to {self.base_url} with regular proxy...")
                        page.goto(self.base_url, wait_until='networkidle', timeout=90000)
                    except Exception as proxy_nav_error:
                        logger.error(f"Failed to navigate with proxy: {proxy_nav_error}")
                        raise
                    
                    # Wait for potential Cloudflare/Akamai challenge to complete
                    logger.info("Waiting for page to fully load and any challenges to complete...")
                    max_wait_time = 15
                    wait_interval = 2
                    waited = 0
                    while waited < max_wait_time:
                        time.sleep(wait_interval)
                        waited += wait_interval
                        current_title = page.title()
                        current_url = page.url
                        if 'challenge' not in current_url.lower() and 'cf-browser-verification' not in current_url.lower():
                            try:
                                page_content = page.content()
                                if 'ddlStartMonth' in page_content or 'SearchLottoResult' in page_content:
                                    logger.info("Challenge appears to have completed")
                                    break
                            except:
                                pass
                        if waited >= max_wait_time:
                            break
                    time.sleep(random.uniform(2, 4))
                    try:
                        page.mouse.move(random.randint(100, 500), random.randint(100, 500))
                        time.sleep(random.uniform(0.5, 1.5))
                    except:
                        pass
                    page_title = page.title()
                    logger.info(f"Page loaded. Title: {page_title}")
                    if 'Access Denied' in page_title or 'access denied' in page_title.lower():
                        logger.error("Access Denied detected in page title!")
                        try:
                            page_content = page.content()
                            if 'Access Denied' in page_content or 'permission' in page_content.lower() or 'edgesuite.net' in page_content:
                                error_msg = (
                                    "PCSO website blocked access (Access Denied).\n"
                                    "The website is using Akamai/Cloudflare protection that detects automated browsers.\n\n"
                                    "Possible solutions:\n"
                                    "1. Wait 10-15 minutes and try again (IP might be temporarily blocked)\n"
                                    "2. Use a VPN or proxy service\n"
                                    "3. Try accessing the website manually in a browser first\n"
                                    "4. The website may require solving a CAPTCHA manually\n"
                                    "5. Consider using a residential proxy service\n\n"
                                    "This is a website protection issue, not a code issue."
                                )
                                logger.error(error_msg)
                                raise Exception(error_msg)
                        except Exception as content_error:
                            if 'Access Denied' not in str(content_error):
                                raise Exception(
                                    "PCSO website blocked access (Access Denied). "
                                    "The website detected automated access. Try again later or use a VPN/proxy."
                                )
                            raise
                
                # Wait for page to fully load - try multiple selectors
                logger.info("Waiting for page elements to load...")
                
                # First, wait for any form or body to ensure page loaded
                try:
                    page.wait_for_load_state('networkidle', timeout=30000)
                    logger.info("Page network idle")
                except:
                    logger.warning("Network idle timeout, continuing anyway...")
                
                # Try to find select elements with multiple strategies
                selectors_to_try = [
                    'select#ddlStartMonth',
                    'select#ddlGameType',
                    'select',
                    'form select',
                    '#ddlStartMonth',
                    '#ddlGameType'
                ]
                
                element_found = False
                found_selector = None
                for selector in selectors_to_try:
                    try:
                        page.wait_for_selector(selector, timeout=15000, state='visible')
                        logger.info(f"Found element: {selector}")
                        element_found = True
                        found_selector = selector
                        break
                    except Exception as e:
                        logger.debug(f"Selector {selector} not found: {str(e)[:100]}")
                        continue
                
                if not element_found:
                    # Try to get page content for debugging
                    page_content = page.content()[:500]
                    logger.error(f"Could not find select elements. Page content preview: {page_content}")
                    logger.error("This might indicate the page structure changed or there's an error")
                    raise Exception("Page did not load correctly - select elements not found")
                
                # Additional wait for JavaScript to finish
                logger.info("Waiting for JavaScript to finish...")
                time.sleep(3)
                
                # Map game types to PCSO game names
                game_options = {
                    'ultra_lotto_6_58': 'Ultra Lotto 6/58',
                    'grand_lotto_6_55': 'Grand Lotto 6/55',
                    'super_lotto_6_49': 'Super Lotto 6/49',
                    'mega_lotto_6_45': 'Mega Lotto 6/45',
                    'lotto_6_42': 'Lotto 6/42'
                }
                
                game_name = game_options.get(game_type)
                if not game_name:
                    raise ValueError(f"Unknown game type: {game_type}")
                
                # Set Start Date (From) - January 2025
                logger.info(f"Setting start date: {start_date.strftime('%B %d, %Y')}")
                self._set_date_dropdowns_sync(page, start_date, 'start')
                
                # Set End Date (To) - Today
                logger.info(f"Setting end date: {end_date.strftime('%B %d, %Y')}")
                self._set_date_dropdowns_sync(page, end_date, 'end')
                
                # Select game from dropdown
                game_selected = self._select_game_sync(page, game_name)
                
                if not game_selected:
                    logger.warning("Could not find game dropdown, trying to search for all games")
                
                # Click Search button
                search_clicked = self._click_search_button_sync(page)
                
                if not search_clicked:
                    raise Exception("Could not find or click search button")
                
                # Wait for results table to load
                logger.info("Waiting for results table...")
                page.wait_for_selector('table', timeout=self.timeout)
                time.sleep(3)
                
                # Parse results with BeautifulSoup
                html_content = page.content()
                soup = BeautifulSoup(html_content, 'html.parser')
                results = self._parse_results(soup, game_type)
                
                logger.info(f"Found {len(results)} results in table")
                
                return results
                
            finally:
                context.close()
                browser.close()
    
    def _set_date_dropdowns_sync(self, page, date_obj, prefix):
        """Helper method to set date dropdowns using Playwright Sync."""
        selectors_map = {
            'start': {
                'month': ['#ddlStartMonth', '#ddlFromMonth', '[name="ddlStartMonth"]', 'select[id*="Start"][id*="Month"]'],
                'day': ['#ddlStartDay', '#ddlFromDay', '[name="ddlStartDay"]', 'select[id*="Start"][id*="Day"]'],
                'year': ['#ddlStartYear', '#ddlFromYear', '[name="ddlStartYear"]', 'select[id*="Start"][id*="Year"]']
            },
            'end': {
                'month': ['#ddlEndMonth', '#ddlToMonth', '[name="ddlEndMonth"]', 'select[id*="End"][id*="Month"]'],
                'day': ['#ddlEndDay', '#ddlToDay', '[name="ddlEndDay"]', 'select[id*="End"][id*="Day"]'],
                'year': ['#ddlEndYear', '#ddlToYear', '[name="ddlEndYear"]', 'select[id*="End"][id*="Year"]']
            }
        }
        
        selectors = selectors_map.get(prefix, selectors_map['start'])
        
        # Set month - wait for element first
        month_set = False
        for selector in selectors['month']:
            try:
                page.wait_for_selector(selector, timeout=5000, state='visible')
                page.select_option(selector, value=str(date_obj.month))
                logger.debug(f"Set {prefix} month to {date_obj.month}")
                month_set = True
                break
            except Exception as e:
                logger.debug(f"Failed to set month with {selector}: {str(e)}")
                continue
        
        if not month_set:
            logger.warning(f"Could not set {prefix} month")
        
        # Set day
        day_set = False
        for selector in selectors['day']:
            try:
                page.wait_for_selector(selector, timeout=5000, state='visible')
                page.select_option(selector, value=str(date_obj.day))
                logger.debug(f"Set {prefix} day to {date_obj.day}")
                day_set = True
                break
            except Exception as e:
                logger.debug(f"Failed to set day with {selector}: {str(e)}")
                continue
        
        if not day_set:
            logger.warning(f"Could not set {prefix} day")
        
        # Set year
        year_set = False
        for selector in selectors['year']:
            try:
                page.wait_for_selector(selector, timeout=5000, state='visible')
                page.select_option(selector, value=str(date_obj.year))
                logger.debug(f"Set {prefix} year to {date_obj.year}")
                year_set = True
                break
            except Exception as e:
                logger.debug(f"Failed to set year with {selector}: {str(e)}")
                continue
        
        if not year_set:
            logger.warning(f"Could not set {prefix} year")
        
        # Small delay after setting dates
        time.sleep(1)
    
    def _select_game_sync(self, page, game_name):
        """Helper method to select game from dropdown."""
        game_selectors = [
            '#ddlGameType',
            '#ddlGame',
            '[name="ddlGameType"]',
            '[name="ddlGame"]'
        ]
        
        for selector in game_selectors:
            try:
                page.select_option(selector, label=game_name)
                logger.info(f"Selected game: {game_name}")
                return True
            except:
                continue
        
        return False
    
    def _click_search_button_sync(self, page):
        """Helper method to click search button."""
        search_selectors = [
            '#btnSearch',
            '#btnSearchLotto',
            '[name="btnSearch"]',
            'input[type="submit"][value*="Search"]',
            'button:has-text("Search")'
        ]
        
        for selector in search_selectors:
            try:
                page.click(selector)
                logger.info("Search button clicked")
                return True
            except:
                continue
        
        return False
    
    def _parse_results(self, soup, game_type):
        """
        Parse results from the results table.
        Based on PCSO website structure with columns: LOTTO GAME, COMBINATIONS, DRAW DATE, JACKPOT (PHP), WINNERS
        """
        results = []
        
        # Find the results table - try multiple possible selectors
        results_table = None
        table_selectors = [
            ('id', 'gvResults'),
            ('id', 'resultsTable'),
            ('class', 'results-table'),
            ('class', 'lotto-results'),
        ]
        
        for attr, value in table_selectors:
            if attr == 'id':
                results_table = soup.find('table', id=value)
            elif attr == 'class':
                results_table = soup.find('table', class_=value)
            
            if results_table:
                break
        
        # If no specific table found, try to find any table with results
        if not results_table:
            tables = soup.find_all('table')
            for table in tables:
                # Check if table has result-like structure (multiple rows with td elements)
                rows = table.find_all('tr')
                if len(rows) > 1:  # Has header + data rows
                    first_data_row = rows[1] if len(rows) > 1 else None
                    if first_data_row:
                        cells = first_data_row.find_all('td')
                        if len(cells) >= 3:  # Has multiple columns
                            results_table = table
                            break
        
        if not results_table:
            logger.warning("Could not find results table")
            return results
        
        # Find all rows (skip header row)
        rows = results_table.find_all('tr')
        
        # Skip header row(s) - usually first row
        data_rows = rows[1:] if len(rows) > 1 else []
        
        logger.info(f"Found {len(data_rows)} data rows in table")
        
        for row in data_rows:
            try:
                cells = row.find_all('td')
                
                # Need at least 3 columns: Game, Combinations, Date, (Jackpot, Winners optional)
                if len(cells) < 3:
                    continue
                
                # Extract data from cells
                # Column order: LOTTO GAME, COMBINATIONS, DRAW DATE, JACKPOT (PHP), WINNERS
                lotto_game = cells[0].get_text(strip=True)
                combinations = cells[1].get_text(strip=True)
                draw_date_str = cells[2].get_text(strip=True)
                
                # Filter by game type if needed (in case "All Games" was selected)
                game_name_map = {
                    'ultra_lotto_6_58': 'Ultra Lotto 6/58',
                    'grand_lotto_6_55': 'Grand Lotto 6/55',
                    'super_lotto_6_49': 'Super Lotto 6/49',
                    'mega_lotto_6_45': 'Mega Lotto 6/45',
                    'lotto_6_42': 'Lotto 6/42'
                }
                
                expected_game = game_name_map.get(game_type, '')
                if expected_game and expected_game.lower() not in lotto_game.lower():
                    continue  # Skip rows that don't match the selected game
                
                # Parse draw date (format: MM/DD/YYYY)
                try:
                    draw_date = datetime.strptime(draw_date_str, '%m/%d/%Y').date()
                except ValueError:
                    try:
                        draw_date = datetime.strptime(draw_date_str, '%Y-%m-%d').date()
                    except ValueError:
                        logger.warning(f"Could not parse date: {draw_date_str}")
                        continue
                
                # Parse winning numbers from combinations (format: "41-16-45-20-52-01")
                numbers = []
                try:
                    number_parts = combinations.split('-')
                    for part in number_parts:
                        num_text = part.strip()
                        # Handle leading zeros (e.g., "01" -> 1)
                        num = int(num_text)
                        numbers.append(num)
                except ValueError:
                    logger.warning(f"Could not parse numbers from: {combinations}")
                    continue
                
                if len(numbers) != 6:
                    continue
                
                # Extract jackpot (if available) - usually 4th column
                jackpot = None
                if len(cells) >= 4:
                    jackpot_str = cells[3].get_text(strip=True)
                    if jackpot_str:
                        # Remove commas, currency symbols, and spaces
                        jackpot_clean = jackpot_str.replace(',', '').replace('PHP', '').replace('₱', '').replace(' ', '').strip()
                        try:
                            jackpot = float(jackpot_clean)
                        except ValueError:
                            pass
                
                # Extract winners (if available) - usually 5th column
                winners = None
                if len(cells) >= 5:
                    winners_str = cells[4].get_text(strip=True)
                    if winners_str:
                        try:
                            winners = int(winners_str)
                        except ValueError:
                            pass
                
                # Generate draw number from date
                draw_number = draw_date_str.replace('/', '')
                
                results.append({
                    'draw_date': draw_date,
                    'draw_number': draw_number,
                    'number_1': numbers[0],
                    'number_2': numbers[1],
                    'number_3': numbers[2],
                    'number_4': numbers[3],
                    'number_5': numbers[4],
                    'number_6': numbers[5],
                    'jackpot': jackpot,
                    'winners': winners
                })
                
            except Exception as e:
                logger.error(f"Error parsing row: {e}")
                continue
        
        return results
    
    async def scrape_all_games(self, start_date=None, end_date=None):
        """
        Scrape results for all games and store in InstantDB.
        
        Args:
            start_date: Optional start date (defaults to January 1, 2025)
            end_date: Optional end date (defaults to today)
            
        Returns:
            Dictionary with scraping statistics
        """
        # Set default dates if not provided
        if not start_date:
            start_date = datetime(2025, 1, 1)  # January 2025 as requested
        if not end_date:
            end_date = datetime.now()
        
        stats = {
            'total_new': 0,
            'total_duplicates': 0,
            'games_updated': [],
            'errors': []
        }
        
        game_types = ['ultra_lotto_6_58', 'grand_lotto_6_55', 'super_lotto_6_49', 
                     'mega_lotto_6_45', 'lotto_6_42']
        
        for game_type in game_types:
            try:
                logger.info(f"Scraping {game_type} from {start_date.date()} to {end_date.date()}...")
                
                results = await self.scrape_game_results(
                    game_type, 
                    start_date=start_date,
                    end_date=end_date
                )
                
                logger.info(f"Found {len(results)} results for {game_type}")
                
                new_count, dup_count = self._store_results(game_type, results)
                
                stats['total_new'] += new_count
                stats['total_duplicates'] += dup_count
                stats['games_updated'].append({
                    'game': game_type,
                    'new_records': new_count,
                    'duplicates': dup_count
                })
                
                # Delay between games to avoid overwhelming the server
                await asyncio.sleep(5)
                
            except Exception as e:
                error_msg = f"Error scraping {game_type}: {str(e)}"
                logger.error(error_msg)
                logger.error(traceback.format_exc())
                stats['errors'].append(error_msg)
        
        return stats
    
    def _store_results(self, game_type: str, results: list):
        """
        Store results in InstantDB, checking for duplicates.
        
        Args:
            game_type: Game type identifier
            results: List of result dictionaries
            
        Returns:
            Tuple of (new_count, duplicate_count)
        """
        new_count = 0
        duplicate_count = 0
        
        # Get existing results to check for duplicates
        existing_results = instantdb.get_results(game_type, limit=10000, offset=0)
        existing_keys = set()
        for existing in existing_results:
            draw_date = existing.get('draw_date')
            draw_number = existing.get('draw_number')
            if draw_date and draw_number:
                existing_keys.add((str(draw_date), str(draw_number)))
        
        for result_data in results:
            try:
                # Check for duplicate
                draw_date = result_data.get('draw_date')
                draw_number = result_data.get('draw_number')
                
                if draw_date and draw_number:
                    # Convert to string for comparison
                    if isinstance(draw_date, datetime):
                        draw_date = draw_date.isoformat()
                    elif isinstance(draw_date, date):
                        draw_date = draw_date.isoformat()
                    
                    key = (str(draw_date), str(draw_number))
                    if key in existing_keys:
                        duplicate_count += 1
                        continue
                
                # Format draw_date for InstantDB
                if isinstance(draw_date, datetime):
                    draw_date_str = draw_date.isoformat()
                elif isinstance(draw_date, date):
                    draw_date_str = draw_date.isoformat()
                else:
                    draw_date_str = str(draw_date)
                
                # Create new record in InstantDB
                instantdb.create_result(game_type, {
                    'draw_date': draw_date_str,
                    'draw_number': result_data.get('draw_number'),
                    'number_1': result_data.get('number_1'),
                    'number_2': result_data.get('number_2'),
                    'number_3': result_data.get('number_3'),
                    'number_4': result_data.get('number_4'),
                    'number_5': result_data.get('number_5'),
                    'number_6': result_data.get('number_6'),
                    'jackpot': result_data.get('jackpot'),
                    'winners': result_data.get('winners'),
                    'created_at': datetime.now().isoformat()
                })
                
                new_count += 1
                existing_keys.add(key)
                
            except Exception as e:
                logger.error(f"Error storing result: {e}")
                continue
        
        return new_count, duplicate_count
