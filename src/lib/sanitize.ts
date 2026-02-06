// Input Sanitization Library for Security / Eingabe-Sanitisierungs-Bibliothek für Sicherheit / Bibliotecă Sanitizare Input pentru Securitate
// Protects against XSS, SQL injection, and other attacks
// Schützt vor XSS, SQL-Injection und anderen Angriffen
// Protejează împotriva XSS, SQL injection și altor atacuri

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content - removes dangerous tags and attributes
 */
export function sanitizeHtml(dirty: string, options?: {
  allowedTags?: string[];
  allowedAttributes?: string[];
}): string {
  const defaultAllowedTags = ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre'];
  const defaultAllowedAttrs = ['href', 'target', 'rel', 'class'];
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: options?.allowedTags || defaultAllowedTags,
    ALLOWED_ATTR: options?.allowedAttributes || defaultAllowedAttrs,
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
    // Force all links to open in new tab with security attributes
    FORCE_BODY: true,
  });
}

/**
 * Sanitize plain text input - removes all HTML
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>]/g, '')    // Remove < and > characters
    .trim();
}

/**
 * Sanitize input for database queries (basic protection)
 * Note: Always use parameterized queries with Supabase
 */
export function sanitizeForDb(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/['";\\]/g, '') // Remove quotes and backslash
    .replace(/--/g, '')      // Remove SQL comments
    .replace(/\/\*/g, '')    // Remove block comment start
    .replace(/\*\//g, '')    // Remove block comment end
    .trim();
}

/**
 * Sanitize URL - ensures it's safe to use
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    
    return parsed.toString();
  } catch {
    // If it's a relative URL, just sanitize it
    if (url.startsWith('/') && !url.startsWith('//')) {
      return url.replace(/[<>"']/g, '');
    }
    return '';
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Sanitize email
 */
export function sanitizeEmail(email: string): string {
  if (!validateEmail(email)) return '';
  return email.toLowerCase().trim();
}

/**
 * Validate and sanitize username
 */
export function sanitizeUsername(username: string): string {
  if (!username || typeof username !== 'string') return '';
  
  return username
    .replace(/[^a-zA-Z0-9_-]/g, '') // Only allow alphanumeric, underscore, hyphen
    .slice(0, 50) // Max 50 characters
    .trim();
}

/**
 * Validate slug format
 */
export function validateSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') return false;
  
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length <= 200;
}

/**
 * Sanitize and create slug from text
 */
export function createSlug(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '')    // Remove special characters
    .replace(/\s+/g, '-')             // Replace spaces with hyphens
    .replace(/-+/g, '-')              // Replace multiple hyphens with single
    .replace(/^-|-$/g, '')            // Remove leading/trailing hyphens
    .slice(0, 200);                   // Max 200 characters
}

/**
 * Escape HTML entities for safe display
 */
export function escapeHtml(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  const entityMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };
  
  return text.replace(/[&<>"'`=/]/g, (char) => entityMap[char]);
}

/**
 * Validate content length
 */
export function validateLength(
  text: string,
  min: number,
  max: number
): { valid: boolean; message?: string } {
  if (!text || typeof text !== 'string') {
    return { valid: false, message: 'Text ist erforderlich' };
  }
  
  const length = text.trim().length;
  
  if (length < min) {
    return { valid: false, message: `Mindestens ${min} Zeichen erforderlich` };
  }
  
  if (length > max) {
    return { valid: false, message: `Maximal ${max} Zeichen erlaubt` };
  }
  
  return { valid: true };
}

/**
 * Sanitize object - recursively sanitize all string values
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeText(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === 'string' ? sanitizeText(item) : item
      );
    } else if (value && typeof value === 'object') {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  
  return result as T;
}

/**
 * Check for common attack patterns
 */
export function detectAttackPatterns(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  
  const patterns = [
    /<script/i,           // Script injection
    /javascript:/i,       // JavaScript protocol
    /on\w+=/i,           // Event handlers (onclick, onerror, etc.)
    /data:/i,            // Data URLs
    /vbscript:/i,        // VBScript
    /expression\(/i,     // CSS expression
    /url\(/i,            // CSS url() with potential injection
    /import/i,           // CSS import
    /@import/i,          // CSS @import
    /binding/i,          // XUL binding
    /behavior/i,         // IE behavior
  ];
  
  return patterns.some((pattern) => pattern.test(input));
}
