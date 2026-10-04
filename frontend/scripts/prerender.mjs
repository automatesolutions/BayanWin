/**
 * Writes real HTML for every public route into dist/, so crawlers (and the
 * AdSense reviewer) get the page content instead of an empty <div id="root">.
 *
 * Runs after `vite build` and `vite build --ssr src/entry-server.jsx`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const ssrEntry = path.join(root, 'dist-ssr', 'entry-server.mjs');

// Same list as public/sitemap.xml.
const ROUTES = [
  '/',
  '/about',
  '/methodology',
  '/responsible-play',
  '/privacy',
  '/terms',
  '/contact',
  '/blog',
  '/blog/nash-hotfilter',
  '/blog/miro-prediction',
  '/blog/markov-chains-lottery',
  '/blog/deep-reinforcement-learning',
  '/blog/pcso-658-results-analysis',
  '/blog/pcso-649-results-analysis',
];

// useLayoutEffect is a no-op here by design (animations run on the client); keep the log readable.
const consoleError = console.error;
console.error = (msg, ...rest) => {
  if (typeof msg === 'string' && msg.includes('useLayoutEffect does nothing on the server')) return;
  consoleError(msg, ...rest);
};

const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const { render } = await import(pathToFileURL(ssrEntry).href);

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
  const head = helmet
    ? [helmet.title, helmet.meta, helmet.link, helmet.script].map((h) => h.toString()).join('\n    ')
    : '';
  return stripDefaultHead(template)
    .replace('</head>', `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${html}</div>`);
}

async function write(url, file) {
  const out = page(url, await render(url));
  const text = out.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, out);
  console.log(`prerendered ${url.padEnd(38)} ${text.split(' ').length} words`);
}

for (const url of ROUTES) {
  const file = url === '/' ? path.join(dist, 'index.html') : path.join(dist, url.slice(1), 'index.html');
  await write(url, file);
}
// Served by nginx with a real 404 status for unknown paths.
await write('/404', path.join(dist, '404.html'));

fs.rmSync(path.join(root, 'dist-ssr'), { recursive: true, force: true });
