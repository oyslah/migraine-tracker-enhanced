// Increment the cache version to trigger the 'activate' event and clear old caches.
const CACHE_NAME = 'migraine-tracker-v10';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json', // Added manifest
  '/icon.svg', // Added SVG icon for PWA
  '/index.js',
  '/App.js',
  '/types.js',
  '/constants.js',
  '/components/ui.js',
  '/components/Dashboard.js',
  '/components/Analytics.js',
  '/components/LogAndSettings.js',
  '/components/AttackLogModal.js',
  '/components/Chart.js',
  '/components/ErrorBoundary.js',
  '/services/dataMigration.js',
  '/services/utils.js',
  '/services/db.js',
  // External URLs have been removed from precaching.
  // They will be cached on first use by the robust fetch handler below.
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // By only caching local, same-origin files, the install step is much more reliable.
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // If the cache name is not in our whitelist, we delete it.
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // If the resource is in the cache, return it.
        if (cachedResponse) {
          return cachedResponse;
        }

        // If the resource is not in the cache, fetch it from the network.
        return fetch(event.request).then(
          networkResponse => {
            // We only cache valid responses to avoid caching errors.
            // Opaque responses (from CDNs without CORS) don't have a status we can read,
            // but we can still cache them.
            if (networkResponse.ok || networkResponse.type === 'opaque') {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }
            
            return networkResponse;
          }
        ).catch(error => {
            // This is triggered if the network request fails when the user is offline
            // and the resource is not already in the cache.
            console.error('Service Worker fetch failed:', event.request.url, error);
            // The browser will handle the error and show its default offline page.
            throw error;
        });
      })
    );
});