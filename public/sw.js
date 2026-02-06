// RADIKAL Blog Service Worker / RADIKAL Blog Service Worker / Service Worker pentru RADIKAL Blog
// Enables offline functionality and caching for PWA
// Ermöglicht Offline-Funktionalität und Caching für PWA
// Activează funcționalitatea offline și caching pentru PWA

const CACHE_NAME = 'radikal-v2'; // Updated to force cache refresh
const OFFLINE_URL = '/offline';

// Resources to cache immediately on install
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/blogs',
  '/manifest.json',
  '/radikal.logo.schwarz.hintergrund.png',
];

// Install event - precache essential resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching essential resources');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Service Worker installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache resources:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - Network first, fallback to cache strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Let Google Fonts requests pass through directly - don't intercept
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('gstatic.com')) {
    return; // Let the browser handle these directly
  }
  
  // Skip cross-origin requests except for Supabase
  if (url.origin !== self.location.origin) {
    // Only handle Supabase requests
    if (!url.hostname.includes('supabase.co')) {
      return;
    }
  }
  
  // Skip API routes (always fetch fresh)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(
    // Try network first
    fetch(request)
      .then((response) => {
        // Don't cache bad responses
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        
        // Clone response for caching
        const responseToCache = response.clone();
        
        // Cache successful responses
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(request, responseToCache);
          });
        
        return response;
      })
      .catch(async () => {
        // Network failed, try cache
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // If navigating to a page, show offline page
        if (request.mode === 'navigate') {
          const offlineResponse = await caches.match(OFFLINE_URL);
          if (offlineResponse) {
            return offlineResponse;
          }
        }
        
        // Return a basic offline response for other resources
        return new Response('Offline', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain',
          }),
        });
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let data = {
    title: 'RADIKAL Blog',
    body: 'Neuer Artikel verfügbar!',
    url: '/blogs',
  };
  
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    console.error('[SW] Error parsing push data:', e);
  }
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now(),
    },
    actions: [
      {
        action: 'open',
        title: 'Öffnen',
      },
      {
        action: 'close',
        title: 'Schließen',
      },
    ],
    tag: 'radikal-notification',
    renotify: true,
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync event (for offline form submissions)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);
  
  if (event.tag === 'sync-comments') {
    event.waitUntil(syncComments());
  }
  
  if (event.tag === 'sync-newsletter') {
    event.waitUntil(syncNewsletter());
  }
});

// Sync comments when back online
async function syncComments() {
  try {
    const cache = await caches.open('offline-comments');
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      const data = await response.json();
      
      await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      await cache.delete(request);
    }
    
    console.log('[SW] Comments synced successfully');
  } catch (error) {
    console.error('[SW] Failed to sync comments:', error);
  }
}

// Sync newsletter subscriptions when back online
async function syncNewsletter() {
  try {
    const cache = await caches.open('offline-newsletter');
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      const data = await response.json();
      
      await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      await cache.delete(request);
    }
    
    console.log('[SW] Newsletter subscriptions synced successfully');
  } catch (error) {
    console.error('[SW] Failed to sync newsletter:', error);
  }
}

// Message event for communication with main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[SW] Cache cleared');
      event.ports[0].postMessage({ success: true });
    });
  }
});
