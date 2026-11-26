/**
 * Build gate for the AdSense review. Runs after prerender.mjs and fails the
 * build (exit 1) when any rule breaks:
 * - adsbygoogle.js is in the <head> of ad pages (AD_ELIGIBLE_PATHS) and no other page,
 *   after the inline pause/consent script, and there are no manual ad units.
 * - Every page has the google-adsense-account meta, the manifest and the favicon links.
 * - Every ad page has at least MIN_PUBLISHER_WORDS words in <main>.
 * - Every internal link and #anchor points at a real page, file or id.
 * - sitemap.xml lists exactly the prerendered pages, each of which nginx serves
 *   with 200, and unknown paths fall through to the 404 page.
 * Removes dist-ssr/ when done.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mainWordCount } from './html-utils.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const ssrDir = path.join(root, 'dist-ssr');
const { PUBLIC_PATHS, AD_ELIGIBLE_PATHS, ADSENSE_CLIENT_ID, MIN_PUBLISHER_WORDS } = await import(
  pathToFileURL(path.join(ssrDir, 'entry-server.mjs')).href
);

const SITE = 'https://bayanwin.net';
const errors = [];
const fail = (where, msg) => errors.push(`${where}: ${msg}`);

const fileFor = (url) => (url === '/' ? 'index.html' : url === '/404' ? '404.html' : `${url.slice(1)}/index.html`);

// nginx: try_files $uri $uri/index.html =404
function nginxServes(urlPath) {
  const rel = decodeURIComponent(urlPath).replace(/^\/+/, '');
  if (rel.includes('..')) return false;
  const direct = path.join(dist, rel);
  if (rel && fs.existsSync(direct) && fs.statSync(direct).isFile()) return true;
  return fs.existsSync(path.join(dist, rel, 'index.html'));
}

const pages = new Map(
  [...PUBLIC_PATHS, '/404'].map((url) => [url, fs.readFileSync(path.join(dist, fileFor(url)), 'utf8')])
);
const idsOf = (html) => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const ids = new Map([...pages].map(([url, html]) => [url, idsOf(html)]));

const report = [];
for (const [url, html] of pages) {
  const head = html.slice(0, html.indexOf('</head>'));
  const body = html.slice(html.indexOf('</head>'));
  const eligible = AD_ELIGIBLE_PATHS.has(url);

  // Ads
  const loaderAt = head.indexOf('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js');
  if (eligible && loaderAt === -1) fail(url, 'ad page is missing adsbygoogle.js in <head>');
  if (!eligible && html.includes('adsbygoogle.js')) fail(url, 'page without ads loads adsbygoogle.js');
  if (eligible && !(head.indexOf('pauseAdRequests=1') > -1 && head.indexOf('pauseAdRequests=1') < loaderAt))
    fail(url, 'pause/consent script must come before adsbygoogle.js');
  if (body.includes('adsbygoogle')) fail(url, 'ad code in <body> (manual ad units are not used)');
  if (!head.includes(`<meta name="google-adsense-account" content="${ADSENSE_CLIENT_ID}"`))
    fail(url, 'missing google-adsense-account meta');

  // App and icons
  for (const tag of ['rel="manifest"', 'href="/favicon.ico"', 'href="/icons/apple-touch-icon.png"'])
    if (!head.includes(tag)) fail(url, `missing ${tag}`);

  // Content
  const words = mainWordCount(html);
  if (eligible && words < MIN_PUBLISHER_WORDS) fail(url, `ad page has ${words} words in <main> (min ${MIN_PUBLISHER_WORDS})`);
  report.push([url, eligible, words]);

  // Links
  for (const [, href] of body.matchAll(/<a\s[^>]*href="([^"]+)"/g)) {
    let target = href.startsWith(SITE) ? href.slice(SITE.length) || '/' : href;
    if (/^(https?:|mailto:|tel:)/.test(target) || target.startsWith('//')) continue;
    const [pathPart, hash] = target.split('#');
    const p = pathPart === '' ? url : pathPart.split('?')[0].replace(/(.)\/+$/, '$1');
    if (pathPart !== '' && !pathPart.startsWith('/')) {
      fail(url, `relative link "${href}"`);
      continue;
    }
    if (pathPart !== '' && !nginxServes(p)) {
      fail(url, `broken link "${href}"`);
      continue;
    }
    if (hash && !(ids.get(p) || new Set()).has(hash)) fail(url, `missing anchor "${href}"`);
  }
}

// Sitemap
const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE, '') || '/');
for (const loc of locs) {
  if (!PUBLIC_PATHS.includes(loc)) fail('sitemap.xml', `${loc} is not a prerendered page`);
  if (!nginxServes(loc)) fail('sitemap.xml', `${loc} would not return 200`);
}
for (const p of PUBLIC_PATHS) if (!locs.includes(p)) fail('sitemap.xml', `${p} is missing`);
for (const p of ['/does-not-exist', '/blog/does-not-exist', '/about/extra', '/index'])
  if (nginxServes(p)) fail('nginx', `${p} should be a 404`);
if (!fs.existsSync(path.join(dist, '404.html'))) fail('nginx', '404.html is missing');

fs.rmSync(ssrDir, { recursive: true, force: true });

console.log('\nPage                                     Ads  Words in <main>');
for (const [url, eligible, words] of report)
  console.log(`${url.padEnd(40)} ${eligible ? 'yes' : 'no '}  ${String(words).padStart(5)}`);

if (errors.length) {
  console.error(`\ncheck-dist: ${errors.length} problem(s)\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
console.log(
  `\ncheck-dist: OK. ${pages.size} pages, ads on ${AD_ELIGIBLE_PATHS.size}, ${locs.length} sitemap URLs, links and anchors resolve.`
);
