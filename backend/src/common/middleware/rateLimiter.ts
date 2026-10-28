import rateLimit from 'express-rate-limit';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    statusCode: 429,
    message: 'Too many requests from this IP, please try again in 15 minutes',
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 login / register attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    statusCode: 429,
    message: 'Too many authentication attempts, please try again in 15 minutes',
  },
});

export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // 10 OTP requests per 10 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    statusCode: 429,
    message: 'Too many OTP requests, please wait before requesting another code',
  },
});
