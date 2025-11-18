/* sw.js - Service Worker untuk GitHub Pages PWA (JSONP Blogger)
   Catatan: gunakan path relatif di precache agar jalan di project pages. */
const CACHE_VERSION = 'pwa-v1.0.0';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './pwa/icons/icon-192.png',
  './pwa/icons/icon-512.png',
  './pwa/icons/apple-touch-icon-180.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_VERSION).then(c => c.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Network-first dengan fallback cache. Navigasi fallback ke index.html.
// JSONP Blogger (script cross-origin) di-cache sebagai opaque (stale-while-revalidate sederhana).
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isSameOrigin = self.location.origin === url.origin;
  const isNavigate = req.mode === 'navigate';

  if (isNavigate) {
    event.respondWith((async () => {
      try {
        return await fetch(req);
      } catch (e) {
        const cache = await caches.open(CACHE_VERSION);
        return (await cache.match('./index.html')) || new Response('<h1>Offline</h1>', { headers: { 'content-type': 'text/html; charset=utf-8' } });
      }
    })());
    return;
  }

  // JSONP Blogger: script dari *.blogspot.com berisi feed
  const isBloggerJSONP = url.hostname.endsWith('blogspot.com') && url.pathname.includes('/feeds/posts/');
  if (!isSameOrigin && req.destination === 'script' && isBloggerJSONP) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_VERSION);
      const cached = await cache.match(req);
      const network = fetch(req).then((res) => {
        // opaque boleh disimpan, cukup untuk replay offline
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      }).catch(() => null);
      return cached || network || Response.error();
    })());
    return;
  }

  // Default: network-first, fallback cache
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION);
    try {
      const res = await fetch(req);
      if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
      return res;
    } catch (e) {
      const cached = await cache.match(req);
      return cached || Response.error();
    }
  })());
});
