#### 2. `sw.js` (Service Worker в корне папки `admin`)
```javascript
const CACHE_NAME = 'apb-live-v1';
const ASSETS = [
  './',
  './index.html',
  './App.js', // Ваш скомпилированный JS
  'https://cdn.tailwindcss.com'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
