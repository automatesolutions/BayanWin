import React from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import { Writable } from 'node:stream';
import App from './App';

// Shared with scripts/prerender.mjs and scripts/check-dist.mjs, so the ad list,
// the route list and the consent key each live in one place.
export { AD_ELIGIBLE_PATHS, ADSENSE_CLIENT_ID, MIN_PUBLISHER_WORDS, buildAdSenseScriptSrc } from './constants/adsense';
export { CONSENT_STORAGE_KEY } from './utils/cookieConsent';
export { PUBLIC_PATHS } from './seo/routeSeo';

/**
 * Build-time render of one route to static HTML (see scripts/prerender.mjs).
 * Waits for every lazy page to resolve so the output holds the full article,
 * not the Suspense spinner.
 */
export function render(url) {
  const helmetContext = {};
  return new Promise((resolve, reject) => {
    let html = '';
    const sink = new Writable({
      write(chunk, _enc, cb) {
        html += chunk.toString();
        cb();
      },
      final(cb) {
        resolve({ html, helmet: helmetContext.helmet });
        cb();
      },
    });

    const stream = renderToPipeableStream(
      <HelmetProvider context={helmetContext}>
        <StaticRouter location={url}>
          <App />
        </StaticRouter>
      </HelmetProvider>,
      {
        onAllReady() {
          stream.pipe(sink);
        },
        onShellError: reject,
        onError: reject,
      }
    );
  });
}
