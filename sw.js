// Version à incrémenter à chaque déploiement
const VERSION = 'v1.1.0';
const CACHE   = `archerai-${VERSION}`;
const ASSETS  = ['/', '/index.html'];

// ── INSTALL : mise en cache ──
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE : nettoyage anciens caches ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
      .then(() => {
        // Notifier les onglets ouverts qu'une mise à jour est disponible
        return self.clients.matchAll({ includeUncontrolled: true });
      })
      .then(clients => {
        clients.forEach(c => c.postMessage({ type: 'UPDATE_READY', version: VERSION }));
      })
  );
});

// ── FETCH : stale-while-revalidate ──
self.addEventListener('fetch', e => {
  // Ne cache que les requêtes GET same-origin (pas les appels API)
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.pathname.startsWith('/api/')) {
    e.respondWith(fetch(e.request));
    return;
  }

  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(e.request).then(cached => {
        const network = fetch(e.request).then(response => {
          if (response.ok) cache.put(e.request, response.clone());
          return response;
        }).catch(() => null);
        return cached || network;
      })
    )
  );
});
