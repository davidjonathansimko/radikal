// Analytics tracking hook / Analytics-Tracking-Hook / Hook pentru urmărire analytics
// This hook tracks page views, sessions, and events in real-time
// Dieser Hook verfolgt Seitenaufrufe, Sitzungen und Ereignisse in Echtzeit
// Acest hook urmărește vizualizările de pagini, sesiunile și evenimentele în timp real

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase';

// Generate unique session ID / Generiere einzigartige Sitzungs-ID / Generează ID sesiune unic
const generateSessionId = (): string => {
  const stored = sessionStorage.getItem('radikal_session_id');
  if (stored) return stored;
  
  const newId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  sessionStorage.setItem('radikal_session_id', newId);
  return newId;
};

// Get device type / Gerätetyp ermitteln / Obține tipul dispozitivului
const getDeviceType = (): string => {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
};

// Get browser name / Browser-Name ermitteln / Obține numele browserului
const getBrowser = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('SamsungBrowser')) return 'Samsung';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  if (ua.includes('Edge')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  return 'Other';
};

// Get OS / Betriebssystem ermitteln / Obține sistemul de operare
const getOS = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Other';
};

// Hash function for IP privacy / Hash-Funktion für IP-Datenschutz / Funcție hash pentru confidențialitatea IP
const hashString = async (str: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(str + 'radikal-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
};

export function useAnalytics() {
  const pathname = usePathname();
  const supabase = createClient();
  const sessionId = useRef<string>('');
  const lastActivity = useRef<number>(Date.now());
  const pageStartTime = useRef<number>(Date.now());

  // Initialize session / Sitzung initialisieren / Inițializează sesiunea
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionId.current = generateSessionId();
    }
  }, []);

  // Track page view / Seitenaufruf verfolgen / Urmărește vizualizarea paginii
  const trackPageView = useCallback(async () => {
    if (!sessionId.current) return;
    
    try {
      // Full device info for page_views (has all columns)
      const fullDeviceInfo = {
        device_type: getDeviceType(),
        browser: getBrowser(),
        os: getOS(),
        screen_width: window.screen.width,
        screen_height: window.screen.height,
      };
      
      // Limited device info for analytics_sessions (doesn't have screen columns)
      const sessionDeviceInfo = {
        device_type: getDeviceType(),
        browser: getBrowser(),
        os: getOS(),
      };

      // Track page view / Seitenaufruf verfolgen
      const { error: insertError } = await supabase.from('page_views').insert({
        page_path: pathname,
        page_title: document.title,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
        session_id: sessionId.current,
        ...fullDeviceInfo,
      });
      
      if (insertError) {
        // Pasul 2102003: Suppress noisy analytics errors — these are non-critical
        console.debug('Analytics: Page view insert issue:', insertError.code);
      } else {
        console.log('✅ Page view tracked:', pathname);
      }

      // Skip session read due to RLS policy issues - just try to insert/upsert
      // Session tracking is done via upsert to avoid SELECT permission issues
      const { error: sessionUpsertError } = await supabase.from('analytics_sessions').upsert({
        session_id: sessionId.current,
        first_page: pathname,
        last_page: pathname,
        page_count: 1,
        referrer: document.referrer || null,
        ...sessionDeviceInfo,
      }, { 
        onConflict: 'session_id',
        ignoreDuplicates: false 
      });
      
      if (sessionUpsertError) {
        // Try simple insert if upsert fails
        const { error: sessionInsertError } = await supabase.from('analytics_sessions').insert({
          session_id: sessionId.current,
          first_page: pathname,
          last_page: pathname,
          page_count: 1,
          referrer: document.referrer || null,
          ...sessionDeviceInfo,
        });
        
        if (sessionInsertError && !sessionInsertError.message.includes('duplicate')) {
          console.debug('Analytics: Session insert issue:', sessionInsertError.code);
        }
      } else {
        console.log('✅ Session tracked');
      }

      // Update active users / Aktive Benutzer aktualisieren
      const { error: activeUserError } = await supabase.from('active_users').upsert({
        session_id: sessionId.current,
        current_page: pathname,
        last_activity: new Date().toISOString(),
        device_type: fullDeviceInfo.device_type,
      }, { onConflict: 'session_id' });
      
      if (activeUserError) {
        console.debug('Analytics: Active user update issue:', activeUserError.code);
      }

    } catch (error) {
      // Silently fail - don't break the app / Leise fehlschlagen - App nicht unterbrechen
      console.debug('Analytics tracking error:', error);
    }
  }, [pathname, supabase]);

  // Track custom event / Benutzerdefiniertes Ereignis verfolgen / Urmărește eveniment personalizat
  const trackEvent = useCallback(async (
    eventName: string,
    eventCategory: string = 'engagement',
    eventValue?: string,
    metadata?: Record<string, any>
  ) => {
    if (!sessionId.current) return;

    try {
      await supabase.from('analytics_events').insert({
        event_name: eventName,
        event_category: eventCategory,
        event_value: eventValue,
        page_path: pathname,
        session_id: sessionId.current,
        metadata: metadata || {},
      });
    } catch (error) {
      console.debug('Event tracking error:', error);
    }
  }, [pathname, supabase]);

  // Update session duration on page leave / Sitzungsdauer beim Verlassen der Seite aktualisieren
  useEffect(() => {
    pageStartTime.current = Date.now();

    const updateDuration = async () => {
      if (!sessionId.current) return;
      
      const duration = Math.floor((Date.now() - pageStartTime.current) / 1000);
      
      try {
        // Get current session duration — use maybeSingle to avoid 406 when no row exists
        const { data: session } = await supabase
          .from('analytics_sessions')
          .select('duration_seconds')
          .eq('session_id', sessionId.current)
          .maybeSingle();

        if (session) {
          await supabase
            .from('analytics_sessions')
            .update({
              duration_seconds: (session.duration_seconds || 0) + duration,
              ended_at: new Date().toISOString(),
            })
            .eq('session_id', sessionId.current);
        }
      } catch (error) {
        console.debug('Duration update error:', error);
      }
    };

    // Update on page visibility change or before unload
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        updateDuration();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', updateDuration);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', updateDuration);
      updateDuration();
    };
  }, [pathname, supabase]);

  // Heartbeat to keep active user status / Heartbeat um aktiven Benutzerstatus zu halten
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!sessionId.current) return;
      
      try {
        await supabase.from('active_users').upsert({
          session_id: sessionId.current,
          current_page: pathname,
          last_activity: new Date().toISOString(),
        }, { onConflict: 'session_id' });
      } catch (error) {
        // Silent fail
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [pathname, supabase]);

  // Track page view on pathname change / Seitenaufruf bei Pfadänderung verfolgen
  useEffect(() => {
    trackPageView();
  }, [trackPageView]);

  return { trackEvent, sessionId: sessionId.current };
}

export default useAnalytics;
