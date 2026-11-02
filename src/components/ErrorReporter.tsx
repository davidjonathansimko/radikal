'use client';

// Trimite serverului erorile neprinse din aplicatie (maximum cateva pe sesiune), ca sa le vezi in admin.
// Nu se trimit date personale: doar mesajul, locul din cod, adresa paginii si limba.

import { useEffect } from 'react';

const IGNORE = /ResizeObserver loop|chrome-extension|moz-extension|Script error|Non-Error promise rejection|Loading chunk|ChunkLoadError|AbortError|NetworkError|Failed to fetch|Load failed/i;

export default function ErrorReporter() {
  useEffect(() => {
    let sent = 0;
    const send = (message: string, stack?: string) => {
      if (sent >= 5 || !message || IGNORE.test(message)) return;
      sent += 1;
      try {
        const body = JSON.stringify({ message, stack, url: window.location.pathname, lang: document.documentElement.lang });
        void fetch('/api/client-error', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
      } catch {
        /* ignorat */
      }
    };
    const onError = (e: ErrorEvent) => send(e.message, e.error?.stack);
    const onRejection = (e: PromiseRejectionEvent) => {
      const r = e.reason;
      send(r instanceof Error ? r.message : typeof r === 'string' ? r : '', r instanceof Error ? r.stack : undefined);
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);
  return null;
}
