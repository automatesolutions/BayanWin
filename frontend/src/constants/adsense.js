/** Google AdSense client ID (must match ads.txt publisher line). */
export const ADSENSE_CLIENT_ID = 'ca-pub-5394062342441330';

/** Marker on the loader `<script>` so we can remove it when leaving allowed routes (SPA). */
export const ADSENSE_LOADER_ATTR = 'data-bayanwin-adsense-loader';

export function buildAdSenseScriptSrc() {
  return `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
}

/**
 * Remove our AdSense loader and typical injected nodes. Needed for SPAs: once
 * `adsbygoogle.js` runs, route changes alone do not stop auto ads without DOM cleanup.
 */
export function teardownAdSenseDom() {
  const selector =
    `script[${ADSENSE_LOADER_ATTR}], ` +
    'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle"]';

  document.head.querySelectorAll(selector).forEach((el) => el.remove());
  document.body.querySelectorAll(selector).forEach((el) => el.remove());

  document.querySelectorAll('ins.adsbygoogle').forEach((el) => el.remove());
  document
    .querySelectorAll(
      [
        'iframe[src*="googlesyndication"]',
        'iframe[src*="doubleclick.net"]',
        'iframe[name^="google_ads_iframe"]',
        'iframe[id^="google_ads_iframe"]',
      ].join(', ')
    )
    .forEach((el) => el.remove());

  try {
    delete window.adsbygoogle;
  } catch {
    try {
      window.adsbygoogle = undefined;
    } catch {
      /* ignore */
    }
  }
}

/**
 * Paths where AdSense may load. Includes all content-rich editorial and informational
 * pages. Homepage is included since it now has substantial publisher content.
 */
export function isAdSenseAllowedPath(pathname) {
  if (!pathname) return false;
  if (pathname === '/') return true;
  if (pathname === '/blog' || pathname.startsWith('/blog/')) return true;
  if (pathname === '/about' || pathname === '/methodology') return true;
  if (pathname === '/responsible-play') return true;
  return false;
}
