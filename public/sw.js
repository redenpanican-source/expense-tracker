// Simple offline-capable service worker for Expense Tracker
const CACHE = 'expense-tracker-v1';
const BASE = self.registration.scope; // e.g. https://host/expense-tracker/

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // App navigations: network-first, fall back to cached shell when offline.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const fresh = await fetch(req);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (_) {
        return (await cache.match(req)) || (await cache.match(BASE)) || Response.error();
      }
    })());
    return;
  }

  // Static assets: stale-while-revalidate.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    const network = fetch(req)
      .then((res) => {
        if (res && res.status === 200) cache.put(req, res.clone());
        return res;
      })
      .catch(() => cached);
    return cached || network;
  })());
});
