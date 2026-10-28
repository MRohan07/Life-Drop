import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { prisma } from '../../config/database.js';
import { AppError } from '../../common/errors/AppError.js';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({
        status: 'success',
        message: 'Account registered successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { identifier, email, phone, password, role } = req.body;
      const targetIdentifier = identifier || email || phone;
      const result = await authService.login(targetIdentifier, password, role);
      res.status(200).json({
        status: 'success',
        message: 'Logged in successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async requestOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone, purpose } = req.body;
      const result = await authService.requestOtp(phone, purpose);
      res.status(200).json({
        status: 'success',
        message: result.message,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone, code } = req.body;
      const result = await authService.verifyOtp(phone, code);
      res.status(200).json({
        status: 'success',
        message: 'OTP verified successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.body.refreshToken || req.cookies?.refreshToken;
      if (!token) {
        throw AppError.unauthorized('Refresh token is required');
      }
      const result = await authService.refresh(token);
      res.status(200).json({
        status: 'success',
        message: 'Token refreshed successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.body.refreshToken || req.cookies?.refreshToken;
      await authService.logout(token);
      res.status(200).json({
        status: 'success',
        message: 'Logged out successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  async logoutAll(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      await authService.logoutAll(req.user.id);
      res.status(200).json({
        status: 'success',
        message: 'All active sessions have been revoked',
      });
    } catch (err) {
      next(err);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          donorProfile: {
            include: {
              availability: true,
              consent: true,
            },
          },
          hospital: true,
          bloodBank: {
            include: {
              inventoryBalances: true,
            },
          },
          adminProfile: true,
          notificationPreferences: true,
        },
      });

      if (!user) throw AppError.notFound('User not found');

      res.status(200).json({
        status: 'success',
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  }

  async verifyAdminPasskey(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const { passkey } = req.body;
      const isValid = await authService.verifyAdminPasskey(req.user.id, passkey);

      if (!isValid) {
        throw AppError.unauthorized('Invalid Admin Passkey PIN entered');
      }

      res.status(200).json({
        status: 'success',
        message: 'Admin authorization confirmed',
        data: { verified: true },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
