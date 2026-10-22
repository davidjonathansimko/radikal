// Analytics Provider Component / Analytics-Provider-Komponente / Componentă Provider Analytics
// Wraps the app to enable analytics tracking across all pages
// Umhüllt die App um Analytics-Tracking auf allen Seiten zu ermöglichen
// Învelește aplicația pentru a permite urmărirea analytics pe toate paginile

'use client';

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';

interface AnalyticsContextType {
  trackEvent: (
    eventName: string,
    eventCategory?: string,
    eventValue?: string,
    metadata?: Record<string, any>
  ) => Promise<void>;
  sessionId: string;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const { trackEvent, sessionId } = useAnalytics();

  // Pasul 2210010 — erorile din pagina ajung in statistici (cel mult 5 pe vizita),
  // ca sa afli ce se strica la utilizatori fara sa-i intrebi.
  useEffect(() => {
    let sent = 0;
    const report = (kind: string, message: string, where?: string) => {
      // Mesajele extensiilor din browser (ex. React DevTools) nu sunt ale aplicatiei.
      if (/Bridge that has been shut down|extension:\/\//i.test(`${message} ${where ?? ''}`)) return;
      if (sent >= 5) return;
      sent += 1;
      void trackEvent('js_error', 'error', message.slice(0, 200), { kind, where });
    };
    const onError = (e: ErrorEvent) => report('error', e.message || 'error', e.filename);
    const onRejection = (e: PromiseRejectionEvent) =>
      report('promise', String((e.reason && (e.reason.message || e.reason)) || 'rejection'));
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, [trackEvent]);

  return (
    <AnalyticsContext.Provider value={{ trackEvent, sessionId }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

// Hook to use analytics in any component / Hook zum Verwenden von Analytics in jeder Komponente / Hook pentru a folosi analytics în orice componentă
export function useAnalyticsContext() {
  const context = useContext(AnalyticsContext);
  
  // Return noop function if not in provider / Noop-Funktion zurückgeben wenn nicht im Provider / Returnează funcție noop dacă nu e în provider
  if (!context) {
    return {
      trackEvent: async () => {},
      sessionId: '',
    };
  }
  
  return context;
}

export default AnalyticsProvider;
