import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ADSENSE_LOADER_ATTR,
  MIN_PUBLISHER_WORDS,
  buildAdSenseScriptSrc,
  countPublisherWords,
  teardownAdSenseDom,
} from '../constants/adsense';
import { isPersonalizationConsentGranted } from '../utils/cookieConsent';

// Stop waiting for content after this long; a page that never reaches the word count gets no ads.
const CONTENT_WAIT_MS = 10000;

function loadAutoAds(personalized) {
  // Must be set before adsbygoogle.js runs. Without consent, Google serves non-personalized ads.
  (window.adsbygoogle = window.adsbygoogle || []).requestNonPersonalizedAds = personalized ? 0 : 1;

  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = buildAdSenseScriptSrc();
  script.setAttribute(ADSENSE_LOADER_ATTR, '');
  document.head.appendChild(script);
}

/**
 * The single gate for Google ads on the site (auto ads, no manual units).
 * The script loads only when both checks pass:
 * 1. `hasPublisherContent`: the page is on the reviewed list in constants/adsense.
 * 2. The rendered `<main>` holds at least MIN_PUBLISHER_WORDS words, so ads never
 *    load over a spinner, an error or a half-rendered page.
 * Every route change tears the script and injected ads down and checks again.
 * Ad formats and density are set in the AdSense dashboard (Auto ads settings).
 */
function AutoAds({ hasPublisherContent }) {
  const { pathname } = useLocation();
  const [personalized, setPersonalized] = useState(false);

  useEffect(() => {
    const sync = () => setPersonalized(isPersonalizationConsentGranted());
    sync();
    window.addEventListener('cookie-consent-updated', sync);
    return () => window.removeEventListener('cookie-consent-updated', sync);
  }, []);

  useEffect(() => {
    teardownAdSenseDom();
    if (!hasPublisherContent) return undefined;

    let loaded = false;
    const tryLoad = () => {
      if (loaded || countPublisherWords() < MIN_PUBLISHER_WORDS) return loaded;
      loaded = true;
      loadAutoAds(personalized);
      return true;
    };

    const observer = new MutationObserver(() => {
      if (tryLoad()) observer.disconnect();
    });
    const timer = window.setTimeout(() => observer.disconnect(), CONTENT_WAIT_MS);
    if (!tryLoad()) observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      teardownAdSenseDom();
    };
  }, [hasPublisherContent, pathname, personalized]);

  return null;
}

export default AutoAds;
