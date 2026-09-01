const CACHE_NAME = 'schoolms-c3fb5a7';
const STATIC_CACHE = 'schoolms-static-c3fb5a7';
const DYNAMIC_CACHE = 'schoolms-dynamic-c3fb5a7';
const IMAGE_CACHE = 'schoolms-images-c3fb5a7';
const OFFLINE_URL = '/offline.html';

// Core files to cache immediately, including the minimal, fully
// self-contained offline fallback page (no external JS/CSS/image
// references) served on a navigation-mode fetch failure instead of a
// frozen app shell whose hashed asset references may have already been
// deleted by a later deploy.
const urlsToCache = [
  '/',
  OFFLINE_URL,
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

  // Network-first strategy for dynamic HTML/API calls. Navigation-mode
  // requests are never written to DYNAMIC_CACHE or replayed from it on
  // failure — an authenticated Inertia page cached here could be shown
  // to a parent as if it were live, stale data. Non-navigation dynamic
  // GETs (the existing component-local data-fetch pattern this app
  // already uses) keep the prior behavior, which the audit confirmed
  // already works correctly.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        if (request.mode !== 'navigate' && !url.pathname.match(/\/(login|logout|csrf-token)/)) {
          const responseToCache = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }

        return response;
      })
      .catch(() => {
        if (request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }

        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return new Response('Offline - content not available', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });
      })
  );
});
