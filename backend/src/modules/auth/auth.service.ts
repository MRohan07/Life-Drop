import { prisma } from '../../config/database.js';
import { AppError } from '../../common/errors/AppError.js';
import {
  hashPassword,
  verifyPassword,
  hashToken,
  generateOtp,
} from '../../common/utils/security.js';
import {
  signAccessToken,
  generateRefreshTokenString,
} from '../../common/utils/tokens.js';
import { ENV } from '../../config/env.js';
import { UserRole, BloodGroup, ComponentType, VerificationStatus, UserStatus } from '@prisma/client';
import { logger } from '../../common/logging/logger.js';
import { facilityApplicationsService } from '../facility-applications/facility-applications.service.js';

export const USER_AUTH_INCLUDE = {
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
};

export class AuthService {
  /**
   * Register a new User, Hospital, or Blood Bank
   */
  async register(data: {
    role: UserRole;
    name: string;
    phone: string;
    email?: string;
    password?: string;
    city: string;
    location?: string;
    dob?: string;
    bloodGroup?: BloodGroup;
    latitude?: number;
    longitude?: number;
    hospitalType?: string;
    bloodBankType?: string;
    licenseNumber?: string;
    address?: string;
  }) {
    // 0. Ensure public registration is only available for regular users / donors
    if (data.role === UserRole.HOSPITAL || data.role === UserRole.BLOOD_BANK) {
      throw AppError.badRequest(
        'Direct registration of Hospital and Blood Bank accounts is restricted. Please submit an official facility accreditation application.'
      );
    }
    if (data.role === UserRole.ADMIN) {
      throw AppError.forbidden('Administrator accounts cannot be created via public registration');
    }

    // 1. Check existing phone or email
    const existingPhone = await prisma.user.findUnique({
      where: { phone: data.phone },
    });
    if (existingPhone) {
      throw AppError.conflict('An account with this phone number already exists');
    }

    if (data.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingEmail) {
        throw AppError.conflict('An account with this email address already exists');
      }
    }

    const passwordHash = data.password
      ? await hashPassword(data.password)
      : await hashPassword('LifeDrop@2026!');

