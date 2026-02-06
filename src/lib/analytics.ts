// Enhanced Analytics System / Erweitertes Analysesystem / Sistem Analize Îmbunătățit
// Custom analytics with event tracking, user engagement, and reporting
// Benutzerdefinierte Analysen mit Event-Tracking, Nutzerengagement und Berichterstattung
// Analize personalizate cu tracking evenimente, engagement utilizatori și raportare

import { getSupabaseClient } from './supabase';

const supabase = getSupabaseClient();

// Types
export interface AnalyticsEvent {
  id?: string;
  name: string;
  category: string;
  action?: string;
  label?: string;
  value?: number;
  properties?: Record<string, any>;
  timestamp: number;
  page: string;
  session_id: string;
  user_id?: string;
  device_type?: 'mobile' | 'tablet' | 'desktop';
  referrer?: string;
}

export interface PageView {
  page: string;
  title: string;
  timestamp: number;
  session_id: string;
  user_id?: string;
  referrer?: string;
  device_type?: 'mobile' | 'tablet' | 'desktop';
  time_on_page?: number;
  scroll_depth?: number;
}

export interface UserSession {
  id: string;
  user_id?: string;
  started_at: number;
  ended_at?: number;
  page_views: number;
  events: number;
  device_type?: string;
  browser?: string;
  country?: string;
  entry_page?: string;
  exit_page?: string;
}

// Configuration
const CONFIG = {
  endpoint: '/api/analytics/track',
  batchSize: 10,
  flushInterval: 30000, // 30 seconds
  trackScrollDepth: true,
  trackTimeOnPage: true,
  trackClicks: true,
  trackFormSubmissions: true,
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
};

// State
let eventsBuffer: AnalyticsEvent[] = [];
let pageViewsBuffer: PageView[] = [];
let sessionId: string = '';
let pageLoadTime: number = 0;
let maxScrollDepth: number = 0;

/**
 * Initialize analytics
 */
export function initAnalytics(): void {
  if (typeof window === 'undefined') return;

  // Generate or retrieve session ID
  sessionId = getSessionId();

  // Track page view
  trackPageView();

  // Set up event listeners
  if (CONFIG.trackScrollDepth) {
    setupScrollTracking();
  }

  if (CONFIG.trackTimeOnPage) {
    setupTimeTracking();
  }

  if (CONFIG.trackClicks) {
    setupClickTracking();
  }

  if (CONFIG.trackFormSubmissions) {
    setupFormTracking();
  }

  // Set up periodic flush
  setInterval(flushEvents, CONFIG.flushInterval);

  // Flush on page unload
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      trackPageExit();
      flushEvents();
      flushPageViews();
    }
  });

  // Track page visibility
  document.addEventListener('visibilitychange', () => {
    trackEvent({
      name: 'page_visibility',
      category: 'engagement',
      action: document.visibilityState,
    });
  });
}

/**
 * Get or create session ID
 */
