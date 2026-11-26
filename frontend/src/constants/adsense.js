/** Google AdSense client ID (must match ads.txt publisher line). */
export const ADSENSE_CLIENT_ID = 'ca-pub-5394062342441330';

export function buildAdSenseScriptSrc() {
  return `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
}

/**
 * The only pages that may show ads: long-form articles we wrote ourselves.
 * scripts/prerender.mjs puts the AdSense script in the static <head> of these
 * pages and no others. Exact paths, not prefixes, so a new page never gets ads
 * until it is reviewed and added here. Left out on purpose:
 * - `/` dashboard and `/blog` index: tool and navigation screens.
 * - `/responsible-play`: help for problem gambling, no ads next to it.
 * - `/privacy`, `/terms`, `/contact`, 404: legal, contact and error screens.
 * The Privacy Policy ("Where ads appear") lists these pages from this set.
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

/** Build check (scripts/check-dist.mjs): every ad page holds at least this many words in `<main>`. */
export const MIN_PUBLISHER_WORDS = 500;

export function isAdEligiblePath(rawPath) {
  // "/about/" and "/about" are the same page (same rule as getSeoForPath).
  const pathname = rawPath.length > 1 ? rawPath.replace(/\/+$/, '') : rawPath;
  return AD_ELIGIBLE_PATHS.has(pathname);
}

/**
 * Ad pages load with ad requests paused (see prerender.mjs), so Auto ads can't
 * insert units into the prerendered HTML before React hydrates it. A mismatch
 * would make React re-render the page and drop the ads. Call once the page has
 * hydrated.
 */
export function resumeAdRequests() {
  if (window.adsbygoogle) window.adsbygoogle.pauseAdRequests = 0;
}
