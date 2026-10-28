import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5001', 10),
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://lifedrop_user:lifedrop_secure_pass_2026@localhost:5432/lifedrop?schema=public',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  CORS_ORIGINS: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'lifedrop_access_token_super_secret_key_2026_change_in_production',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  REFRESH_TOKEN_EXPIRES_DAYS: parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7', 10),
  ADMIN_PASSKEY_PIN: process.env.ADMIN_PASSKEY_PIN || '901234',
  SMS_PROVIDER: process.env.SMS_PROVIDER || 'mock',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};
