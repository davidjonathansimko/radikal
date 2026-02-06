// Analytics Provider Component / Analytics-Provider-Komponente / Componentă Provider Analytics
// Wraps the app to enable analytics tracking across all pages
// Umhüllt die App um Analytics-Tracking auf allen Seiten zu ermöglichen
// Învelește aplicația pentru a permite urmărirea analytics pe toate paginile

'use client';

import React, { createContext, useContext, ReactNode } from 'react';
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
