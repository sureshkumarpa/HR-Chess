const CACHE = 'hr-chess-v3';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Never intercept Firebase or external API calls
  if(url.hostname.includes('firebasedatabase.app')) return;

  // NETWORK-FIRST for HTML/navigation — always get latest version,
  // fall back to cache only when offline
  if(e.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/')){
    e.respondWith(
      fetch(e.request).then(res => {
        if(res.ok){
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // CACHE-FIRST for static assets (icons, manifest)
  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) return cached;
      return fetch(e.request).then(res => {
        if(res.ok){
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
