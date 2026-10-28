import { Request, Response, NextFunction } from 'express';
import { UserRole, UserStatus } from '@prisma/client';
import { verifyAccessToken, TokenPayload } from '../utils/tokens.js';
import { AppError } from '../errors/AppError.js';
import { prisma } from '../../config/database.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
        status: UserStatus;
        email?: string | null;
        phone?: string | null;
        name: string;
        donorProfileId?: string;
        hospitalId?: string;
        hospitalVerified?: boolean;
        bloodBankId?: string;
        bloodBankVerified?: boolean;
      };
    }
  }
}

export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('Authorization token is missing or malformed');
    }

    const token = authHeader.split(' ')[1];
    let payload: TokenPayload;

    try {
      payload = verifyAccessToken(token);
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw AppError.unauthorized('Session has expired. Please refresh your token.');
      }
      throw AppError.unauthorized('Invalid authorization token');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        donorProfile: { select: { id: true } },
        hospital: { select: { id: true, isVerified: true, status: true } },
        bloodBank: { select: { id: true, isVerified: true, status: true } },
      },
    });

    if (!user) {
      throw AppError.unauthorized('Account no longer exists');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw AppError.forbidden('Your account has been suspended by system administrator');
    }

    req.user = {
      id: user.id,
      role: user.role,
      status: user.status,
      email: user.email,
      phone: user.phone,
      name: user.name,
      donorProfileId: user.donorProfile?.id,
      hospitalId: user.hospital?.id,
      hospitalVerified: user.hospital ? (user.hospital.isVerified && user.hospital.status === 'VERIFIED') : undefined,
      bloodBankId: user.bloodBank?.id,
      bloodBankVerified: user.bloodBank ? (user.bloodBank.isVerified && user.bloodBank.status === 'VERIFIED') : undefined,
    };

    next();
  } catch (err) {
    next(err);
  }
}

export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        AppError.forbidden(`Access restricted to roles: [${allowedRoles.join(', ')}]`)
      );
    }

    next();
  };
}

export function requireVerifiedFacility(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(AppError.unauthorized('Authentication required'));
  }

  // System administrators bypass facility verification checks
  if (req.user.role === UserRole.ADMIN) {
    return next();
  }

  if (req.user.role === UserRole.HOSPITAL) {
    if (!req.user.hospitalVerified) {
      return next(
        AppError.forbidden(
          'Operational facility access is restricted. Your hospital account is pending administrator approval or has been suspended.'
        )
      );
    }
  }

  if (req.user.role === UserRole.BLOOD_BANK) {
    if (!req.user.bloodBankVerified) {
      return next(
        AppError.forbidden(
          'Operational facility access is restricted. Your blood bank account is pending administrator approval or has been suspended.'
        )
      );
    }
  }

  next();
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: {
          donorProfile: { select: { id: true } },
          hospital: { select: { id: true } },
          bloodBank: { select: { id: true } },
        },
      });

      if (user && user.status !== UserStatus.SUSPENDED) {
        req.user = {
          id: user.id,
          role: user.role,
          status: user.status,
          email: user.email,
          phone: user.phone,
          name: user.name,
          donorProfileId: user.donorProfile?.id,
          hospitalId: user.hospital?.id,
          bloodBankId: user.bloodBank?.id,
        };
      }
    }
  } catch {
    // Graceful fallback for optional auth
  }
  next();
}
