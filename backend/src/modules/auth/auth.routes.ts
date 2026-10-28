import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validateRequest } from '../../common/middleware/validate.middleware.js';
import {
  RegisterUserSchema,
  LoginSchema,
  OtpRequestSchema,
  OtpVerifySchema,
  RefreshTokenSchema,
  AdminPasskeySchema,
} from './auth.schema.js';
import { authLimiter, otpLimiter } from '../../common/middleware/rateLimiter.js';
import { authenticateUser, authorizeRoles } from '../../common/middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

const router = Router();

router.post(
  '/register',
  authLimiter,
  validateRequest({ body: RegisterUserSchema }),
  authController.register
);

router.post(
  '/login',
  authLimiter,
  validateRequest({ body: LoginSchema }),
  authController.login
);

router.post(
  '/otp/request',
  otpLimiter,
  validateRequest({ body: OtpRequestSchema }),
  authController.requestOtp
);

router.post(
  '/otp/verify',
  authLimiter,
  validateRequest({ body: OtpVerifySchema }),
  authController.verifyOtp
);

router.post(
  '/refresh',
  validateRequest({ body: RefreshTokenSchema }),
  authController.refresh
);

router.post('/logout', authController.logout);

router.post('/logout-all', authenticateUser, authController.logoutAll);

router.get('/me', authenticateUser, authController.getMe);

router.post(
  '/admin-passkey',
  authenticateUser,
  authorizeRoles(UserRole.ADMIN),
  validateRequest({ body: AdminPasskeySchema }),
  authController.verifyAdminPasskey
);

export const authRoutes = router;
