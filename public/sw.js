const CACHE_NAME = 'schoolms-__CACHE_VERSION__';
const STATIC_CACHE = 'schoolms-static-__CACHE_VERSION__';
const DYNAMIC_CACHE = 'schoolms-dynamic-__CACHE_VERSION__';
const IMAGE_CACHE = 'schoolms-images-__CACHE_VERSION__';

// Core files to cache immediately
const urlsToCache = [
  '/',
  '/manifest.json',
  '/images/icon-192x192.png',
  '/images/icon-512x512.png',
  '/images/icon-72x72.png',
  '/images/icon-96x96.png',
  '/images/icon-128x128.png',
  '/images/icon-144x144.png',
  '/images/icon-152x152.png',
  '/images/icon-384x384.png',
];

// Listen for skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Install service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Cache addAll failed:', error);
      })
  );
  // Don't auto-skip waiting - let the user decide via update notification
});

// Activate service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  const cacheWhitelist = [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages immediately
  return self.clients.claim();
});

// Helper function to determine cache strategy
function getCacheName(url) {
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/)) {
    return IMAGE_CACHE;
  }
  if (url.pathname.match(/\.(js|css|woff|woff2|ttf|eot)$/)) {
    return STATIC_CACHE;
  }
  return DYNAMIC_CACHE;
}

// Fetch strategy with intelligent caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip caching for:
  // 1. Non-GET requests
  // 2. Chrome extensions
  // 3. Different origins (except fonts)
  if (
    request.method !== 'GET' ||
    url.protocol === 'chrome-extension:' ||
    (url.origin !== self.location.origin && !url.pathname.match(/\.(woff|woff2|ttf|eot)$/))
  ) {
    return;
  }

  // Cache-first strategy for static assets (images, fonts, CSS, JS)
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|js|css|woff|woff2|ttf|eot)$/)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200) {
            return response;
          }

          const responseToCache = response.clone();
          const cacheName = getCacheName(url);

          caches.open(cacheName).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        });
      })
    );
    return;
  }

  // Network-first strategy for HTML and API calls
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Don't cache redirects or errors
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        // Cache successful responses (except login/logout)
        if (!url.pathname.match(/\/(login|logout|csrf-token)/)) {
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }

        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(request).then((response) => {
          if (response) {
            return response;
          }

          // Return offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/').then((cachedHome) => {
              return cachedHome || new Response('Offline - Please check your connection', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                  'Content-Type': 'text/html'
                })
              });
            });
          }

          return new Response('Offline - content not available', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });
      })
  );
});