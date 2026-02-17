const CACHE_NAME = 'golf-tracker-v1';
const STATIC_CACHE = 'golf-tracker-static-v1';
const API_CACHE = 'golf-tracker-api-v1';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/rounds',
  '/offline',
];

// API routes that should be cached
const CACHEABLE_API_ROUTES = [
  '/api/courses',
  '/api/user/profile',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.log('[SW] Failed to cache some static assets:', err);
      });
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME &&
              cacheName !== STATIC_CACHE &&
              cacheName !== API_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - network first with cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle page navigation and static assets
  event.respondWith(handleStaticRequest(request));
});

// Network-first strategy for API requests
async function handleApiRequest(request) {
  const url = new URL(request.url);

  // Try network first
  try {
    const response = await fetch(request);

    // Cache successful GET responses for certain routes
    if (response.ok && shouldCacheApiRoute(url.pathname)) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[SW] Network failed for API, trying cache:', url.pathname);

    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline response for API
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'You are offline. Data will sync when connection is restored.'
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Stale-while-revalidate for static requests
async function handleStaticRequest(request) {
  const url = new URL(request.url);

  // Try network first for HTML pages
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    try {
      const response = await fetch(request);

      // Cache the response
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());

      return response;
    } catch (error) {
      console.log('[SW] Network failed for page, trying cache:', url.pathname);

      // Try exact match from cache
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }

      // For round pages, try to serve a cached version or the offline page
      if (url.pathname.startsWith('/rounds/')) {
        const offlinePage = await caches.match('/offline');
        if (offlinePage) {
          return offlinePage;
        }
      }

      // Try dashboard as fallback for other pages
      const dashboardCache = await caches.match('/dashboard');
      if (dashboardCache) {
        return dashboardCache;
      }

      // Last resort - return basic offline response
      return new Response(
        '<html><body><h1>Offline</h1><p>Please check your connection.</p></body></html>',
        { headers: { 'Content-Type': 'text/html' } }
      );
    }
  }

  // For other static assets, try cache first then network
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    // Revalidate in background
    fetch(request).then((response) => {
      if (response.ok) {
        caches.open(STATIC_CACHE).then((cache) => {
          cache.put(request, response);
        });
      }
    }).catch(() => {});

    return cachedResponse;
  }

  // Not in cache, try network
  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[SW] Failed to fetch:', request.url);
    return new Response('', { status: 408 });
  }
}

function shouldCacheApiRoute(pathname) {
  return CACHEABLE_API_ROUTES.some(route => pathname.startsWith(route));
}

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }

  if (event.data.type === 'CACHE_ROUND') {
    // Cache a specific round page and its data
    const roundId = event.data.roundId;
    caches.open(API_CACHE).then((cache) => {
      fetch(`/api/rounds/${roundId}`).then((response) => {
        if (response.ok) {
          cache.put(`/api/rounds/${roundId}`, response);
          console.log('[SW] Cached round:', roundId);
        }
      }).catch(() => {});
    });
  }
});

// Background sync for queued score updates
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-scores') {
    event.waitUntil(syncPendingScores());
  }
});

async function syncPendingScores() {
  // Get pending scores from IndexedDB or send message to clients
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_PENDING_SCORES' });
  });
}
