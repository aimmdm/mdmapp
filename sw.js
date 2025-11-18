// sw.js
const CACHE = 'pwa-v1.0.1';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icon/mdm-192.png',
  './icon/mdm-512.png',
  './icon/mdm-180.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// WAJIB: ada fetch handler agar site dianggap PWA installable
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

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
