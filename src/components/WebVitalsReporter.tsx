// Web Vitals Reporter Component / Web Vitals Reporter-Komponente / Componentă pentru raportare Web Vitals
// This component initializes web vitals tracking when mounted
// Diese Komponente initialisiert das Web Vitals Tracking beim Mounten
// Această componentă inițializează tracking-ul Web Vitals la montare

'use client';

import { useEffect } from 'react';
import { reportWebVitals } from '@/lib/webVitals';

interface WebVitalsReporterProps {
  debug?: boolean;
  analyticsEndpoint?: string;
}

export default function WebVitalsReporter({ 
  debug = process.env.NODE_ENV === 'development',
  analyticsEndpoint 
}: WebVitalsReporterProps) {
  useEffect(() => {
    // Initialize web vitals reporting
    reportWebVitals({
      debug,
      analyticsEndpoint,
      sampleRate: 1.0, // Track 100% of sessions
    });
  }, [debug, analyticsEndpoint]);

  return null;
}
