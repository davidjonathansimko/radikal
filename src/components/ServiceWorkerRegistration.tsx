// Service Worker Registration Component / Service Worker Registrierungskomponente / Componentă Înregistrare Service Worker
// Registers the service worker for PWA functionality
// Registriert den Service Worker für PWA-Funktionalität
// Înregistrează service worker-ul pentru funcționalitate PWA

'use client';

import { useEffect, useRef, useState } from 'react';

interface ServiceWorkerStatus {
  isSupported: boolean;
  isRegistered: boolean;
  isOnline: boolean;
  updateAvailable: boolean;
}

export default function ServiceWorkerRegistration() {
  const [status, setStatus] = useState<ServiceWorkerStatus>({
    isSupported: false,
    isRegistered: false,
    isOnline: true,
    updateAvailable: false,
  });

  // Guards against an endless reload loop if something goes wrong.
  const reloadedRef = useRef(false);

  // ===== Self-healing safety net =====
  // If a stale cache ever serves a build chunk that no longer exists, React
  // throws "ChunkLoadError" and the whole UI (logo, progress bar, menu,
  // language/theme/search buttons) vanishes. Instead of leaving the user with
  // a dead page — which previously forced them to clear the browser cache by
  // hand — wipe the caches and reload once, silently.
  useEffect(() => {
    const RECOVERY_FLAG = 'radikalChunkRecovery';

    const looksLikeStaleBuild = (message?: string) =>
      !!message && /ChunkLoadError|Loading chunk [\w-]+ failed|Failed to fetch dynamically imported module|Importing a module script failed/i.test(message);

    const recover = async () => {
      // Only ever do this once per session, otherwise we could loop forever.
      if (sessionStorage.getItem(RECOVERY_FLAG)) return;
      sessionStorage.setItem(RECOVERY_FLAG, '1');
      console.warn('[PWA] Stale build detected — clearing caches and reloading');
      try {
        if ('caches' in window) {
          const names = await caches.keys();
          await Promise.all(names.map((n) => caches.delete(n)));
        }
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
        }
      } catch {
        /* best effort */
      }
      window.location.reload();
    };

    const onError = (e: ErrorEvent) => {
      if (looksLikeStaleBuild(e.message)) recover();
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason as { message?: string; name?: string } | undefined;
      if (looksLikeStaleBuild(reason?.message) || reason?.name === 'ChunkLoadError') recover();
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  useEffect(() => {
    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.log('[PWA] Service Workers not supported');
      return;
    }

    setStatus((prev) => ({ ...prev, isSupported: true }));

    // Track online/offline status
    const handleOnline = () => setStatus((prev) => ({ ...prev, isOnline: true }));
    const handleOffline = () => setStatus((prev) => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial online status
    setStatus((prev) => ({ ...prev, isOnline: navigator.onLine }));

    // Register service worker
    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        console.log('[PWA] Service Worker registered:', registration.scope);
        setStatus((prev) => ({ ...prev, isRegistered: true }));

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New content available, refresh to update');
                setStatus((prev) => ({ ...prev, updateAvailable: true }));
                
                // Dispatch custom event for update notification
                window.dispatchEvent(new CustomEvent('sw-update-available'));
              }
            });
          }
        });

        // Handle controller change (when new SW takes over).
        // Reload ONCE so the page runs against the new deploy's assets instead
        // of a half-old/half-new mix, which used to blank out the header.
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('[PWA] New service worker activated');
          if (reloadedRef.current) return;
          reloadedRef.current = true;
          window.location.reload();
        });

        // Ask the browser to look for a new SW whenever the tab becomes
        // visible again. Users keep the PWA open for days; without this they
        // stay on an outdated worker until a hard refresh.
        const checkForUpdate = () => {
          if (document.visibilityState === 'visible') {
            registration.update().catch(() => {});
          }
        };
        document.addEventListener('visibilitychange', checkForUpdate);

      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    };

    // Wait for the page to load before registering
    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('load', registerSW);
    };
  }, []);

  // Component doesn't render anything visible
  return null;
}

// Hook to access service worker status
export function useServiceWorker(): ServiceWorkerStatus & {
  skipWaiting: () => void;
  clearCache: () => Promise<void>;
} {
  const [status, setStatus] = useState<ServiceWorkerStatus>({
    isSupported: false,
    isRegistered: false,
    isOnline: true,
    updateAvailable: false,
  });

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      setStatus((prev) => ({
        ...prev,
        isSupported: true,
        isOnline: navigator.onLine,
      }));

      // Check if already registered
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) {
          setStatus((prev) => ({ ...prev, isRegistered: true }));
        }
      });
    }

    const handleUpdateAvailable = () => {
      setStatus((prev) => ({ ...prev, updateAvailable: true }));
    };

    window.addEventListener('sw-update-available', handleUpdateAvailable);
    
    return () => {
      window.removeEventListener('sw-update-available', handleUpdateAvailable);
    };
  }, []);

  const skipWaiting = () => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  const clearCache = async () => {
    const controller = navigator.serviceWorker.controller;
    if (controller) {
      const messageChannel = new MessageChannel();
      
      return new Promise<void>((resolve) => {
        messageChannel.port1.onmessage = () => {
          console.log('[PWA] Cache cleared');
          resolve();
        };
        
        controller.postMessage(
          { type: 'CLEAR_CACHE' },
          [messageChannel.port2]
        );
      });
    }
  };

  return {
    ...status,
    skipWaiting,
    clearCache,
  };
}

// Update notification component
export function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const { updateAvailable, skipWaiting } = useServiceWorker();

  useEffect(() => {
    if (updateAvailable) {
      setShowUpdate(true);
    }
  }, [updateAvailable]);

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4 z-50 animate-slide-up">
      <div className="flex items-start gap-3">
        <span className="text-2xl">🔄</span>
        <div className="flex-1">
          <h4 className="font-medium text-white">Update verfügbar</h4>
          <p className="text-sm text-gray-400 mt-1">
            Eine neue Version ist verfügbar. Jetzt aktualisieren?
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => {
                skipWaiting();
                setShowUpdate(false);
              }}
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Aktualisieren
            </button>
            <button
              onClick={() => setShowUpdate(false)}
              className="px-3 py-1.5 bg-gray-700 text-gray-300 text-sm rounded hover:bg-gray-600"
            >
              Später
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Offline indicator component
export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-16 left-0 right-0 bg-yellow-600 text-black text-center py-2 text-sm font-medium z-40">
      📴 Sie sind offline. Einige Funktionen sind möglicherweise nicht verfügbar.
    </div>
  );
}
