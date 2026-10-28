import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ENV } from '../../config/env.js';
import { UserRole } from '@prisma/client';

export interface TokenPayload {
  userId: string;
  role: UserRole;
  email?: string | null;
  phone?: string | null;
}

/**
 * Signs a short-lived access JWT
 */
export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, ENV.JWT_ACCESS_SECRET, {
    expiresIn: ENV.JWT_ACCESS_EXPIRES_IN as any,
  });
}

/**
 * Verifies access JWT
 */
export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ENV.JWT_ACCESS_SECRET) as TokenPayload;
}

/**
 * Generates random high-entropy refresh token string
 */
export function generateRefreshTokenString(): string {
  return crypto.randomBytes(40).toString('hex');
}
