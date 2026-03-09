const CACHE_NAME = 'apb-admin-v1';
const urlsToCache = [
  '/',
  '/admin.html',
  '/a-manifest.json',
  '/admin/icons/icon-192x192.png',
  '/admin/icons/icon-512x512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          fetch(event.request)
            .then(networkResponse => {
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, networkResponse));
            })
            .catch(() => {});
          return response;
        }
        return fetch(event.request)
          .then(networkResponse => {
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, networkResponse.clone()));
            return networkResponse;
          });
      })
      .catch(() => caches.match('/admin.html'))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    )
  );
});
