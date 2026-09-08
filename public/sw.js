// Service worker for Expense Tracker.
// Network-first for everything: always shows the latest version when online,
// and falls back to the cache only when offline. (v2)
const CACHE = 'expense-tracker-v2';
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

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      // Bypass the HTTP cache so we truly get the freshest file.
      const fresh = await fetch(req, { cache: 'no-store' });
      if (fresh && fresh.status === 200) cache.put(req, fresh.clone());
      return fresh;
    } catch (_) {
      // Offline: serve whatever we cached; fall back to the app shell for navigations.
      const cached = await cache.match(req);
      if (cached) return cached;
      if (req.mode === 'navigate') return (await cache.match(BASE)) || Response.error();
      return Response.error();
    }
  })());
});
