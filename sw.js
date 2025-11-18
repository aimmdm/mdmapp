const CACHE = 'pwa-v1';
self.addEventListener('install', (e) => {
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  self.clients.claim();
});

// Minimal fetch handler agar dianggap PWA
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(event.request);
    try {
      const res = await fetch(event.request);
      if (res && res.ok && (res.type === 'basic' || res.type === 'cors')) {
        cache.put(event.request, res.clone());
      }
      return res;
    } catch (err) {
      return cached || Response.error();
    }
  })());
});
