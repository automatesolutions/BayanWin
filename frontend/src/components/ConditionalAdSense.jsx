import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ADSENSE_LOADER_ATTR,
  buildAdSenseScriptSrc,
  isAdSenseAllowedPath,
  teardownAdSenseDom,
} from '../constants/adsense';
import { isPersonalizationConsentGranted } from '../utils/cookieConsent';

/**
 * Loads the AdSense script only on editorial routes (blog, about, methodology).
 * Keeps tool-heavy and legal pages free of the publisher tag to reduce policy risk.
 * Requires cookie-banner personalization consent (no ads before choice / after reject optional).
 *
 * Uses imperative DOM insert/remove (not react-helmet) so leaving an allowed route tears down
 * the loader and common injected nodes—Helmet alone often leaves ads active after SPA navigations.
 */
function ConditionalAdSense() {
  const { pathname } = useLocation();
  const routeOk = useMemo(() => isAdSenseAllowedPath(pathname), [pathname]);
  const [consentOk, setConsentOk] = useState(() => isPersonalizationConsentGranted());

  useEffect(() => {
    const refresh = () => setConsentOk(isPersonalizationConsentGranted());
    refresh();
    window.addEventListener('cookie-consent-updated', refresh);
    return () => window.removeEventListener('cookie-consent-updated', refresh);
  }, []);

  useEffect(() => {
    if (!routeOk || !consentOk) {
      teardownAdSenseDom();
      return undefined;
    }

    const src = buildAdSenseScriptSrc();
    const attrSel = `script[${ADSENSE_LOADER_ATTR}]`;
    const existing = document.head.querySelector(attrSel);
    if (existing instanceof HTMLScriptElement && existing.src === src) {
      return () => {
        teardownAdSenseDom();
      };
    }
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = src;
    script.setAttribute(ADSENSE_LOADER_ATTR, '');
    document.head.appendChild(script);

    return () => {
      teardownAdSenseDom();
    };
  }, [routeOk, consentOk]);

  return null;
}

export default ConditionalAdSense;
