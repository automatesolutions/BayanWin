import React from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import { Writable } from 'node:stream';
import App from './App';

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
