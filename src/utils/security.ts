/* @module: security — Client-side URL sanitization and privacy masking utilities */

/**
 * Sanitizes external URLs to prevent DOM-based XSS (e.g. javascript: URLs).
 * Strictly allows only http: and https: protocols.
 */
export const sanitizeUrl = (url?: string, fallback: string = '#'): string => {
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();

  // Block javascript:, vbscript:, data: text/html, etc.
  if (/^(javascript|vbscript|data):/i.test(trimmed)) {
    return fallback;
  }

  // Ensure valid http or https URL
  try {
    const parsed = new URL(trimmed, window.location.origin);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return trimmed;
    }
  } catch (_) {
    // If not a full URL, ensure it starts with / or #
    if (trimmed.startsWith('/') || trimmed.startsWith('#')) {
      return trimmed;
    }
  }

  return fallback;
};

/**
 * Validates if a user-supplied string is a legitimate web URL (http:// or https://)
 */
export const isValidWebUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

/**
 * Masks sensitive phone numbers for UI privacy (e.g. +91 98480 •••••)
 */
export const maskPhoneNumber = (phone?: string): string => {
  if (!phone || typeof phone !== 'string') return '••••••••••';
  const clean = phone.trim();
  if (clean.length < 8) return '••••••••';
  const visiblePrefix = clean.slice(0, Math.max(clean.length - 5, 3));
  return `${visiblePrefix} •••••`;
};
