// Performance Monitoring System / Performance-Überwachungssystem / Sistem Monitorizare Performanță
// Real-time performance tracking and error logging
// Echtzeit-Performance-Tracking und Fehlerprotokollierung
// Urmărire performanță în timp real și logare erori

import { reportWebVitals, type MetricName } from './webVitals';

// Use MetricName type from webVitals
type WebVitalName = MetricName;

// Types
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  page?: string;
  userAgent?: string;
  connection?: string;
}

export interface ErrorLog {
  id: string;
  message: string;
  stack?: string;
  url: string;
  line?: number;
  column?: number;
  timestamp: number;
  userAgent?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface ResourceTiming {
  name: string;
  type: string;
  duration: number;
  size: number;
  startTime: number;
}

// Configuration
const CONFIG = {
  endpoint: '/api/analytics/performance',
  errorEndpoint: '/api/analytics/errors',
  batchSize: 10,
  flushInterval: 30000, // 30 seconds
  sampleRate: 1.0, // 100% of users
  enableResourceTiming: true,
  enableLongTaskTracking: true,
};

// Metrics buffer
let metricsBuffer: PerformanceMetric[] = [];
let errorsBuffer: ErrorLog[] = [];

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring(): void {
  if (typeof window === 'undefined') return;

  // Check sample rate
  if (Math.random() > CONFIG.sampleRate) return;

  // Track Web Vitals via event listener
  reportWebVitals();
  
  // Listen for web-vital events from webVitals module
  window.addEventListener('web-vital', ((event: CustomEvent) => {
    const metric = event.detail;
    trackMetric({
      name: metric.name,
      value: metric.value,
      unit: getMetricUnit(metric.name as WebVitalName),
      timestamp: Date.now(),
      page: window.location.pathname,
    });
  }) as EventListener);

  // Track page load performance
  trackPageLoadPerformance();

  // Track resource timing
  if (CONFIG.enableResourceTiming) {
    trackResourceTiming();
  }

  // Track long tasks
  if (CONFIG.enableLongTaskTracking) {
    trackLongTasks();
  }

  // Set up error tracking
  setupErrorTracking();

  // Set up periodic flush
  setInterval(flushMetrics, CONFIG.flushInterval);

  // Flush on page unload
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushMetrics();
      flushErrors();
    }
  });
}

/**
 * Get metric unit
 */
function getMetricUnit(name: WebVitalName): string {
  const units: Record<WebVitalName, string> = {
    CLS: 'score',
    LCP: 'ms',
    FCP: 'ms',
    TTFB: 'ms',
    INP: 'ms',
  };
  return units[name] || 'ms';
}

/**
 * Track a performance metric
 */
export function trackMetric(metric: PerformanceMetric): void {
  metricsBuffer.push({
    ...metric,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    connection: getConnectionInfo(),
  });

  if (metricsBuffer.length >= CONFIG.batchSize) {
    flushMetrics();
  }
}

/**
 * Track page load performance
 */
function trackPageLoadPerformance(): void {
  if (!window.performance || !window.performance.timing) return;

  window.addEventListener('load', () => {
    // Wait for all resources to load
    setTimeout(() => {
      const timing = window.performance.timing;
      const now = Date.now();

      // DNS lookup time
      trackMetric({
        name: 'DNS',
        value: timing.domainLookupEnd - timing.domainLookupStart,
        unit: 'ms',
        timestamp: now,
        page: window.location.pathname,
      });

      // TCP connection time
      trackMetric({
        name: 'TCP',
        value: timing.connectEnd - timing.connectStart,
        unit: 'ms',
        timestamp: now,
        page: window.location.pathname,
      });

      // Time to first byte
      trackMetric({
        name: 'TTFB',
        value: timing.responseStart - timing.requestStart,
        unit: 'ms',
        timestamp: now,
        page: window.location.pathname,
      });

      // DOM Interactive
      trackMetric({
        name: 'DOMInteractive',
        value: timing.domInteractive - timing.navigationStart,
        unit: 'ms',
        timestamp: now,
        page: window.location.pathname,
      });

      // DOM Complete
      trackMetric({
        name: 'DOMComplete',
        value: timing.domComplete - timing.navigationStart,
        unit: 'ms',
        timestamp: now,
        page: window.location.pathname,
      });

      // Page Load
      trackMetric({
        name: 'PageLoad',
        value: timing.loadEventEnd - timing.navigationStart,
        unit: 'ms',
        timestamp: now,
        page: window.location.pathname,
      });
    }, 0);
  });
}

/**
 * Track resource timing
 */
function trackResourceTiming(): void {
  if (!window.PerformanceObserver) return;

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries() as PerformanceResourceTiming[];

    entries.forEach((entry) => {
      // Only track slow resources (> 1s)
      if (entry.duration > 1000) {
        trackMetric({
          name: 'SlowResource',
          value: entry.duration,
          unit: 'ms',
          timestamp: Date.now(),
          page: window.location.pathname,
        });
      }
    });
  });

  try {
    observer.observe({ type: 'resource', buffered: true });
  } catch {
    // Observer not supported
  }
}

