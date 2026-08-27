// RADIKAL Blog Service Worker / RADIKAL Blog Service Worker / Service Worker pentru RADIKAL Blog
// Enables offline functionality and caching for PWA
// Ermöglicht Offline-Funktionalität und Caching für PWA
// Activează funcționalitatea offline și caching pentru PWA

// ⚠️ BUMP THIS ON EVERY DEPLOY THAT CHANGES public/ OR THE APP SHELL.
// Older versions kept a fixed name, so after a Vercel deploy the browser was
// served OLD hashed /_next/static chunks while the new HTML asked for new ones.
// React then failed to hydrate and the whole shell (logo, progress bar, menu,
// language/theme/search buttons) silently disappeared — the exact bug users hit.
const SW_VERSION = 'v9';
const SHELL_CACHE = `radikal-shell-${SW_VERSION}`;   // HTML pages
const ASSET_CACHE = `radikal-assets-${SW_VERSION}`;  // immutable hashed assets + images
const CACHE_NAME = SHELL_CACHE; // kept for the CLEAR_CACHE message below
const OFFLINE_URL = '/offline';

// Keep this list tiny: only things guaranteed to exist.
const PRECACHE_URLS = [
  '/offline',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install event - precache essential resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker', SW_VERSION);

  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) =>
        // addAll() fails atomically if ONE url 404s, which would leave the app
        // without a service worker at all. Cache them individually instead.
        Promise.all(PRECACHE_URLS.map((url) => cache.add(url).catch(() => {})))
      )
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('[SW] Failed to cache resources:', error);
      })
  );
});

// Activate event - clean up EVERY cache that is not from this version
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker', SW_VERSION);

  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => n !== SHELL_CACHE && n !== ASSET_CACHE
            && n !== 'offline-comments' && n !== 'offline-newsletter')
          .map((n) => {
            console.log('[SW] Deleting old cache:', n);
            return caches.delete(n);
          })
      );
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable().catch(() => {});
      }
      await self.clients.claim();
      console.log('[SW] Service Worker activated');
    })()
  );
});

// ---------------------------------------------------------------------------
// Fetch strategy
//
// Golden rule: NEVER cache anything related to authentication or data.
// The previous version intercepted Supabase requests, so an expired
// /auth/v1/user response was replayed from cache. getSession() then hung,
// the 3s safety timeout fired ("Session check timeout"), analytics returned
// 401, and login/logout became impossible until the user wiped the cache.
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // 1. Anything cross-origin (Supabase, Google Fonts, Vercel, analytics…) is
  //    left completely alone. No interception, no caching, ever.
  if (url.origin !== self.location.origin) return;

  // 2. Never touch API routes, auth callbacks, RSC payloads or ranged media.
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname.startsWith('/auth')) return;
  if (url.pathname.startsWith('/_next/data/')) return;
  if (url.searchParams.has('_rsc')) return;
  if (request.headers.has('range')) return;

  // 3. Hashed build output is immutable -> cache-first (fast, always correct,
  //    and a NEW deploy has NEW filenames so it can never go stale).
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  // 4. Icons / images -> cache-first as well.
  if (/\.(?:png|jpg|jpeg|svg|webp|avif|gif|ico|woff2?)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  // 5. Page navigations -> network-first with a short timeout, cache only as
  //    an offline fallback. Guarantees users always get the current deploy.
  if (request.mode === 'navigate') {
    event.respondWith(navigationHandler(event));
    return;
  }

  // Everything else: straight to the network, untouched.
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.status === 200 && response.type === 'basic') {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 504, statusText: 'Offline' });
  }
}

async function navigationHandler(event) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const preload = await event.preloadResponse;
    const response = preload || (await fetchWithTimeout(event.request, 5000));
    if (response && response.status === 200 && response.type === 'basic') {
      cache.put(event.request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(event.request);
    if (cached) return cached;
    const offline = await cache.match(OFFLINE_URL);
    if (offline) return offline;
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({ 'Content-Type': 'text/plain' }),
    });
  }
}

function fetchWithTimeout(request, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(request, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

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
    caches.keys()
      .then((names) => Promise.all(names.map((n) => caches.delete(n))))
      .then(() => {
        console.log('[SW] All caches cleared');
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: true });
        }
      });
  }
});
