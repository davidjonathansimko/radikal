// Web Vitals Tracking Library / Web Vitals Tracking-Bibliothek / Bibliotecă pentru tracking Web Vitals
// This module measures and reports Core Web Vitals metrics for SEO and performance monitoring
// Dieses Modul misst und meldet Core Web Vitals Metriken für SEO und Performance-Überwachung
// Acest modul măsoară și raportează metricile Core Web Vitals pentru SEO și monitorizare performanță

import { onCLS, onLCP, onFCP, onTTFB, onINP, Metric } from 'web-vitals';

export type MetricName = 'CLS' | 'LCP' | 'FCP' | 'TTFB' | 'INP';
type MetricRating = 'good' | 'needs-improvement' | 'poor';

interface WebVitalMetric {
  name: MetricName;
  value: number;
  rating: MetricRating;
  delta: number;
  id: string;
  navigationType: string;
}

interface WebVitalsConfig {
  debug?: boolean;
  analyticsEndpoint?: string;
  sampleRate?: number; // 0-1, percentage of sessions to track
}

const defaultConfig: WebVitalsConfig = {
  debug: process.env.NODE_ENV === 'development',
  sampleRate: 1.0, // Track all sessions by default
};

// Store for collected metrics
const metricsStore: WebVitalMetric[] = [];

/**
 * Format metric value for display
 */
function formatMetricValue(name: MetricName, value: number): string {
  switch (name) {
    case 'CLS':
      return value.toFixed(3);
    case 'LCP':
    case 'FCP':
    case 'TTFB':
    case 'INP':
      return `${Math.round(value)}ms`;
    default:
      return value.toString();
  }
}

/**
 * Get color for metric rating
 */
function getRatingColor(rating: MetricRating): string {
  switch (rating) {
    case 'good':
      return '\x1b[32m'; // Green
    case 'needs-improvement':
      return '\x1b[33m'; // Yellow
    case 'poor':
      return '\x1b[31m'; // Red
    default:
      return '\x1b[0m';
  }
}

/**
 * Send metric to analytics
 */
async function sendToAnalytics(metric: WebVitalMetric, endpoint?: string): Promise<void> {
  if (!endpoint) return;

  try {
    // Use sendBeacon for reliability
    const body = JSON.stringify({
      ...metric,
      page: window.location.pathname,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      connection: (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, body);
    } else {
      await fetch(endpoint, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      });
    }
  } catch (error) {
    console.error('[Web Vitals] Failed to send metric:', error);
  }
}

/**
 * Handler for web vitals metrics
 */
function handleMetric(metric: Metric, config: WebVitalsConfig): void {
  const webVitalMetric: WebVitalMetric = {
    name: metric.name as MetricName,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType || 'unknown',
  };

  metricsStore.push(webVitalMetric);

  // Debug logging
  if (config.debug) {
    const color = getRatingColor(metric.rating);
    const reset = '\x1b[0m';
    const formattedValue = formatMetricValue(metric.name as MetricName, metric.value);
    
    console.log(
      `${color}[Web Vitals]${reset} ${metric.name}: ${formattedValue} (${metric.rating})`
    );
  }

  // Send to analytics
  if (config.analyticsEndpoint) {
    sendToAnalytics(webVitalMetric, config.analyticsEndpoint);
  }

  // Dispatch custom event for other components to listen
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('web-vital', { detail: webVitalMetric })
    );
  }
}

/**
 * Initialize web vitals reporting
 */
export function reportWebVitals(config: WebVitalsConfig = {}): void {
  const mergedConfig = { ...defaultConfig, ...config };

  // Sample rate check
  if (Math.random() > (mergedConfig.sampleRate || 1)) {
    return;
  }

  // Cumulative Layout Shift
  onCLS((metric) => handleMetric(metric, mergedConfig));

  // Largest Contentful Paint
  onLCP((metric) => handleMetric(metric, mergedConfig));

  // First Contentful Paint
  onFCP((metric) => handleMetric(metric, mergedConfig));

  // Time to First Byte
  onTTFB((metric) => handleMetric(metric, mergedConfig));

  // Interaction to Next Paint (new metric replacing FID)
  onINP((metric) => handleMetric(metric, mergedConfig));
}

/**
 * Get all collected metrics
 */
export function getMetrics(): WebVitalMetric[] {
  return [...metricsStore];
}

/**
 * Get metrics summary
 */
export function getMetricsSummary(): Record<MetricName, WebVitalMetric | null> {
  const summary: Record<string, WebVitalMetric | null> = {
    CLS: null,
    FID: null,
    LCP: null,
    FCP: null,
    TTFB: null,
    INP: null,
  };

  metricsStore.forEach((metric) => {
    // Keep the latest value for each metric
    summary[metric.name] = metric;
  });

  return summary as Record<MetricName, WebVitalMetric | null>;
}

/**
 * Check if Core Web Vitals pass
 */
export function checkWebVitalsPass(): { pass: boolean; details: Record<string, boolean> } {
  const summary = getMetricsSummary();
  
  const details = {
    CLS: summary.CLS?.rating === 'good',
    LCP: summary.LCP?.rating === 'good',
    INP: summary.INP?.rating === 'good',
  };

  const pass = Object.values(details).every((v) => v !== false);

  return { pass, details };
}

// Thresholds for reference (as defined by Google)
export const WEB_VITALS_THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  LCP: { good: 2500, poor: 4000 }, // ms
  FCP: { good: 1800, poor: 3000 }, // ms
  TTFB: { good: 800, poor: 1800 }, // ms
  INP: { good: 200, poor: 500 }, // ms
};