/**
 * Track long tasks (blocking main thread)
 */
function trackLongTasks(): void {
  if (!window.PerformanceObserver) return;

  try {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        trackMetric({
          name: 'LongTask',
          value: entry.duration,
          unit: 'ms',
          timestamp: Date.now(),
          page: window.location.pathname,
        });
      });
    });

    observer.observe({ type: 'longtask', buffered: true });
  } catch {
    // Long task API not supported
  }
}

/**
 * Get connection info
 */
function getConnectionInfo(): string | undefined {
  if (typeof navigator === 'undefined') return undefined;

  const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection;

  if (!connection) return undefined;

  return `${connection.effectiveType || 'unknown'} (${connection.downlink || '?'}Mbps)`;
}

/**
 * Setup error tracking
 */
function setupErrorTracking(): void {
  // Global error handler
  window.addEventListener('error', (event) => {
    trackError({
      id: generateId(),
      message: event.message,
      stack: event.error?.stack,
      url: event.filename || window.location.href,
      line: event.lineno,
      column: event.colno,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
    });
  });

  // Unhandled promise rejection
  window.addEventListener('unhandledrejection', (event) => {
    trackError({
      id: generateId(),
      message: `Unhandled Promise Rejection: ${event.reason}`,
      stack: event.reason?.stack,
      url: window.location.href,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
    });
  });

  // Console error override (optional)
  const originalConsoleError = console.error;
  console.error = (...args) => {
    trackError({
      id: generateId(),
      message: args.map((a) => String(a)).join(' '),
      url: window.location.href,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      metadata: { type: 'console.error' },
    });
    originalConsoleError.apply(console, args);
  };
}

/**
 * Track an error
 */
export function trackError(error: ErrorLog): void {
  errorsBuffer.push(error);

  // Flush immediately for critical errors
  if (errorsBuffer.length >= CONFIG.batchSize || error.message.includes('Critical')) {
    flushErrors();
  }
}

/**
 * Flush metrics to server
 */
async function flushMetrics(): Promise<void> {
  if (metricsBuffer.length === 0) return;

  const metrics = [...metricsBuffer];
  metricsBuffer = [];

  try {
    // Use sendBeacon for reliability
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        CONFIG.endpoint,
        JSON.stringify({ metrics })
      );
    } else {
      await fetch(CONFIG.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics }),
        keepalive: true,
      });
    }
  } catch (error) {
    console.error('Failed to send metrics:', error);
    // Re-add to buffer for retry
    metricsBuffer = [...metrics, ...metricsBuffer];
  }
}

/**
 * Flush errors to server
 */
async function flushErrors(): Promise<void> {
  if (errorsBuffer.length === 0) return;

  const errors = [...errorsBuffer];
  errorsBuffer = [];

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        CONFIG.errorEndpoint,
        JSON.stringify({ errors })
      );
    } else {
      await fetch(CONFIG.errorEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errors }),
        keepalive: true,
      });
    }
  } catch (error) {
    console.error('Failed to send errors:', error);
    errorsBuffer = [...errors, ...errorsBuffer];
  }
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Performance timing component
 */
export function measureComponentRender<T>(
  componentName: string,
  renderFn: () => T
): T {
  const start = performance.now();
  const result = renderFn();
  const duration = performance.now() - start;

  if (duration > 16) { // Longer than one frame (60fps)
    trackMetric({
      name: 'SlowComponent',
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      page: window.location.pathname,
    });
  }

  return result;
}

/**
 * Measure async operation
 */
export async function measureAsync<T>(
  operationName: string,
  operation: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  
  try {
    const result = await operation();
    const duration = performance.now() - start;

    trackMetric({
      name: operationName,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      page: typeof window !== 'undefined' ? window.location.pathname : undefined,
    });

    return result;
  } catch (error) {
    const duration = performance.now() - start;

    trackMetric({
      name: `${operationName}_Error`,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
    });

    throw error;
  }
}

/**
 * React hook for performance tracking
 */
import { useEffect, useRef } from 'react';

export function usePerformanceTracker(componentName: string): void {
  const renderCount = useRef(0);
  const mountTime = useRef(performance.now());

  useEffect(() => {
    const loadTime = performance.now() - mountTime.current;

    trackMetric({
      name: `${componentName}_Mount`,
      value: loadTime,
      unit: 'ms',
      timestamp: Date.now(),
      page: window.location.pathname,
    });

    return () => {
      const unmountTime = performance.now() - mountTime.current;
      trackMetric({
        name: `${componentName}_Lifetime`,
        value: unmountTime,
        unit: 'ms',
        timestamp: Date.now(),
      });
    };
  }, [componentName]);

  useEffect(() => {
    renderCount.current++;

    if (renderCount.current > 10) {
      console.warn(
        `Component ${componentName} has rendered ${renderCount.current} times. Consider optimization.`
      );
    }
  });
}

export default initPerformanceMonitoring;