function getSessionId(): string {
  const SESSION_KEY = 'radikal_session';
  const SESSION_TIME_KEY = 'radikal_session_time';

  const stored = sessionStorage.getItem(SESSION_KEY);
  const lastActivity = sessionStorage.getItem(SESSION_TIME_KEY);
  const now = Date.now();

  // Check if session expired
  if (stored && lastActivity && now - parseInt(lastActivity) < CONFIG.sessionTimeout) {
    sessionStorage.setItem(SESSION_TIME_KEY, now.toString());
    return stored;
  }

  // Create new session
  const newSessionId = `${now}-${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem(SESSION_KEY, newSessionId);
  sessionStorage.setItem(SESSION_TIME_KEY, now.toString());

  // Track new session
  trackEvent({
    name: 'session_start',
    category: 'session',
    properties: {
      referrer: document.referrer,
      landing_page: window.location.pathname,
    },
  });

  return newSessionId;
}

/**
 * Get device type
 */
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Track page view
 */
export function trackPageView(customPage?: string): void {
  if (typeof window === 'undefined') return;

  pageLoadTime = Date.now();
  maxScrollDepth = 0;

  const pageView: PageView = {
    page: customPage || window.location.pathname,
    title: document.title,
    timestamp: Date.now(),
    session_id: sessionId,
    referrer: document.referrer,
    device_type: getDeviceType(),
  };

  pageViewsBuffer.push(pageView);

  // Also track as event
  trackEvent({
    name: 'page_view',
    category: 'navigation',
    properties: {
      page: pageView.page,
      title: pageView.title,
    },
  });

  if (pageViewsBuffer.length >= CONFIG.batchSize) {
    flushPageViews();
  }
}

/**
 * Track page exit with engagement metrics
 */
function trackPageExit(): void {
  const timeOnPage = Date.now() - pageLoadTime;

  trackEvent({
    name: 'page_exit',
    category: 'engagement',
    properties: {
      time_on_page: timeOnPage,
      scroll_depth: maxScrollDepth,
    },
  });
}

/**
 * Track an event
 */
export function trackEvent(
  event: Omit<AnalyticsEvent, 'timestamp' | 'page' | 'session_id'>
): void {
  if (typeof window === 'undefined') return;

  const fullEvent: AnalyticsEvent = {
    ...event,
    timestamp: Date.now(),
    page: window.location.pathname,
    session_id: sessionId,
    device_type: getDeviceType(),
    referrer: document.referrer,
  };

  eventsBuffer.push(fullEvent);

  if (eventsBuffer.length >= CONFIG.batchSize) {
    flushEvents();
  }
}

/**
 * Track content engagement
 */
export function trackContentEngagement(
  contentId: string,
  contentType: string,
  action: 'view' | 'read' | 'like' | 'share' | 'comment' | 'bookmark',
  metadata?: Record<string, any>
): void {
  trackEvent({
    name: 'content_engagement',
    category: 'content',
    action,
    label: contentId,
    properties: {
      content_id: contentId,
      content_type: contentType,
      ...metadata,
    },
  });
}

/**
 * Track search
 */
export function trackSearch(
  query: string,
  resultsCount: number,
  selectedResult?: string
): void {
  trackEvent({
    name: 'search',
    category: 'search',
    action: selectedResult ? 'result_click' : 'search_query',
    label: query,
    value: resultsCount,
    properties: {
      query,
      results_count: resultsCount,
      selected_result: selectedResult,
    },
  });
}

/**
 * Track conversion
 */
export function trackConversion(
  conversionType: 'newsletter' | 'contact' | 'download' | 'registration' | 'purchase',
  value?: number,
  metadata?: Record<string, any>
): void {
  trackEvent({
    name: 'conversion',
    category: 'conversion',
    action: conversionType,
    value,
    properties: {
      conversion_type: conversionType,
      value,
      ...metadata,
    },
  });
}

/**
 * Track social action
 */
export function trackSocialAction(
  platform: string,
  action: 'share' | 'like' | 'follow',
  contentUrl?: string
): void {
  trackEvent({
    name: 'social_action',
    category: 'social',
    action,
    label: platform,
    properties: {
      platform,
      action,
      content_url: contentUrl,
    },
  });
}

/**
 * Setup scroll depth tracking
 */
function setupScrollTracking(): void {
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = Math.round((scrollTop / docHeight) * 100);

        if (scrollPercent > maxScrollDepth) {
          maxScrollDepth = scrollPercent;

          // Track milestones
          const milestones = [25, 50, 75, 90, 100];
          const milestone = milestones.find(
            (m) => scrollPercent >= m && maxScrollDepth - scrollPercent < 5
          );

          if (milestone) {
            trackEvent({
              name: 'scroll_depth',
              category: 'engagement',
              action: `${milestone}%`,
              value: milestone,
            });
          }
        }

        ticking = false;
      });

      ticking = true;
    }
  });
}

/**
 * Setup time on page tracking
 */
function setupTimeTracking(): void {
  // Track engagement intervals
  const intervals = [10, 30, 60, 120, 300]; // seconds
  let trackedIntervals: number[] = [];

  setInterval(() => {
    const timeOnPage = Math.floor((Date.now() - pageLoadTime) / 1000);

    intervals.forEach((interval) => {
      if (timeOnPage >= interval && !trackedIntervals.includes(interval)) {
        trackedIntervals.push(interval);
        trackEvent({
          name: 'time_on_page',
          category: 'engagement',
          action: `${interval}s`,
          value: interval,
        });
      }
    });
  }, 5000);
}

/**
 * Setup click tracking
 */
function setupClickTracking(): void {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    // Track link clicks
    const link = target.closest('a');
    if (link) {
      const href = link.getAttribute('href') || '';
      const isExternal = href.startsWith('http') && !href.includes(window.location.host);

      trackEvent({
        name: 'link_click',
        category: 'navigation',
        action: isExternal ? 'external' : 'internal',
        label: href,
        properties: {
          href,
          text: link.textContent?.slice(0, 100),
          is_external: isExternal,
        },
      });
    }

    // Track button clicks
    const button = target.closest('button');
    if (button) {
      trackEvent({
        name: 'button_click',
        category: 'interaction',
        label: button.textContent?.slice(0, 100) || button.getAttribute('aria-label') || 'unknown',
        properties: {
          button_id: button.id,
          button_class: button.className,
        },
      });
    }
  });
}

/**
 * Setup form tracking
 */
function setupFormTracking(): void {
  document.addEventListener('submit', (e) => {
    const form = e.target as HTMLFormElement;
    
    trackEvent({
      name: 'form_submit',
      category: 'conversion',
      label: form.id || form.name || 'unknown',
      properties: {
        form_id: form.id,
        form_name: form.name,
        form_action: form.action,
      },
    });
  });

  // Track form field interactions
  document.addEventListener('focusin', (e) => {
    const input = e.target as HTMLInputElement;
    if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA' || input.tagName === 'SELECT') {
      trackEvent({
        name: 'form_field_focus',
        category: 'form',
        label: input.name || input.id,
      });
    }
  });
}

/**
 * Flush events to server
 */
async function flushEvents(): Promise<void> {
  if (eventsBuffer.length === 0) return;

  const events = [...eventsBuffer];
  eventsBuffer = [];

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        CONFIG.endpoint,
        JSON.stringify({ type: 'events', data: events })
      );
    } else {
      await fetch(CONFIG.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'events', data: events }),
        keepalive: true,
      });
    }
  } catch (error) {
    console.error('Failed to send analytics events:', error);
    eventsBuffer = [...events, ...eventsBuffer];
  }
}

/**
 * Flush page views to server
 */
async function flushPageViews(): Promise<void> {
  if (pageViewsBuffer.length === 0) return;

  const pageViews = [...pageViewsBuffer];
  pageViewsBuffer = [];

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        CONFIG.endpoint,
        JSON.stringify({ type: 'pageviews', data: pageViews })
      );
    } else {
      await fetch(CONFIG.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'pageviews', data: pageViews }),
        keepalive: true,
      });
    }
  } catch (error) {
    console.error('Failed to send page views:', error);
    pageViewsBuffer = [...pageViews, ...pageViewsBuffer];
  }
}

/**
 * React hook for analytics
 */
import { useEffect, useCallback } from 'react';

export function useAnalytics() {
  useEffect(() => {
    initAnalytics();
  }, []);

  const track = useCallback((
    eventName: string,
    properties?: Record<string, any>
  ) => {
    trackEvent({
      name: eventName,
      category: 'custom',
      properties,
    });
  }, []);

  return { track, trackEvent, trackPageView, trackContentEngagement };
}

/**
 * Analytics API endpoint SQL
 */
export const ANALYTICS_SQL = `
-- Analytics Events Table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  action VARCHAR(100),
  label TEXT,
  value NUMERIC,
  properties JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  page TEXT,
  session_id VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  device_type VARCHAR(50),
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Page Views Table
CREATE TABLE IF NOT EXISTS analytics_pageviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page TEXT NOT NULL,
  title TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  session_id VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  referrer TEXT,
  device_type VARCHAR(50),
  time_on_page INTEGER,
  scroll_depth INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions Table
CREATE TABLE IF NOT EXISTS analytics_sessions (
  id VARCHAR(100) PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  page_views INTEGER DEFAULT 0,
  events INTEGER DEFAULT 0,
  device_type VARCHAR(50),
  browser VARCHAR(100),
  country VARCHAR(100),
  entry_page TEXT,
  exit_page TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_name ON analytics_events(name);
CREATE INDEX IF NOT EXISTS idx_events_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_pageviews_timestamp ON analytics_pageviews(timestamp);
CREATE INDEX IF NOT EXISTS idx_pageviews_page ON analytics_pageviews(page);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON analytics_sessions(started_at);

-- Views for reporting
CREATE OR REPLACE VIEW analytics_daily_summary AS
SELECT 
  DATE(timestamp) as date,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(*) as total_events,
  COUNT(DISTINCT page) as unique_pages
FROM analytics_events
GROUP BY DATE(timestamp);

CREATE OR REPLACE VIEW analytics_popular_pages AS
SELECT 
  page,
  COUNT(*) as view_count,
  AVG(time_on_page) as avg_time_on_page,
  AVG(scroll_depth) as avg_scroll_depth
FROM analytics_pageviews
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY page
ORDER BY view_count DESC;
`;

export default initAnalytics;
