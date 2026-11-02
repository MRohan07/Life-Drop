import crypto from 'crypto';
import { prisma } from '../../config/database.js';
import { AppError } from '../../common/errors/AppError.js';
import {
  ApplicationStatus,
  FacilityType,
  UserRole,
  UserStatus,
  VerificationStatus,
  BloodGroup,
  ComponentType,
} from '@prisma/client';
import { hashPassword, verifyPassword, hashToken } from '../../common/utils/security.js';
import { signAccessToken, generateRefreshTokenString } from '../../common/utils/tokens.js';
import { ENV } from '../../config/env.js';

export class FacilityApplicationsService {
  /**
   * Submit a new hospital or blood bank registration application
   */
  async submitApplication(data: {
    facilityType: 'HOSPITAL' | 'BLOOD_BANK';
    name: string;
    category?: string;
    phone: string;
    email: string;
    address: string;
    area?: string;
    city: string;
    state?: string;
    pinCode?: string;
    latitude?: number;
    longitude?: number;
    licenseNumber: string;
    registrationNumber?: string;
    issuingAuthority?: string;
    licenseDocUrl?: string;
    registrationCertUrl?: string;
    authorizedPersonName: string;
    authorizedPersonDesignation: string;
    authorizedPersonPhone: string;
    authorizedPersonEmail: string;
    password?: string;
    emergencyContact?: string;
    services?: string[];
    componentsAvailable?: string[];
    documents?: Array<{
      documentType: string;
      fileName: string;
      fileUrl: string;
      fileSize?: number;
      mimeType?: string;
    }>;
  }) {
    // 1. Check duplicate active applications with same email, phone, or licenseNumber
    const existingActiveApp = await prisma.facilityApplication.findFirst({
      where: {
        OR: [
          { email: data.email },
          { phone: data.phone },
          { licenseNumber: data.licenseNumber },
        ],
        status: { in: [ApplicationStatus.PENDING, ApplicationStatus.UNDER_REVIEW, ApplicationStatus.NEEDS_INFORMATION, ApplicationStatus.APPROVED] },
      },
    });

    if (existingActiveApp) {
      if (existingActiveApp.email === data.email) {
        throw AppError.conflict('An active facility application with this email address already exists.');
      }
      if (existingActiveApp.phone === data.phone) {
        throw AppError.conflict('An active facility application with this phone number already exists.');
      }
      if (existingActiveApp.licenseNumber === data.licenseNumber) {
        throw AppError.conflict('An active facility application with this license number already exists.');
      }
    }

    // 2. Check if an active registered User, Hospital, or BloodBank already has this email, phone, or license
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { phone: data.phone }],
      },
    });
    if (existingUser) {
      throw AppError.conflict('A registered account with this contact details already exists in LifeDrop.');
    }

    const existingHosp = await prisma.hospital.findFirst({
      where: {
        OR: [{ email: data.email }, { licenseNumber: data.licenseNumber }],
      },
    });
    if (existingHosp) {
      throw AppError.conflict('A registered hospital with this email or license number already exists.');
    }

    const existingBB = await prisma.bloodBank.findFirst({
      where: {
        OR: [{ email: data.email }, { licenseNumber: data.licenseNumber }],
      },
    });
    if (existingBB) {
      throw AppError.conflict('A registered blood bank with this email or license number already exists.');
    }

    // 3. Generate unique application reference number (e.g. APP-HOSP-2026-0001)
    const year = new Date().getFullYear();
    const typeCode = data.facilityType === 'HOSPITAL' ? 'HOSP' : 'BB';
    const count = await prisma.facilityApplication.count();
    const referenceNumber = `APP-${typeCode}-${year}-${String(count + 1).padStart(4, '0')}`;

    // Hash applicant password if provided
    const passwordHash = data.password ? await hashPassword(data.password) : null;

    // 4. Save in PostgreSQL with status PENDING
    return await prisma.$transaction(async (tx) => {
      const application = await tx.facilityApplication.create({
        data: {
          referenceNumber,
          facilityType: data.facilityType as FacilityType,
          name: data.name,
          category: data.category || 'Private',
          phone: data.phone,
          email: data.email,
          address: data.address,
          area: data.area || null,
          city: data.city,
          state: data.state || 'Andhra Pradesh',
          pinCode: data.pinCode || null,
          latitude: data.latitude || 16.3067,
          longitude: data.longitude || 80.4365,
          licenseNumber: data.licenseNumber,
          registrationNumber: data.registrationNumber || null,
          issuingAuthority: data.issuingAuthority || null,
          licenseDocUrl: data.licenseDocUrl || null,
          registrationCertUrl: data.registrationCertUrl || null,
          authorizedPersonName: data.authorizedPersonName,
          authorizedPersonDesignation: data.authorizedPersonDesignation,
          authorizedPersonPhone: data.authorizedPersonPhone,
          authorizedPersonEmail: data.authorizedPersonEmail,
          emergencyContact: data.emergencyContact || null,
          services: data.services || [],
          componentsAvailable: data.componentsAvailable || [],
          status: ApplicationStatus.PENDING,
          passwordHash,
          documents: {
            create: (data.documents || []).map((doc) => ({
              documentType: doc.documentType,
              fileName: doc.fileName,
              fileUrl: doc.fileUrl,
              fileSize: doc.fileSize,
              mimeType: doc.mimeType,
            })),
          },
        },
        include: {
          documents: true,
        },
      });

      // 5. Notify all Administrators in PostgreSQL
      try {
        const admins = await tx.user.findMany({
          where: { role: UserRole.ADMIN },
        });

        for (const admin of admins) {
          await tx.notification.create({
            data: {
              userId: admin.id,
              title: `New ${data.facilityType === 'HOSPITAL' ? 'Hospital' : 'Blood Bank'} Application`,
              message: `${data.name} (${referenceNumber}) submitted an accreditation application awaiting review.`,
              type: 'info',
              actionUrl: '/admin-applications',
            },
          });
        }

        // 6. Record Audit Log in PostgreSQL
        await tx.auditLog.create({
          data: {
            eventType: 'FACILITY_APPLICATION_SUBMITTED',
            actorId: data.authorizedPersonPhone || 'APPLICANT',
            actorRole: 'APPLICANT',
            description: `New ${data.facilityType} accreditation application submitted: ${data.name} (${referenceNumber})`,
            targetId: referenceNumber,
            targetType: data.facilityType,
            details: { referenceNumber, facilityName: data.name },
          },
        });
      } catch (logErr) {
        // Log error without failing application creation
        console.warn('Facility application notification/audit log warning:', logErr);
      }

      return application;
    });
  }

  /**
   * Public applicant status check by reference number and optional email
   */
  async getApplicationStatus(referenceNumber: string, email?: string) {
    const application = await prisma.facilityApplication.findUnique({
      where: { referenceNumber },
      include: {
        documents: {
          select: { id: true, documentType: true, fileName: true, uploadedAt: true },
        },
        reviews: {
          select: { id: true, action: true, toStatus: true, notes: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!application) {
      throw AppError.notFound('No facility application found with the provided reference number.');
    }

    if (email && application.email.toLowerCase() !== email.trim().toLowerCase()) {
      throw AppError.forbidden('The provided email does not match the application record.');
    }

    return {
      referenceNumber: application.referenceNumber,
      name: application.name,
      facilityType: application.facilityType,
      category: application.category,
      city: application.city,
      status: application.status,
      submittedDate: application.createdAt,
      requestedInfoQuery: application.status === ApplicationStatus.NEEDS_INFORMATION ? application.requestedInfoQuery : null,
      rejectionReason: application.status === ApplicationStatus.REJECTED ? application.rejectionReason : null,
      isActivated: application.isActivated,
      approvedAt: application.approvedAt,
      documentsCount: application.documents.length,
      recentReviews: application.reviews.slice(0, 5),
    };
  }

  /**
   * Hospital or Blood Bank checks status using Email / User ID and Password
   */
  async checkStatusWithCredentials(identifier: string, password?: string) {
    const trimmed = identifier.trim();
    const application = await prisma.facilityApplication.findFirst({
      where: {
        OR: [
          { referenceNumber: { equals: trimmed, mode: 'insensitive' } },
          { email: { equals: trimmed, mode: 'insensitive' } },
          { phone: { equals: trimmed } },
        ],
      },
      include: {
        reviews: {
          select: { id: true, action: true, toStatus: true, notes: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!application) {
      throw AppError.notFound('No facility application found matching this email, user ID, or reference number.');
    }

    if (password && application.passwordHash) {
      const isPassValid = await verifyPassword(application.passwordHash, password);
      if (!isPassValid) {
        throw AppError.unauthorized('Invalid password entered. Please enter the password you set during registration.');
      }
    }

    return {
      referenceNumber: application.referenceNumber,
      name: application.name,
      email: application.email,
      phone: application.phone,
      facilityType: application.facilityType,
      category: application.category,
      city: application.city,
      status: application.status,
      submittedDate: application.createdAt,
      requestedInfoQuery: application.status === ApplicationStatus.NEEDS_INFORMATION ? application.requestedInfoQuery : null,
      rejectionReason: application.status === ApplicationStatus.REJECTED ? application.rejectionReason : null,
      isActivated: application.isActivated,
      approvedAt: application.approvedAt,
      recentReviews: application.reviews,
      message:
        application.status === ApplicationStatus.APPROVED
          ? application.isActivated
            ? 'Your facility application is APPROVED and active! You can now log in directly with your email and password.'
            : 'Your facility application is APPROVED! Account activation is pending final reconciliation.'
          : application.status === ApplicationStatus.REJECTED
          ? `Your facility application was REJECTED: ${application.rejectionReason || 'Statutory criteria not met.'}`
          : application.status === ApplicationStatus.NEEDS_INFORMATION
          ? `Administrator requested additional information: "${application.requestedInfoQuery || ''}"`
          : 'Your facility application has been delivered to all platform administrators and is currently PENDING review.',
    };
  }

  /**
   * Applicant submits requested additional information
   */
  async submitApplicantInfo(
    referenceNumber: string,
    data: {
      responseNotes: string;
      additionalDocs?: Array<{
        documentType: string;
        fileName: string;
        fileUrl: string;
        fileSize?: number;
        mimeType?: string;
      }>;
    }
  ) {
    const application = await prisma.facilityApplication.findUnique({
      where: { referenceNumber },
    });

    if (!application) {
      throw AppError.notFound('Facility application not found.');
    }

    if (application.status !== ApplicationStatus.NEEDS_INFORMATION) {
      throw AppError.badRequest('Application is not currently awaiting additional information.');
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.facilityApplication.update({
        where: { id: application.id },
        data: {
          status: ApplicationStatus.UNDER_REVIEW,
          applicantResponseNotes: data.responseNotes,
          ...(data.additionalDocs && data.additionalDocs.length > 0
            ? {
                documents: {
                  create: data.additionalDocs.map((doc) => ({
                    documentType: doc.documentType,
                    fileName: doc.fileName,
                    fileUrl: doc.fileUrl,
                    fileSize: doc.fileSize,
                    mimeType: doc.mimeType,
                  })),
                },
              }
            : {}),
        },
        include: { documents: true },
      });

      return updated;
    });
  }

  /**
   * Admin lists applications with filters and pagination
   */
  async listApplications(filters: {
    status?: ApplicationStatus;
    facilityType?: FacilityType;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(100, filters.limit || 25));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.facilityType) where.facilityType = filters.facilityType;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { referenceNumber: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
        { licenseNumber: { contains: filters.search, mode: 'insensitive' } },
        { city: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [total, applications] = await Promise.all([
      prisma.facilityApplication.count({ where }),
      prisma.facilityApplication.findMany({
        where,
        include: {
          documents: { select: { id: true, documentType: true, fileName: true, fileUrl: true } },
          reviews: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: { admin: { select: { id: true, name: true } } },
          },
          approvedByAdmin: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      applications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Admin inspects full application details
   */
  async getApplicationById(id: string) {
    const application = await prisma.facilityApplication.findUnique({
      where: { id },
      include: {
        documents: true,
        reviews: {
          include: { admin: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: 'asc' },
        },
        approvedByAdmin: { select: { id: true, name: true, email: true } },
        createdUser: { select: { id: true, name: true, email: true, phone: true, role: true, status: true } },
        hospital: { select: { id: true, name: true, isVerified: true, status: true } },
        bloodBank: { select: { id: true, name: true, isVerified: true, status: true } },
      },
    });

    if (!application) {
      throw AppError.notFound('Facility application not found.');
    }

    return application;
  }

  /**
   * Admin marks application as UNDER_REVIEW
   */
  async markUnderReview(id: string, adminId: string, notes?: string) {
    const application = await prisma.facilityApplication.findUnique({ where: { id } });
    if (!application) throw AppError.notFound('Facility application not found.');

    if (
      application.status === ApplicationStatus.APPROVED ||
      application.status === ApplicationStatus.REJECTED ||
      application.status === ApplicationStatus.SUSPENDED
    ) {
      throw AppError.badRequest(`Cannot mark an application in '${application.status}' state as UNDER_REVIEW.`);
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.facilityApplication.update({
        where: { id },
        data: { status: ApplicationStatus.UNDER_REVIEW },
      });

      await tx.facilityApplicationReview.create({
        data: {
          applicationId: id,
          adminId,
          action: 'MARKED_UNDER_REVIEW',
          fromStatus: application.status,
          toStatus: ApplicationStatus.UNDER_REVIEW,
          notes: notes || 'Application marked as under review by administrator.',
        },
      });

      await tx.auditLog.create({
        data: {
          eventType: 'FACILITY_APPLICATION_REVIEWED',
          description: `Application ${application.referenceNumber} (${application.name}) marked as UNDER_REVIEW`,
          actorId: adminId,
          actorRole: 'ADMIN',
          targetId: id,
          targetType: 'FACILITY_APPLICATION',
          details: { referenceNumber: application.referenceNumber, fromStatus: application.status, toStatus: ApplicationStatus.UNDER_REVIEW },
        },
      });

      return updated;
    });
  }

  /**
   * Admin requests additional information from applicant
   */
  async requestInformation(id: string, adminId: string, query: string) {
    const application = await prisma.facilityApplication.findUnique({ where: { id } });
    if (!application) throw AppError.notFound('Facility application not found.');

    if (application.status === ApplicationStatus.APPROVED || application.status === ApplicationStatus.REJECTED) {
      throw AppError.badRequest(`Cannot request information for an application that is already ${application.status}.`);
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.facilityApplication.update({
        where: { id },
        data: {
          status: ApplicationStatus.NEEDS_INFORMATION,
          requestedInfoQuery: query,
        },
      });

      await tx.facilityApplicationReview.create({
        data: {
          applicationId: id,
          adminId,
          action: 'REQUESTED_INFO',
          fromStatus: application.status,
          toStatus: ApplicationStatus.NEEDS_INFORMATION,
          notes: query,
        },
      });

      await tx.auditLog.create({
        data: {
          eventType: 'FACILITY_APPLICATION_INFO_REQUESTED',
          description: `Administrator requested additional information for application ${application.referenceNumber}: "${query}"`,
          actorId: adminId,
          actorRole: 'ADMIN',
          targetId: id,
          targetType: 'FACILITY_APPLICATION',
          details: { referenceNumber: application.referenceNumber, query },
        },
      });

      return updated;
    });
  }

  /**
   * Admin rejects an application with a mandatory reason
   */
  async rejectApplication(id: string, adminId: string, reason: string) {
    const application = await prisma.facilityApplication.findUnique({ where: { id } });
    if (!application) throw AppError.notFound('Facility application not found.');

    if (application.isActivated) {
      throw AppError.badRequest('Cannot reject an application that has already completed account activation.');
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.facilityApplication.update({
        where: { id },
        data: {
          status: ApplicationStatus.REJECTED,
          rejectionReason: reason,
        },
      });

      await tx.facilityApplicationReview.create({
        data: {
          applicationId: id,
          adminId,
          action: 'REJECTED',
          fromStatus: application.status,
          toStatus: ApplicationStatus.REJECTED,
          notes: reason,
        },
      });

      await tx.auditLog.create({
        data: {
          eventType: 'FACILITY_APPLICATION_REJECTED',
          description: `Application ${application.referenceNumber} (${application.name}) rejected. Reason: ${reason}`,
          actorId: adminId,
          actorRole: 'ADMIN',
          targetId: id,
          targetType: 'FACILITY_APPLICATION',
          details: { referenceNumber: application.referenceNumber, reason },
        },
      });

      return updated;
    });
  }

  /**
   * Admin approves application and atomically activates the facility account
   */
  async approveApplication(id: string, adminId: string, notes?: string) {
    const application = await prisma.facilityApplication.findUnique({
      where: { id },
      include: {
        createdUser: {
          include: {
            hospital: true,
            bloodBank: true,
            facilityApplication: true,
          },
        },
        hospital: true,
        bloodBank: true,
      },
    });
    if (!application) throw AppError.notFound('Facility application not found.');

    if (application.status === ApplicationStatus.APPROVED && application.isActivated) {
      // Prevent duplicate facility accounts when an application is approved multiple times
      const existingUser = application.createdUser || (await prisma.user.findFirst({
        where: {
          OR: [
            { id: application.createdUserId || undefined },
            { email: { equals: application.email, mode: 'insensitive' } },
            { phone: application.phone },
          ],
        },
        include: { hospital: true, bloodBank: true },
      }));

      return {
        application,
        activationToken: application.activationToken,
        user: existingUser,
        hospital: application.hospital || existingUser?.hospital,
        bloodBank: application.bloodBank || existingUser?.bloodBank,
        message: 'Facility application is already approved and active.',
      };
    }

    if (application.status === ApplicationStatus.REJECTED) {
      throw AppError.badRequest('Cannot approve an application that has already been rejected.');
    }

    const expectedRole =
      application.facilityType === FacilityType.HOSPITAL ? UserRole.HOSPITAL : UserRole.BLOOD_BANK;

    // Generate high-entropy 64-character activation token for audit and activation records
    const activationToken = crypto.randomBytes(32).toString('hex');
    const activationTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    return await prisma.$transaction(async (tx) => {
      // 1. Check for conflicting user accounts with matching email, phone, or application.createdUserId
      const conflictingUsers = await tx.user.findMany({
        where: {
          OR: [
            { email: { equals: application.email, mode: 'insensitive' } },
            { phone: application.phone },
            ...(application.createdUserId ? [{ id: application.createdUserId }] : []),
          ],
        },
        include: {
          hospital: true,
          bloodBank: true,
          facilityApplication: true,
        },
      });

      let linkedUser: any = null;

      if (conflictingUsers.length > 1) {
        throw AppError.conflict(
          'Multiple conflicting user accounts match the application contact details.'
        );
      } else if (conflictingUsers.length === 1) {
        const existing = conflictingUsers[0];

        // Never attach an existing USER or ADMIN account to a facility application.
        // Only link an existing user if its role matches the application's facility type.
        if (existing.role !== expectedRole) {
          throw AppError.conflict(
            `A user account with this email or phone already exists with an incompatible role (${existing.role}). Direct attachment is prohibited.`
          );
        }

        // Never demote or modify an unrelated ACTIVE account belonging to another application.
        if (
          existing.status === UserStatus.ACTIVE &&
          existing.id !== application.createdUserId &&
          existing.facilityApplication &&
          existing.facilityApplication.id !== application.id
        ) {
          throw AppError.conflict(
            'An active facility account already exists with these contact details. Conflicting match rejected.'
          );
        }

        // Verify user is not linked to another application
        if (existing.facilityApplication && existing.facilityApplication.id !== application.id) {
          throw AppError.conflict(
            'The matching user account is already linked to another facility application.'
          );
        }

        // Verify facility profile ownership conflicts on the user
        if (application.facilityType === FacilityType.HOSPITAL) {
          if (existing.bloodBank) {
            throw AppError.conflict('The matching user account already owns a blood bank profile.');
          }
          if (
            existing.hospital &&
            existing.hospital.facilityApplicationId &&
            existing.hospital.facilityApplicationId !== application.id
          ) {
            throw AppError.conflict(
              'The user hospital profile is already linked to another facility application.'
            );
          }
        } else {
          if (existing.hospital) {
            throw AppError.conflict('The matching user account already owns a hospital profile.');
          }
          if (
            existing.bloodBank &&
            existing.bloodBank.facilityApplicationId &&
            existing.bloodBank.facilityApplicationId !== application.id
          ) {
            throw AppError.conflict(
              'The user blood bank profile is already linked to another facility application.'
            );
          }
        }

        // Update user to ACTIVE status and preserve original password
        linkedUser = await tx.user.update({
          where: { id: existing.id },
          data: {
            status: UserStatus.ACTIVE,
            name: application.name,
            city: application.city,
            location: application.address,
            latitude: application.latitude || 16.3067,
            longitude: application.longitude || 80.4365,
            ...(application.passwordHash && !existing.passwordHash
              ? { passwordHash: application.passwordHash }
              : {}),
          },
        });
      } else {
        // Create new User account directly in ACTIVE status
        linkedUser = await tx.user.create({
          data: {
            name: application.name,
            email: application.email,
            phone: application.phone,
            passwordHash: application.passwordHash,
            role: expectedRole,
            status: UserStatus.ACTIVE,
            city: application.city,
            location: application.address,
            latitude: application.latitude || 16.3067,
            longitude: application.longitude || 80.4365,
            notificationPreferences: {
              create: { inAppUrgent: true, inAppGeneral: true, smsEmergency: true, emailDigest: true },
            },
          },
        });
      }

      // 2. Create or verify facility profile:
      // Mark as VERIFIED and isVerified: true!
      let facilityRecord: any = null;

      if (application.facilityType === FacilityType.HOSPITAL) {
        const existingHospital = await tx.hospital.findFirst({
          where: {
            OR: [
              { userId: linkedUser.id },
              { facilityApplicationId: application.id },
              { licenseNumber: application.licenseNumber },
            ],
          },
        });

        if (existingHospital) {
          // Reject ownership conflicts
          if (existingHospital.userId !== linkedUser.id) {
            throw AppError.conflict(
              'A hospital profile with this license or application belongs to a different user account.'
            );
          }
          if (
            existingHospital.facilityApplicationId &&
            existingHospital.facilityApplicationId !== application.id
          ) {
            throw AppError.conflict(
              'This hospital profile is already linked to a different facility application.'
            );
          }

          facilityRecord = await tx.hospital.update({
            where: { id: existingHospital.id },
            data: {
              userId: linkedUser.id,
              name: application.name,
              facilityApplicationId: application.id,
              isVerified: true,
              status: VerificationStatus.VERIFIED,
            },
          });
        } else {
          facilityRecord = await tx.hospital.create({
            data: {
              userId: linkedUser.id,
              name: application.name,
              type: application.category || 'Private',
              registrationNumber:
                application.registrationNumber || `HOSP-REG-${Date.now().toString().slice(-6)}`,
              phone: application.phone,
              email: application.email,
              address: application.address,
              area: application.area || application.city,
              city: application.city,
              state: application.state || 'Andhra Pradesh',
              pinCode: application.pinCode || '522001',
              latitude: application.latitude || 16.3067,
              longitude: application.longitude || 80.4365,
              services: application.services || ['Emergency Transfusion & Critical Care'],
              licenseNumber: application.licenseNumber,
              issuingAuthority: application.issuingAuthority,
              licenseDocUrl: application.licenseDocUrl,
              registrationCertUrl: application.registrationCertUrl,
              authorizedPersonName: application.authorizedPersonName,
              authorizedPersonDesignation: application.authorizedPersonDesignation,
              authorizedPersonPhone: application.authorizedPersonPhone,
              authorizedPersonEmail: application.authorizedPersonEmail,
              emergencyContact: application.emergencyContact,
              isVerified: true,
              status: VerificationStatus.VERIFIED,
              facilityApplicationId: application.id,
            },
          });
        }
      } else {
        // Blood Bank
        const existingBB = await tx.bloodBank.findFirst({
          where: {
            OR: [
              { userId: linkedUser.id },
              { facilityApplicationId: application.id },
              { licenseNumber: application.licenseNumber },
            ],
          },
        });

        if (existingBB) {
          // Reject ownership conflicts
          if (existingBB.userId !== linkedUser.id) {
            throw AppError.conflict(
              'A blood bank profile with this license or application belongs to a different user account.'
            );
          }
          if (
            existingBB.facilityApplicationId &&
            existingBB.facilityApplicationId !== application.id
          ) {
            throw AppError.conflict(
              'This blood bank profile is already linked to a different facility application.'
            );
          }

          facilityRecord = await tx.bloodBank.update({
            where: { id: existingBB.id },
            data: {
              userId: linkedUser.id,
              name: application.name,
              facilityApplicationId: application.id,
              isVerified: true,
              status: VerificationStatus.VERIFIED,
            },
          });
        } else {
          facilityRecord = await tx.bloodBank.create({
            data: {
              userId: linkedUser.id,
              name: application.name,
              type: application.category || 'Charitable',
              phone: application.phone,
              email: application.email,
              address: application.address,
              city: application.city,
              state: application.state || 'Andhra Pradesh',
              licenseNumber: application.licenseNumber,
              latitude: application.latitude || 16.3067,
              longitude: application.longitude || 80.4365,
              componentsAvailable:
                application.componentsAvailable || ['Red Blood Cells', 'Platelets', 'Plasma', 'Whole Blood'],
              authorizedPersonName: application.authorizedPersonName,
              authorizedPersonDesignation: application.authorizedPersonDesignation,
              authorizedPersonPhone: application.authorizedPersonPhone,
              authorizedPersonEmail: application.authorizedPersonEmail,
              isVerified: true,
              status: VerificationStatus.VERIFIED,
              facilityApplicationId: application.id,
            },
          });
        }
        // Do not create any inventory during approval.
      }

      // 3. Update application to APPROVED and isActivated = true
      const updated = await tx.facilityApplication.update({
        where: { id },
        data: {
          status: ApplicationStatus.APPROVED,
          approvedAt: new Date(),
          approvedByAdminId: adminId,
          activationToken,
          activationTokenExpiresAt,
          isActivated: true,
          activatedAt: new Date(),
          createdUserId: linkedUser.id,
        },
        include: {
          approvedByAdmin: { select: { id: true, name: true, email: true } },
        },
      });

      // 4. Record review
      await tx.facilityApplicationReview.create({
        data: {
          applicationId: id,
          adminId,
          action: 'APPROVED',
          fromStatus: application.status,
          toStatus: ApplicationStatus.APPROVED,
          notes: notes || 'Facility application approved and account activated.',
        },
      });

      // 5. Record AuditLog
      await tx.auditLog.create({
        data: {
          eventType: 'FACILITY_APPLICATION_APPROVED',
          description: `Application ${application.referenceNumber} (${application.name}) approved and account activated by administrator.`,
          actorId: adminId,
          actorRole: 'ADMIN',
          targetId: id,
          targetType: 'FACILITY_APPLICATION',
          details: {
            referenceNumber: application.referenceNumber,
            facilityType: application.facilityType,
            userId: linkedUser.id,
          },
        },
      });

      return {
        application: updated,
        activationToken,
        user: linkedUser,
        hospital: application.facilityType === FacilityType.HOSPITAL ? facilityRecord : undefined,
        bloodBank: application.facilityType === FacilityType.BLOOD_BANK ? facilityRecord : undefined,
        message: 'Facility application approved and account activated successfully.',
      };
    });
  }

  /**
   * Safely reconcile approved facility applications.
   * Ensures that any application in APPROVED status has its linked user set to ACTIVE,
   * its facility profile (Hospital or BloodBank) VERIFIED, and isActivated set to true.
   * Preserves existing passwords, roles, and profiles. Never alters suspended accounts.
   */
  async reconcileApprovedFacilityApplications(applicationId?: string) {
    const where: any = {
      status: ApplicationStatus.APPROVED,
    };
    if (applicationId) {
      where.id = applicationId;
    }

    const approvedApplications = await prisma.facilityApplication.findMany({
      where,
      include: {
        createdUser: true,
        hospital: true,
        bloodBank: true,
      },
    });

    const results: Array<{ id: string; referenceNumber: string; name: string; status: string }> = [];

    for (const app of approvedApplications) {
      // Never reconcile suspended applications
      if (app.status === ApplicationStatus.SUSPENDED) {
        continue;
      }

      // Check if linked user is explicitly suspended
      if (app.createdUser && app.createdUser.status === UserStatus.SUSPENDED) {
        continue;
      }

      // Check whether this application is already fully active and consistent
      const isUserActive = app.createdUser && app.createdUser.status === UserStatus.ACTIVE;
      const isHospitalVerified =
        app.facilityType === FacilityType.HOSPITAL &&
        app.hospital &&
        app.hospital.isVerified &&
        app.hospital.status === VerificationStatus.VERIFIED;
      const isBloodBankVerified =
        app.facilityType === FacilityType.BLOOD_BANK &&
        app.bloodBank &&
        app.bloodBank.isVerified &&
        app.bloodBank.status === VerificationStatus.VERIFIED;

      if (app.isActivated && isUserActive && (isHospitalVerified || isBloodBankVerified)) {
        // Already fully active and consistent
        continue;
      }

      const expectedRole =
        app.facilityType === FacilityType.HOSPITAL ? UserRole.HOSPITAL : UserRole.BLOOD_BANK;

      await prisma.$transaction(async (tx) => {
        // 1. Locate or create User
        let user = app.createdUser;

        if (!user) {
          // Look for user matching createdUserId, email, or phone
          const existingUser = await tx.user.findFirst({
            where: {
              OR: [
                ...(app.createdUserId ? [{ id: app.createdUserId }] : []),
                { email: { equals: app.email, mode: 'insensitive' } },
                { phone: app.phone },
              ],
            },
          });

          if (existingUser) {
            if (existingUser.status === UserStatus.SUSPENDED) {
              return; // Do not touch suspended users
            }
            user = await tx.user.update({
              where: { id: existingUser.id },
              data: {
                role: expectedRole,
                status: UserStatus.ACTIVE,
                name: app.name,
                city: app.city,
                location: app.address,
                ...(app.passwordHash && !existingUser.passwordHash
                  ? { passwordHash: app.passwordHash }
                  : {}),
              },
            });
          } else {
            // Create user
            user = await tx.user.create({
              data: {
                name: app.name,
                email: app.email,
                phone: app.phone,
                passwordHash: app.passwordHash,
                role: expectedRole,
                status: UserStatus.ACTIVE,
                city: app.city,
                location: app.address,
                latitude: app.latitude || 16.3067,
                longitude: app.longitude || 80.4365,
                notificationPreferences: {
                  create: { inAppUrgent: true, inAppGeneral: true, smsEmergency: true, emailDigest: true },
                },
              },
            });
          }
        } else {
          // User exists, make sure status is ACTIVE and passwordHash is preserved
          if (user.status !== UserStatus.ACTIVE || (!user.passwordHash && app.passwordHash)) {
            user = await tx.user.update({
              where: { id: user.id },
              data: {
                status: UserStatus.ACTIVE,
                ...(app.passwordHash && !user.passwordHash ? { passwordHash: app.passwordHash } : {}),
              },
            });
          }
        }

        // 2. Locate or create/update facility profile
        if (app.facilityType === FacilityType.HOSPITAL) {
          let hospital = app.hospital;
          if (!hospital) {
            hospital = await tx.hospital.findFirst({
              where: {
                OR: [
                  { userId: user.id },
                  { facilityApplicationId: app.id },
                  { licenseNumber: app.licenseNumber },
                ],
              },
            });
          }

          if (hospital) {
            await tx.hospital.update({
              where: { id: hospital.id },
              data: {
                userId: user.id,
                facilityApplicationId: app.id,
                name: app.name,
                isVerified: true,
                status: VerificationStatus.VERIFIED,
              },
            });
          } else {
            await tx.hospital.create({
              data: {
                userId: user.id,
                name: app.name,
                type: app.category || 'Private',
                registrationNumber:
                  app.registrationNumber || `HOSP-REG-${Date.now().toString().slice(-6)}`,
                phone: app.phone,
                email: app.email,
                address: app.address,
                area: app.area || app.city,
                city: app.city,
                state: app.state || 'Andhra Pradesh',
                pinCode: app.pinCode || '522001',
                latitude: app.latitude || 16.3067,
                longitude: app.longitude || 80.4365,
                services: app.services || ['Emergency Transfusion & Critical Care'],
                licenseNumber: app.licenseNumber,
                issuingAuthority: app.issuingAuthority,
                licenseDocUrl: app.licenseDocUrl,
                registrationCertUrl: app.registrationCertUrl,
                authorizedPersonName: app.authorizedPersonName,
                authorizedPersonDesignation: app.authorizedPersonDesignation,
                authorizedPersonPhone: app.authorizedPersonPhone,
                authorizedPersonEmail: app.authorizedPersonEmail,
                emergencyContact: app.emergencyContact,
                isVerified: true,
                status: VerificationStatus.VERIFIED,
                facilityApplicationId: app.id,
              },
            });
          }
        } else {
          // Blood Bank
          let bloodBank = app.bloodBank;
          if (!bloodBank) {
            bloodBank = await tx.bloodBank.findFirst({
              where: {
                OR: [
                  { userId: user.id },
                  { facilityApplicationId: app.id },
                  { licenseNumber: app.licenseNumber },
                ],
              },
            });
          }

          if (bloodBank) {
            await tx.bloodBank.update({
              where: { id: bloodBank.id },
              data: {
                userId: user.id,
                facilityApplicationId: app.id,
                name: app.name,
                isVerified: true,
                status: VerificationStatus.VERIFIED,
              },
            });
          } else {
            await tx.bloodBank.create({
              data: {
                userId: user.id,
                name: app.name,
                type: app.category || 'Charitable',
                phone: app.phone,
                email: app.email,
                address: app.address,
                city: app.city,
                state: app.state || 'Andhra Pradesh',
                licenseNumber: app.licenseNumber,
                latitude: app.latitude || 16.3067,
                longitude: app.longitude || 80.4365,
                componentsAvailable:
                  app.componentsAvailable || ['Red Blood Cells', 'Platelets', 'Plasma', 'Whole Blood'],
                authorizedPersonName: app.authorizedPersonName,
                authorizedPersonDesignation: app.authorizedPersonDesignation,
                authorizedPersonPhone: app.authorizedPersonPhone,
                authorizedPersonEmail: app.authorizedPersonEmail,
                isVerified: true,
                status: VerificationStatus.VERIFIED,
                facilityApplicationId: app.id,
              },
            });
          }
        }

        // 3. Mark application as activated
        await tx.facilityApplication.update({
          where: { id: app.id },
          data: {
            createdUserId: user.id,
            isActivated: true,
            activatedAt: app.activatedAt || new Date(),
          },
        });

        results.push({
          id: app.id,
          referenceNumber: app.referenceNumber,
          name: app.name,
          status: 'RECONCILED',
        });
      });
    }

    return {
      reconciledCount: results.length,
      details: results,
    };
  }

  /**
   * Verify activation token validity for the applicant activation portal
   */
  async verifyActivationToken(token: string) {
    if (!token) {
      throw AppError.badRequest('Activation token is required.');
    }

    const application = await prisma.facilityApplication.findUnique({
      where: { activationToken: token },
    });

    if (!application) {
      throw AppError.badRequest('Invalid, expired, or previously redeemed activation token.');
    }

    if (application.status !== ApplicationStatus.APPROVED) {
      throw AppError.badRequest('Facility application has not been approved.');
    }

    if (application.activationTokenExpiresAt && application.activationTokenExpiresAt < new Date()) {
      throw AppError.badRequest('Activation token has expired. Please request a new invitation link from your administrator.');
    }

    return {
      referenceNumber: application.referenceNumber,
      name: application.name,
      facilityType: application.facilityType,
      email: application.email,
      phone: application.phone,
      category: application.category,
      city: application.city,
      address: application.address,
      licenseNumber: application.licenseNumber,
      authorizedPersonName: application.authorizedPersonName,
    };
  }

  /**
   * Applicant completes activation by setting their secure password.
   * Atomically activates the User and verifies the facility profile in PostgreSQL!
   */
  async completeActivation(token: string, password?: string) {
    if (!token) {
      throw AppError.badRequest('Activation token is required.');
    }

    const application = await prisma.facilityApplication.findUnique({
      where: { activationToken: token },
      include: {
        createdUser: true,
        hospital: true,
        bloodBank: true,
      },
    });

    if (!application) {
      throw AppError.badRequest('Invalid or expired activation token.');
    }

    if (application.status !== ApplicationStatus.APPROVED) {
      throw AppError.badRequest('Facility application has not been approved.');
    }

    if (application.activationTokenExpiresAt && application.activationTokenExpiresAt < new Date()) {
      throw AppError.badRequest('Activation token has expired.');
    }

    if (!application.createdUserId || !application.createdUser) {
      throw AppError.badRequest('No linked user account found for this application.');
    }

    const expectedRole =
      application.facilityType === FacilityType.HOSPITAL ? UserRole.HOSPITAL : UserRole.BLOOD_BANK;

    // Verify linked user role matches expected facility type
    if (application.createdUser.role !== expectedRole) {
      throw AppError.conflict(
        `Linked user account role (${application.createdUser.role}) does not match expected facility role (${expectedRole}).`
      );
    }

    // Verify user is linked to this exact application and facility profile
    let facilityRecord: any = null;
    if (application.facilityType === FacilityType.HOSPITAL) {
      const hospital =
        application.hospital ||
        (await prisma.hospital.findFirst({
          where: { facilityApplicationId: application.id },
        }));

      if (!hospital) {
        throw AppError.notFound('Linked hospital profile not found for this application.');
      }
      if (hospital.userId !== application.createdUserId) {
        throw AppError.conflict('Hospital profile ownership conflict: profile is not owned by the linked user.');
      }
      if (hospital.facilityApplicationId !== application.id) {
        throw AppError.conflict('Hospital profile is not linked to this application.');
      }
      facilityRecord = hospital;
    } else {
      const bloodBank =
        application.bloodBank ||
        (await prisma.bloodBank.findFirst({
          where: { facilityApplicationId: application.id },
        }));

      if (!bloodBank) {
        throw AppError.notFound('Linked blood bank profile not found for this application.');
      }
      if (bloodBank.userId !== application.createdUserId) {
        throw AppError.conflict('Blood bank profile ownership conflict: profile is not owned by the linked user.');
      }
      if (bloodBank.facilityApplicationId !== application.id) {
        throw AppError.conflict('Blood bank profile is not linked to this application.');
      }
      facilityRecord = bloodBank;
    }

    const newPasswordHash = password
      ? await hashPassword(password)
      : application.createdUser.passwordHash || application.passwordHash;

    if (!newPasswordHash) {
      throw AppError.badRequest('Password is required to complete activation.');
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Activate the correct user (NEVER an unrelated account through email/phone match)
      const user = await tx.user.update({
        where: { id: application.createdUserId! },
        data: {
          status: UserStatus.ACTIVE,
          passwordHash: newPasswordHash,
        },
      });

      // 2. Verify the facility profile (Preserve existing profile data and inventory; do NOT create duplicate profiles or stock)
      let verifiedFacility: any = null;
      if (application.facilityType === FacilityType.HOSPITAL) {
        verifiedFacility = await tx.hospital.update({
          where: { id: facilityRecord.id },
          data: {
            isVerified: true,
            status: VerificationStatus.VERIFIED,
          },
        });
      } else {
        verifiedFacility = await tx.bloodBank.update({
          where: { id: facilityRecord.id },
          data: {
            isVerified: true,
            status: VerificationStatus.VERIFIED,
          },
        });
      }

      // 3. Mark application activated, set activatedAt, and clear activation token and expiry
      await tx.facilityApplication.update({
        where: { id: application.id },
        data: {
          isActivated: true,
          activatedAt: new Date(),
          activationToken: null,
          activationTokenExpiresAt: null,
        },
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          eventType: 'FACILITY_ACCOUNT_ACTIVATED',
          description: `Facility account activated for ${application.name} (${application.facilityType}). User ID: ${user.id}`,
          actorId: user.id,
          actorRole: expectedRole,
          targetId: verifiedFacility.id,
          targetType: application.facilityType,
          details: { referenceNumber: application.referenceNumber, facilityId: verifiedFacility.id },
        },
      });

      // 5. Establish real authenticated session
      const accessToken = signAccessToken({
        userId: user.id,
        phone: user.phone,
        role: user.role,
      });

      const refreshToken = generateRefreshTokenString();
      const tokenHash = hashToken(refreshToken);
      const refreshExpiresAt = new Date();
      refreshExpiresAt.setDate(refreshExpiresAt.getDate() + ENV.REFRESH_TOKEN_EXPIRES_DAYS);

      await tx.refreshSession.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: refreshExpiresAt,
        },
      });

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          city: user.city,
          facilityId: verifiedFacility.id,
        },
        facility: verifiedFacility,
        accessToken,
        refreshToken,
      };
    });
  }

  /**
   * Admin suspends an approved facility
   */
  async suspendFacility(id: string, adminId: string, reason: string) {
    const application = await prisma.facilityApplication.findUnique({
      where: { id },
      include: {
        hospital: true,
        bloodBank: true,
        createdUser: true,
      },
    });

    if (!application) throw AppError.notFound('Facility application not found.');

    return await prisma.$transaction(async (tx) => {
      // 1. Update application status
      const updatedApp = await tx.facilityApplication.update({
        where: { id },
        data: {
          status: ApplicationStatus.SUSPENDED,
          rejectionReason: reason,
        },
      });

      // 2. Suspend user account and revoke all sessions
      if (application.createdUserId) {
        await tx.user.update({
          where: { id: application.createdUserId },
          data: { status: UserStatus.SUSPENDED },
        });

        // Revoke all active sessions immediately
        await tx.refreshSession.updateMany({
          where: { userId: application.createdUserId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }

      // 3. Mark facility as suspended and unverified
      if (application.hospital) {
        await tx.hospital.update({
          where: { id: application.hospital.id },
          data: { status: VerificationStatus.SUSPENDED, isVerified: false },
        });
      }

      if (application.bloodBank) {
        await tx.bloodBank.update({
          where: { id: application.bloodBank.id },
          data: { status: VerificationStatus.SUSPENDED, isVerified: false },
        });
      }

      // 4. Review & Audit
      await tx.facilityApplicationReview.create({
        data: {
          applicationId: id,
          adminId,
          action: 'SUSPENDED',
          fromStatus: application.status,
          toStatus: ApplicationStatus.SUSPENDED,
          notes: reason,
        },
      });

      await tx.auditLog.create({
        data: {
          eventType: 'FACILITY_SUSPENDED',
          description: `Facility ${application.name} (${application.referenceNumber}) suspended by administrator. Reason: ${reason}`,
          actorId: adminId,
          actorRole: 'ADMIN',
          targetId: id,
          targetType: 'FACILITY_APPLICATION',
          details: { referenceNumber: application.referenceNumber, reason },
        },
      });

      return updatedApp;
    });
  }
}

export const facilityApplicationsService = new FacilityApplicationsService();
