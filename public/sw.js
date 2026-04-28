const CACHE_NAME = 'musteducate-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Simple fetch handler to satisfy PWA requirements
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
