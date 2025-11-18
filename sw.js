// sw.js
const CACHE = 'pwa-v1.0.2';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './mdm-192.png',
  './mdm-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Network-first + fallback cache.
// Navigasi fallback ke index.html (untuk offline).
// JSONP Blogger (script cross-origin) di-cache sebagai opaque.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isSameOrigin = self.location.origin === url.origin;

  // Navigasi
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try { return await fetch(req); }
      catch {
        const cache = await caches.open(CACHE);
        return (await cache.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  // JSONP Blogger: script dari *.blogspot.com feed
  const isBloggerJSONP = url.hostname.endsWith('blogspot.com') && url.pathname.includes('/feeds/posts/');
  if (!isSameOrigin && req.destination === 'script' && isBloggerJSONP) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      const network = fetch(req).then((res) => {
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      }).catch(() => null);
      return cached || network || Response.error();
    })());
    return;
  }

  // Default: network-first
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await fetch(req);
      if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
      return res;
    } catch {
      const cached = await cache.match(req);
      return cached || Response.error();
    }
  })());
});
