/* Offline shell. Bump CACHE when any shell file changes. */
const CACHE = 'bess-lab-v26';
const ASSETS = [
  './',
  './index.html',
  './styles.css?v=26',
  './calc.js?v=26',
  './content.js?v=26',
  './m10.js?v=26',
  './m11.js?v=26',
  './m12.js?v=26',
  './m13.js?v=26',
  './m14.js?v=26',
  './m15.js?v=26',
  './mtc.js?v=26',
  './m16.js?v=26',
  './app.js?v=26',
  './m1.js?v=26',
  './m2.js?v=26',
  './m3.js?v=26',
  './m4.js?v=26',
  './m5.js?v=26',
  './m6.js?v=26',
  './m7.js?v=26',
  './m8.js?v=26',
  './m9.js?v=26',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const wantsHTML = req.mode === 'navigate' ||
    (req.headers.get('accept') || '').indexOf('text/html') >= 0;

  /* The shell must never be stale: network first, cache only as fallback. */
  if (wantsHTML) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
    );
    return;
  }

  /* Assets: serve from cache instantly, refresh in the background. */
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
