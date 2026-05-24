import React, { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ADSENSE_LOADER_ATTR,
  buildAdSenseScriptSrc,
  isAdSenseAllowedPath,
  teardownAdSenseDom,
} from '../constants/adsense';

/**
 * Loads the AdSense auto-ads script on all content-rich editorial routes.
 * The script itself does not require cookie consent — only personalised ads do.
 * Non-personalised ads will serve if the user has not granted consent.
 *
 * Uses imperative DOM insert/remove so leaving an allowed route tears down the
 * loader and injected ad nodes without relying on Helmet alone.
 */
function ConditionalAdSense() {
  const { pathname } = useLocation();
  const routeOk = useMemo(() => isAdSenseAllowedPath(pathname), [pathname]);

  useEffect(() => {
    if (!routeOk) {
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
  }, [routeOk]);

  return null;
}

export default ConditionalAdSense;
