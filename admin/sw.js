const CACHE_NAME = 'apb-cache-v1';
const urlsToCache = [
  '/apb-app/admin/',
  '/apb-app/admin/index.html',
  '/apb-app/admin/manifest.json',
  '/apb-app/admin/icon-192.png',
  '/apb-app/admin/icon-512.png',
  '/apb-app/admin/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
});