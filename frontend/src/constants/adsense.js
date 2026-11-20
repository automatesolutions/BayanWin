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
 * The only pages that may show ads: long-form articles we wrote ourselves.
 * Exact paths, not prefixes, so a new page never gets ads until it is reviewed
 * and added here. Left out on purpose:
 * - `/` dashboard and `/blog` index: tool and navigation screens.
 * - `/responsible-play`: help for problem gambling, no ads next to it.
 * - `/privacy`, `/terms`, `/contact`, 404: legal, contact and error screens.
 * Keep the list in the Privacy Policy ("Where ads appear") in step with this one.
 */
export const AD_ELIGIBLE_PATHS = new Set([
  '/about',
  '/methodology',
  '/blog/nash-hotfilter',
  '/blog/miro-prediction',
  '/blog/markov-chains-lottery',
  '/blog/deep-reinforcement-learning',
  '/blog/pcso-658-results-analysis',
  '/blog/pcso-649-results-analysis',
]);

/** Second check, on the rendered page: ads load only once `<main>` holds this much text. */
export const MIN_PUBLISHER_WORDS = 500;

export function isAdEligiblePath(rawPath) {
  // "/about/" and "/about" are the same page (same rule as getSeoForPath).
  const pathname = rawPath.length > 1 ? rawPath.replace(/\/+$/, '') : rawPath;
  return AD_ELIGIBLE_PATHS.has(pathname);
}

/** Words of visible text in the page's `<main id="main">` (0 while it has not rendered). */
export function countPublisherWords() {
  const main = document.getElementById('main');
  if (!main) return 0;
  const text = main.innerText || main.textContent || '';
  return text.split(/\s+/).filter(Boolean).length;
}
