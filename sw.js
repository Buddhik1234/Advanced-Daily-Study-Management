// Define a version for your cache
const CACHE_VERSION = 'v1.1';
const CACHE_NAME = `study-planner-${CACHE_VERSION}`;

// List all the files and assets your app needs to function offline
const urlsToCache = [
    '/',
    'index.html',
    'styles.css',
    'main.js',
    'calculator.html',
    'calculator.css',
    'calculator.js',
    'manifest.json',
    'icons/icon-192x192.png',
    'icons/icon-512x512.png',
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap'
];

// 1. Install Event: Cache all the core assets
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting()) // Activate the new service worker immediately
    );
});

// 2. Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Clearing old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    // Take control of all pages under its scope immediately
    return self.clients.claim();
});

// 3. Fetch Event: Intercept network requests
self.addEventListener('fetch', (event) => {
    // For navigation requests (e.g., loading a page), use a network-first strategy
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match('index.html'); // Fallback to the main page if offline
            })
        );
        return;
    }

    // For other requests (CSS, JS, images), use a cache-first strategy
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // If the request is in the cache, return it
                if (response) {
                    return response;
                }
                // Otherwise, fetch it from the network, cache it, and return it
                return fetch(event.request).then((networkResponse) => {
                    // Check if we received a valid response
                    if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }

                    // IMPORTANT: Clone the response. A response is a stream
                    // and because we want the browser to consume the response
                    // as well as the cache consuming the response, we need
                    // to clone it so we have two streams.
                    const responseToCache = networkResponse.clone();

                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return networkResponse;
                }).catch(() => {
                    // If network fails and it's not in cache, you could provide a fallback
                    // For now, we'll just let it fail.
                });
            })
    );
});