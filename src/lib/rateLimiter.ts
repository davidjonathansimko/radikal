// Rate Limiter Library for API Protection / Rate-Limiter-Bibliothek für API-Schutz / Bibliotecă Rate Limiter pentru protecție API
// Prevents abuse by limiting the number of requests per time window
// Verhindert Missbrauch durch Begrenzung der Anzahl der Anfragen pro Zeitfenster
// Previne abuzul prin limitarea numărului de cereri pe fereastră de timp

interface RateLimitRecord {
  count: number;
  resetTime: number;
  firstRequest: number;
}

interface RateLimitConfig {
  maxRequests: number;      // Maximum requests allowed
  windowMs: number;         // Time window in milliseconds
  blockDurationMs?: number; // How long to block after limit exceeded
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetIn: number;          // Milliseconds until reset
  blocked: boolean;
}

// In-memory store for rate limiting (for serverless, consider Redis/Upstash)
const rateLimitStore = new Map<string, RateLimitRecord>();
const blockedIPs = new Map<string, number>(); // IP -> unblock time

// Presets for different use cases
export const RateLimitPresets = {
  // Standard API endpoints
  api: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 req/min
  
  // Authentication endpoints (stricter)
  auth: { maxRequests: 5, windowMs: 15 * 60 * 1000, blockDurationMs: 30 * 60 * 1000 }, // 5 req/15min
  
  // Contact form
  contact: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 req/hour
  
  // Newsletter subscription
  newsletter: { maxRequests: 2, windowMs: 60 * 60 * 1000 }, // 2 req/hour
  
  // Comments
  comments: { maxRequests: 10, windowMs: 5 * 60 * 1000 }, // 10 req/5min
  
  // Search
  search: { maxRequests: 30, windowMs: 60 * 1000 }, // 30 req/min
  
  // Admin endpoints
  admin: { maxRequests: 50, windowMs: 60 * 1000 }, // 50 req/min
};

/**
 * Check rate limit for an identifier (usually IP or user ID)
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig = RateLimitPresets.api
): RateLimitResult {
  const now = Date.now();
  
  // Check if IP is blocked
  const blockedUntil = blockedIPs.get(identifier);
  if (blockedUntil && now < blockedUntil) {
    return {
      success: false,
      remaining: 0,
      resetIn: blockedUntil - now,
      blocked: true,
    };
  } else if (blockedUntil) {
    blockedIPs.delete(identifier);
  }

  const record = rateLimitStore.get(identifier);

  // If no record or window expired, create new record
  if (!record || now > record.resetTime) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetTime: now + config.windowMs,
      firstRequest: now,
    };
    rateLimitStore.set(identifier, newRecord);
    
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
      blocked: false,
    };
  }

  // Check if limit exceeded
  if (record.count >= config.maxRequests) {
    // Apply block if configured
    if (config.blockDurationMs) {
      blockedIPs.set(identifier, now + config.blockDurationMs);
    }
    
    return {
      success: false,
      remaining: 0,
      resetIn: record.resetTime - now,
      blocked: !!config.blockDurationMs,
    };
  }

  // Increment counter
  record.count++;
  
  return {
    success: true,
    remaining: config.maxRequests - record.count,
    resetIn: record.resetTime - now,
    blocked: false,
  };
}

/**
 * Get rate limit headers for API responses
 */
export function getRateLimitHeaders(
  identifier: string,
  config: RateLimitConfig = RateLimitPresets.api
): Record<string, string> {
  const result = rateLimit(identifier, config);
  
  return {
    'X-RateLimit-Limit': String(config.maxRequests),
    'X-RateLimit-Remaining': String(Math.max(0, result.remaining)),
    'X-RateLimit-Reset': String(Math.ceil(result.resetIn / 1000)),
  };
}

/**
 * Middleware-style rate limiter for API routes
 */
export async function withRateLimit(
  request: Request,
  config: RateLimitConfig = RateLimitPresets.api
): Promise<{ allowed: boolean; response?: Response }> {
  // Get IP from headers (works with Vercel)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0]?.trim() || 'anonymous';
  
  const result = rateLimit(ip, config);
  
  if (!result.success) {
    const response = new Response(
      JSON.stringify({
        error: 'Too Many Requests',
        message: result.blocked 
          ? 'Sie wurden vorübergehend blockiert. Bitte versuchen Sie es später erneut.'
          : 'Zu viele Anfragen. Bitte warten Sie einen Moment.',
        retryAfter: Math.ceil(result.resetIn / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil(result.resetIn / 1000)),
          ...getRateLimitHeaders(ip, config),
        },
      }
    );
    
    return { allowed: false, response };
  }
  
  return { allowed: true };
}

/**
 * Clean up expired entries (call periodically)
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  
  // Clean rate limit records
  Array.from(rateLimitStore.entries()).forEach(([key, record]) => {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  });
  
  // Clean blocked IPs
  Array.from(blockedIPs.entries()).forEach(([ip, unblockTime]) => {
    if (now > unblockTime) {
      blockedIPs.delete(ip);
    }
  });
}

// Auto-cleanup every 5 minutes (in development)
if (typeof setInterval !== 'undefined' && process.env.NODE_ENV === 'development') {
  setInterval(cleanupRateLimits, 5 * 60 * 1000);
}
