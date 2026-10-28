import argon2 from 'argon2';
import crypto from 'crypto';

/**
 * Hash password using Argon2id
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3,
    parallelism: 1,
  });
}

/**
 * Verify password against Argon2id hash
 */
export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

/**
 * Hash short-lived token or OTP using SHA-256 for fast lookup
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate 6-digit numeric OTP
 */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Mask sensitive phone number for privacy
 */
export function maskPhoneNumber(phone?: string | null): string {
  if (!phone || typeof phone !== 'string') return '••••••••••';
  const clean = phone.trim();
  if (clean.length < 8) return '••••••••';
  const visiblePrefix = clean.slice(0, Math.max(clean.length - 5, 3));
  return `${visiblePrefix} •••••`;
}

/**
 * Mask coordinates slightly for public non-coordinating viewers (~1 km jitter)
 */
export function maskCoordinates(lat: number, lng: number): { latitude: number; longitude: number } {
  const latOffset = (Math.random() - 0.5) * 0.008;
  const lngOffset = (Math.random() - 0.5) * 0.008;
  return {
    latitude: Math.round((lat + latOffset) * 1000) / 1000,
    longitude: Math.round((lng + lngOffset) * 1000) / 1000,
  };
}