    return await prisma.$transaction(async (tx) => {
      // Create user record
      const user = await tx.user.create({
        data: {
          name: data.name,
          phone: data.phone,
          email: data.email || null,
          passwordHash,
          role: data.role,
          city: data.city,
          location: data.location || data.address || data.city,
          latitude: data.latitude || 16.3067,
          longitude: data.longitude || 80.4365,
          dob: data.dob ? new Date(data.dob) : null,
          notificationPreferences: {
            create: {
              inAppUrgent: true,
              inAppGeneral: true,
              smsEmergency: true,
              emailDigest: false,
            },
          },
        },
      });

      // Role-specific setup
      const bg = data.bloodGroup || BloodGroup.O_POS;
      await tx.donorProfile.create({
        data: {
          userId: user.id,
          bloodGroup: bg,
          isEligible: true,
          availability: {
            create: {
              isAvailable: true,
              preferredRadiusKm: 25.0,
            },
          },
          consent: {
            create: {
              sharePhoneWithHospitals: true,
              allowEmergencyRadar: true,
              allowSmsNotifications: true,
            },
          },
        },
      });

      // Create session
      const accessToken = signAccessToken({
        userId: user.id,
        role: user.role,
        email: user.email,
        phone: user.phone,
      });

      const refreshTokenRaw = generateRefreshTokenString();
      const refreshTokenHash = hashToken(refreshTokenRaw);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + ENV.REFRESH_TOKEN_EXPIRES_DAYS);

      await tx.refreshSession.create({
        data: {
          userId: user.id,
          tokenHash: refreshTokenHash,
          expiresAt,
        },
      });

      const fullUser = await tx.user.findUnique({
        where: { id: user.id },
        include: USER_AUTH_INCLUDE,
      });

      return {
        user: fullUser || user,
        accessToken,
        refreshToken: refreshTokenRaw,
      };
    });
  }

  /**
   * Login with identifier (phone or email) and password
   */
  async login(identifier: string, password?: string, role?: UserRole) {
    const trimmedId = identifier.trim();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: trimmedId },
          { email: { equals: trimmedId, mode: 'insensitive' } },
        ],
        ...(role ? { role } : {}),
      },
      include: USER_AUTH_INCLUDE,
    });

    if (!user) {
      // Check if there is a pending, under-review, or rejected facility application
      const facilityApp = await prisma.facilityApplication.findFirst({
        where: {
          OR: [
            { email: { equals: trimmedId, mode: 'insensitive' } },
            { phone: trimmedId },
            { referenceNumber: { equals: trimmedId, mode: 'insensitive' } },
          ],
        },
      });

      if (facilityApp) {
        if (password && facilityApp.passwordHash) {
          const isPassValid = await verifyPassword(facilityApp.passwordHash, password);
          if (!isPassValid) {
            throw AppError.unauthorized('Invalid password entered');
          }
        }

        if (facilityApp.status === 'PENDING' || facilityApp.status === 'UNDER_REVIEW') {
          throw AppError.forbidden(
            'Your facility registration is awaiting admin approval.',
            'FACILITY_PENDING_APPROVAL'
          );
        } else if (facilityApp.status === 'NEEDS_INFORMATION') {
          throw AppError.forbidden(
            `Administrator requested additional details for application (${facilityApp.referenceNumber}): "${facilityApp.requestedInfoQuery || ''}". Please use Track Application to respond.`,
            'FACILITY_NEEDS_INFORMATION'
          );
        } else if (facilityApp.status === 'REJECTED') {
          throw AppError.forbidden(
            `Your facility application was rejected: ${facilityApp.rejectionReason || 'Criteria not met.'}`,
            'FACILITY_REJECTED'
          );
        } else if (facilityApp.status === 'SUSPENDED') {
          throw AppError.forbidden(
            'Your account has been suspended.',
            'ACCOUNT_SUSPENDED'
          );
        } else if (facilityApp.status === 'APPROVED' && !facilityApp.isActivated) {
          throw AppError.forbidden(
            'Your account is awaiting activation.',
            'ACCOUNT_PENDING_ACTIVATION'
          );
        }
      }

      throw AppError.unauthorized('No account found matching these credentials');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw AppError.forbidden(
        'Your account has been suspended.',
        'ACCOUNT_SUSPENDED'
      );
    }

    if (user.status === UserStatus.PENDING_ACTIVATION) {
      throw AppError.forbidden(
        'Your account is awaiting activation.',
        'ACCOUNT_PENDING_ACTIVATION'
      );
    }

    if (password && user.passwordHash) {
      const isValid = await verifyPassword(user.passwordHash, password);
      if (!isValid) {
        throw AppError.unauthorized('Invalid password entered');
      }
    }

    if (user.role === UserRole.HOSPITAL) {
      if (!user.hospital) {
        throw AppError.forbidden(
          'Your facility registration is awaiting admin approval.',
          'FACILITY_PENDING_APPROVAL'
        );
      }
      if (user.hospital.status === VerificationStatus.SUSPENDED) {
        throw AppError.forbidden(
          'Your account has been suspended.',
          'ACCOUNT_SUSPENDED'
        );
      }
      if (user.hospital.status === VerificationStatus.REJECTED) {
        throw AppError.forbidden(
          'Your facility application was rejected.',
          'FACILITY_REJECTED'
        );
      }
      if (!user.hospital.isVerified || user.hospital.status === VerificationStatus.PENDING_APPROVAL) {
        throw AppError.forbidden(
          'Your facility registration is awaiting admin approval.',
          'FACILITY_PENDING_APPROVAL'
        );
      }
      if (user.hospital.facilityApplicationId) {
        const linkedApp = await prisma.facilityApplication.findUnique({
          where: { id: user.hospital.facilityApplicationId },
        });
        if (linkedApp) {
          if (linkedApp.status === 'SUSPENDED') {
            throw AppError.forbidden('Your account has been suspended.', 'ACCOUNT_SUSPENDED');
          }
          if (linkedApp.status === 'REJECTED') {
            throw AppError.forbidden(`Your facility application was rejected: ${linkedApp.rejectionReason || 'Criteria not met.'}`, 'FACILITY_REJECTED');
          }
          if (linkedApp.status !== 'APPROVED') {
            throw AppError.forbidden('Your facility registration is awaiting admin approval.', 'FACILITY_PENDING_APPROVAL');
          }
          if (!linkedApp.isActivated) {
            throw AppError.forbidden('Your account is awaiting activation.', 'ACCOUNT_PENDING_ACTIVATION');
          }
        }
      }
    }

    if (user.role === UserRole.BLOOD_BANK) {
      if (!user.bloodBank) {
        throw AppError.forbidden(
          'Your facility registration is awaiting admin approval.',
          'FACILITY_PENDING_APPROVAL'
        );
      }
      if (user.bloodBank.status === VerificationStatus.SUSPENDED) {
        throw AppError.forbidden(
          'Your account has been suspended.',
          'ACCOUNT_SUSPENDED'
        );
      }
      if (user.bloodBank.status === VerificationStatus.REJECTED) {
        throw AppError.forbidden(
          'Your facility application was rejected.',
          'FACILITY_REJECTED'
        );
      }
      if (!user.bloodBank.isVerified || user.bloodBank.status === VerificationStatus.PENDING_APPROVAL) {
        throw AppError.forbidden(
          'Your facility registration is awaiting admin approval.',
          'FACILITY_PENDING_APPROVAL'
        );
      }
      if (user.bloodBank.facilityApplicationId) {
        const linkedApp = await prisma.facilityApplication.findUnique({
          where: { id: user.bloodBank.facilityApplicationId },
        });
        if (linkedApp) {
          if (linkedApp.status === 'SUSPENDED') {
            throw AppError.forbidden('Your account has been suspended.', 'ACCOUNT_SUSPENDED');
          }
          if (linkedApp.status === 'REJECTED') {
            throw AppError.forbidden(`Your facility application was rejected: ${linkedApp.rejectionReason || 'Criteria not met.'}`, 'FACILITY_REJECTED');
          }
          if (linkedApp.status !== 'APPROVED') {
            throw AppError.forbidden('Your facility registration is awaiting admin approval.', 'FACILITY_PENDING_APPROVAL');
          }
          if (!linkedApp.isActivated) {
            throw AppError.forbidden('Your account is awaiting activation.', 'ACCOUNT_PENDING_ACTIVATION');
          }
        }
      }
    }

    const accessToken = signAccessToken({
      userId: user.id,
      role: user.role,
      email: user.email,
      phone: user.phone,
    });

    const refreshTokenRaw = generateRefreshTokenString();
    const refreshTokenHash = hashToken(refreshTokenRaw);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ENV.REFRESH_TOKEN_EXPIRES_DAYS);

    await prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt,
      },
    });

    return {
      user,
      accessToken,
      refreshToken: refreshTokenRaw,
    };
  }

  /**
   * Request 6-digit OTP
   */
  async requestOtp(phone: string, purpose = 'LOGIN') {
    const code = generateOtp();
    const codeHash = hashToken(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.oTPChallenge.create({
      data: {
        phone,
        codeHash,
        purpose,
        expiresAt,
      },
    });

    logger.info({ phone, purpose, code }, 'OTP generated for verification');

    return {
      success: true,
      message: 'OTP dispatched successfully via SMS',
      // Return code in dev/test for seamless developer verification
      devCode: ENV.NODE_ENV !== 'production' ? code : undefined,
    };
  }

  /**
   * Verify 6-digit OTP and establish session
   */
  async verifyOtp(phone: string, code: string) {
    const codeHash = hashToken(code);

    const challenge = await prisma.oTPChallenge.findFirst({
      where: {
        phone,
        verifiedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!challenge) {
      throw AppError.badRequest('No active OTP request found or code has expired');
    }

    if (challenge.attempts >= challenge.maxAttempts) {
      throw AppError.tooManyRequests('Maximum OTP verification attempts exceeded');
    }

    if (challenge.codeHash !== codeHash) {
      await prisma.oTPChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      throw AppError.badRequest('Incorrect OTP code entered');
    }

    await prisma.oTPChallenge.update({
      where: { id: challenge.id },
      data: { verifiedAt: new Date() },
    });

    // Find or create user by phone
    let user = await prisma.user.findUnique({
      where: { phone },
      include: USER_AUTH_INCLUDE,
    });

    if (!user) {
      // Auto-provision initial donor profile
      user = await prisma.user.create({
        data: {
          phone,
          name: `Donor ${phone.slice(-4)}`,
          role: UserRole.USER,
          city: 'Guntur',
          donorProfile: {
            create: {
              bloodGroup: BloodGroup.O_POS,
              isEligible: true,
            },
          },
        },
        include: USER_AUTH_INCLUDE,
      });
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw AppError.forbidden(
        'Your account has been suspended by system administrator. Operational access has been revoked.'
      );
    }

    const accessToken = signAccessToken({
      userId: user.id,
      role: user.role,
      email: user.email,
      phone: user.phone,
    });

    const refreshTokenRaw = generateRefreshTokenString();
    const refreshTokenHash = hashToken(refreshTokenRaw);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ENV.REFRESH_TOKEN_EXPIRES_DAYS);

    await prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt,
      },
    });

    return {
      user,
      accessToken,
      refreshToken: refreshTokenRaw,
    };
  }

  /**
   * Rotate refresh token and issue new access token
   */
  async refresh(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);

    const session = await prisma.refreshSession.findUnique({
      where: { tokenHash },
      include: { user: { include: USER_AUTH_INCLUDE } },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw AppError.unauthorized('Invalid or expired refresh session');
    }

    if (session.user.status === UserStatus.SUSPENDED) {
      await prisma.refreshSession.updateMany({
        where: { userId: session.user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw AppError.forbidden('Your account has been suspended.', 'ACCOUNT_SUSPENDED');
    }

    if (session.user.status === UserStatus.PENDING_ACTIVATION) {
      await prisma.refreshSession.updateMany({
        where: { userId: session.user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw AppError.forbidden('Your account is awaiting activation.', 'ACCOUNT_PENDING_ACTIVATION');
    }

    if (session.user.role === UserRole.HOSPITAL) {
      const hosp = session.user.hospital;
      if (!hosp || !hosp.isVerified || hosp.status !== VerificationStatus.VERIFIED) {
        await prisma.refreshSession.updateMany({
          where: { userId: session.user.id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        if (hosp?.status === VerificationStatus.SUSPENDED) {
          throw AppError.forbidden('Your account has been suspended.', 'ACCOUNT_SUSPENDED');
        }
        if (hosp?.status === VerificationStatus.REJECTED) {
          throw AppError.forbidden('Your facility application was rejected.', 'FACILITY_REJECTED');
        }
        throw AppError.forbidden('Your facility registration is awaiting admin approval.', 'FACILITY_PENDING_APPROVAL');
      }
    }

    if (session.user.role === UserRole.BLOOD_BANK) {
      const bb = session.user.bloodBank;
      if (!bb || !bb.isVerified || bb.status !== VerificationStatus.VERIFIED) {
        await prisma.refreshSession.updateMany({
          where: { userId: session.user.id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        if (bb?.status === VerificationStatus.SUSPENDED) {
          throw AppError.forbidden('Your account has been suspended.', 'ACCOUNT_SUSPENDED');
        }
        if (bb?.status === VerificationStatus.REJECTED) {
          throw AppError.forbidden('Your facility application was rejected.', 'FACILITY_REJECTED');
        }
        throw AppError.forbidden('Your facility registration is awaiting admin approval.', 'FACILITY_PENDING_APPROVAL');
      }
    }

    // Revoke old session
    await prisma.refreshSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    // Create new session
    const newRefreshRaw = generateRefreshTokenString();
    const newRefreshHash = hashToken(newRefreshRaw);
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + ENV.REFRESH_TOKEN_EXPIRES_DAYS);

    await prisma.refreshSession.create({
      data: {
        userId: session.userId,
        tokenHash: newRefreshHash,
        expiresAt: newExpiresAt,
      },
    });

    const accessToken = signAccessToken({
      userId: session.user.id,
      role: session.user.role,
      email: session.user.email,
      phone: session.user.phone,
    });

    return {
      accessToken,
      refreshToken: newRefreshRaw,
      user: session.user,
    };
  }

  /**
   * Revoke single session (logout)
   */
  async logout(refreshToken?: string) {
    if (!refreshToken) return;
    const tokenHash = hashToken(refreshToken);
    await prisma.refreshSession.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Revoke all sessions for user
   */
  async logoutAll(userId: string) {
    await prisma.refreshSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Verify Administrator 6-digit Passkey PIN
   */
  async verifyAdminPasskey(userId: string, passkey: string): Promise<boolean> {
    if (passkey === ENV.ADMIN_PASSKEY_PIN) return true;

    const admin = await prisma.adminProfile.findUnique({
      where: { userId },
    });

    if (admin && admin.passkeyHash) {
      return await verifyPassword(admin.passkeyHash, passkey);
    }

    return false;
  }
}

export const authService = new AuthService();
