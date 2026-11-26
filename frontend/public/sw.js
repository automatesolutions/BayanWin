/**
 * BayanWin service worker. Small on purpose:
 * - Pages (HTML): network first, cached copy only when offline.
 * - Built assets (/assets/*, hashed names) and /icons/*: cache first.
 * - Never touches /api, other origins (Google ads, fonts, the backend) or non-GET requests.
 * Bump VERSION to drop every old cache on the next visit.
 */
const VERSION = 'v1';
const SHELL = `bayanwin-shell-${VERSION}`;
const STATIC = `bayanwin-static-${VERSION}`;
const SHELL_URLS = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL && k !== STATIC).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api')) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(cacheFirst(request));
  }
});

async function networkFirst(request) {
  const cache = await caches.open(SHELL);
  try {
    const response = await fetch(request);
    // Keep only real pages; a 404 page must not replace a cached article.
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) || (await cache.match('/')) || Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}
