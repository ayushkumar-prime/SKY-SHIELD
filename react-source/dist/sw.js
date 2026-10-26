const CACHE = 'sky-shield-v1';
const ready = async () => {
  const cache = await caches.open(CACHE);
  if (await cache.match('/')) for (const client of await self.clients.matchAll({ includeUncontrolled: true })) client.postMessage('SKY_CACHE_READY');
};
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const response = await fetch('/', { cache: 'reload' });
    if (!response.ok) throw new Error('App unavailable');
    const html = await response.clone().text();
    const assets = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map(m => m[1]).filter(p => p.startsWith('/assets/') || p === '/icon.svg' || p === '/manifest.webmanifest');
    await cache.addAll(assets);
    await cache.put('/', response);
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith('sky-shield-') && key !== CACHE) await caches.delete(key);
    await self.clients.claim(); await ready();
  })());
});
self.addEventListener('message', event => { if (event.data === 'SKY_CHECK_CACHE') event.waitUntil(ready()); });
self.addEventListener('fetch', event => {
  const { request } = event; const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (request.mode === 'navigate') {
      try {
        const response = await fetch(request, { signal: AbortSignal.timeout(2000) });
        if (!response.ok) throw new Error('Server unavailable');
        // Cache new bundles before replacing the offline HTML.
        const html = await response.clone().text();
        const assets = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map(m => m[1]).filter(p => p.startsWith('/assets/'));
        await cache.addAll(assets); await cache.put('/', response.clone()); return response;
      } catch { return await cache.match('/') || Response.error(); }
    }
    const hit = await cache.match(request);
    if (hit) return hit;
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  })());
});
