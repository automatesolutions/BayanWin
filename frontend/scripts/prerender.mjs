/**
 * Writes real HTML for every public route into dist/, so crawlers (and the
 * AdSense reviewer) get the page content instead of an empty <div id="root">.
 *
 * Runs after `vite build` and `vite build --ssr src/entry-server.jsx`.
 * scripts/check-dist.mjs runs next and removes dist-ssr/.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mainWordCount } from './html-utils.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const ssrEntry = path.join(root, 'dist-ssr', 'entry-server.mjs');

// useLayoutEffect is a no-op here by design (animations run on the client); keep the log readable.
const consoleError = console.error;
console.error = (msg, ...rest) => {
  if (typeof msg === 'string' && msg.includes('useLayoutEffect does nothing on the server')) return;
  consoleError(msg, ...rest);
};

const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const {
  render,
  PUBLIC_PATHS,
  AD_ELIGIBLE_PATHS,
  ADSENSE_CLIENT_ID,
  CONSENT_STORAGE_KEY,
  buildAdSenseScriptSrc,
} = await import(pathToFileURL(ssrEntry).href);

// Every page: tells Google this site belongs to our AdSense account. Serves no ads.
const ACCOUNT_META = `<meta name="google-adsense-account" content="${ADSENSE_CLIENT_ID}" />`;

// Ad pages only. The inline part must run before adsbygoogle.js:
// - pauseAdRequests: no ads until React has hydrated (App.jsx resumes them),
//   so Auto ads never edit HTML that React is about to hydrate.
// - requestNonPersonalizedAds: personalized only after "Accept all" in our banner.
const AD_HEAD = `<script>(function(){var a=window.adsbygoogle=window.adsbygoogle||[];a.pauseAdRequests=1;var p=false;try{var c=JSON.parse(localStorage.getItem(${JSON.stringify(
  CONSENT_STORAGE_KEY
)})||'null');p=!!(c&&c.preferences&&c.preferences.personalization===true)}catch(e){}a.requestNonPersonalizedAds=p?0:1})();</script>
    <script async src="${buildAdSenseScriptSrc()}" crossorigin="anonymous"></script>`;

// The template's own <title>, description, canonical and social tags are for "/"
// only. Strip them so each page carries just the tags Helmet rendered for it.
function stripDefaultHead(html) {
  return html
    .replace(/<title>[\s\S]*?<\/title>\s*/, '')
    .replace(/<meta\s+name="description"[\s\S]*?\/>\s*/, '')
    .replace(/<meta\s+(property="og:|name="twitter:)[^>]*\/>\s*/g, '')
    .replace(/<link\s+rel="canonical"[^>]*\/>\s*/, '')
    .replace(/\s*<!-- (Open Graph|Twitter Card|Canonical) -->/g, '');
}

function page(url, { html, helmet }) {
  const head = [
    ACCOUNT_META,
    ...(AD_ELIGIBLE_PATHS.has(url) ? [AD_HEAD] : []),
    ...(helmet ? [helmet.title, helmet.meta, helmet.link, helmet.script].map((h) => h.toString()) : []),
  ].join('\n    ');
  return stripDefaultHead(template)
    .replace('</head>', `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${html}</div>`);
}

async function write(url, file) {
  const out = page(url, await render(url));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, out);
  const ads = AD_ELIGIBLE_PATHS.has(url) ? 'ads' : '   ';
  console.log(`prerendered ${url.padEnd(38)} ${ads} ${String(mainWordCount(out)).padStart(5)} words in <main>`);
}

for (const url of PUBLIC_PATHS) {
  const file = url === '/' ? path.join(dist, 'index.html') : path.join(dist, url.slice(1), 'index.html');
  await write(url, file);
}
// Served by nginx with a real 404 status for unknown paths.
await write('/404', path.join(dist, '404.html'));
