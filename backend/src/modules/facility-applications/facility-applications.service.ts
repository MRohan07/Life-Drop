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
          ? 'Your facility application is APPROVED! You can now log in directly with your email and password.'
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
   * Admin approves application and generates secure activation invitation
   */
  async approveApplication(id: string, adminId: string, notes?: string) {
    const application = await prisma.facilityApplication.findUnique({ where: { id } });
    if (!application) throw AppError.notFound('Facility application not found.');

    if (application.status === ApplicationStatus.APPROVED && application.isActivated) {
      throw AppError.badRequest('Facility account for this application has already been activated.');
    }

    if (application.status === ApplicationStatus.REJECTED) {
      throw AppError.badRequest('Cannot approve an application that has already been rejected.');
    }

    // Generate high-entropy 64-character activation token for audit and backwards compatibility
    const activationToken = crypto.randomBytes(32).toString('hex');
    const activationTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    return await prisma.$transaction(async (tx) => {
      let createdUser: any = null;
      let facilityRecord: any = null;
      let isDirectlyActivated = false;

      // If applicant provided a password during registration, activate their account immediately!
      if (application.passwordHash && !application.createdUserId) {
        const role = application.facilityType === 'HOSPITAL' ? UserRole.HOSPITAL : UserRole.BLOOD_BANK;

        let user = await tx.user.findFirst({
          where: { OR: [{ email: application.email }, { phone: application.phone }] },
        });

        if (!user) {
          user = await tx.user.create({
            data: {
              name: application.name,
              email: application.email,
              phone: application.phone,
              passwordHash: application.passwordHash,
              role,
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
        createdUser = user;

        if (application.facilityType === 'HOSPITAL') {
          facilityRecord = await tx.hospital.create({
            data: {
              userId: user.id,
              name: application.name,
              type: application.category || 'Private',
              registrationNumber: application.registrationNumber || `HOSP-REG-${Date.now().toString().slice(-6)}`,
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
        } else {
          facilityRecord = await tx.bloodBank.create({
            data: {
              userId: user.id,
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
              componentsAvailable: application.componentsAvailable || ['Red Blood Cells', 'Platelets', 'Plasma', 'Whole Blood'],
              authorizedPersonName: application.authorizedPersonName,
              authorizedPersonDesignation: application.authorizedPersonDesignation,
              authorizedPersonPhone: application.authorizedPersonPhone,
              authorizedPersonEmail: application.authorizedPersonEmail,
              isVerified: true,
              status: VerificationStatus.VERIFIED,
              facilityApplicationId: application.id,
            },
          });

          // Initialize 8 blood group inventory balances
          const allGroups = Object.values(BloodGroup);
          for (const group of allGroups) {
            await tx.inventoryBalance.create({
              data: {
                bloodBankId: facilityRecord.id,
                bloodGroup: group,
                componentType: ComponentType.RED_BLOOD_CELLS,
                availableUnits: 5,
                reservedUnits: 0,
                suppliedUnits: 0,
              },
            });
          }
        }

        isDirectlyActivated = true;
      }

      const updated = await tx.facilityApplication.update({
        where: { id },
        data: {
          status: ApplicationStatus.APPROVED,
          approvedAt: new Date(),
          approvedByAdminId: adminId,
          activationToken,
          activationTokenExpiresAt,
          ...(isDirectlyActivated
            ? {
                isActivated: true,
                activatedAt: new Date(),
                createdUserId: createdUser?.id,
              }
            : {}),
        },
        include: {
          approvedByAdmin: { select: { id: true, name: true, email: true } },
        },
      });

      await tx.facilityApplicationReview.create({
        data: {
          applicationId: id,
          adminId,
          action: 'APPROVED',
          fromStatus: application.status,
          toStatus: ApplicationStatus.APPROVED,
          notes: notes || 'Facility application approved by administrator.',
        },
      });

      await tx.auditLog.create({
        data: {
          eventType: 'FACILITY_APPLICATION_APPROVED',
          description: `Application ${application.referenceNumber} (${application.name}) approved by administrator.${isDirectlyActivated ? ' Account immediately activated.' : ''}`,
          actorId: adminId,
          actorRole: 'ADMIN',
          targetId: id,
          targetType: 'FACILITY_APPLICATION',
          details: {
            referenceNumber: application.referenceNumber,
            facilityType: application.facilityType,
            isDirectlyActivated,
          },
        },
      });

      return {
        application: updated,
        activationToken,
        user: createdUser,
        hospital: application.facilityType === 'HOSPITAL' ? facilityRecord : undefined,
        bloodBank: application.facilityType === 'BLOOD_BANK' ? facilityRecord : undefined,
        message: isDirectlyActivated
          ? 'Facility approved and fully activated. Facility can log in directly with their registered credentials.'
          : 'Facility application approved. Activation token generated.',
      };
    });
  }

  /**
   * Verify activation token validity for the applicant activation portal
   */
  async verifyActivationToken(token: string) {
    const application = await prisma.facilityApplication.findUnique({
      where: { activationToken: token },
    });

    if (!application) {
      throw AppError.badRequest('Invalid, expired, or previously redeemed activation token.');
    }

    if (application.isActivated) {
      throw AppError.badRequest('This facility account has already been activated. Please proceed to sign in.');
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
   * Atomically creates the User and Hospital/BloodBank records in PostgreSQL!
   */
  async completeActivation(token: string, password: string) {
    const application = await prisma.facilityApplication.findUnique({
      where: { activationToken: token },
    });

    if (!application) {
      throw AppError.badRequest('Invalid or expired activation token.');
    }

    if (application.isActivated) {
      throw AppError.badRequest('This facility account has already been activated.');
    }

    if (application.activationTokenExpiresAt && application.activationTokenExpiresAt < new Date()) {
      throw AppError.badRequest('Activation token has expired.');
    }

    // Verify no account collision
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: application.email }, { phone: application.phone }],
      },
    });
    if (existingUser) {
      throw AppError.conflict('An active user account with this email or phone already exists.');
    }

    const passwordHash = await hashPassword(password);
    const role = application.facilityType === 'HOSPITAL' ? UserRole.HOSPITAL : UserRole.BLOOD_BANK;

    return await prisma.$transaction(async (tx) => {
      // 1. Create the persistent User record
      const user = await tx.user.create({
        data: {
          name: application.name,
          email: application.email,
          phone: application.phone,
          passwordHash,
          role,
          status: UserStatus.ACTIVE,
          city: application.city,
          location: application.address,
          latitude: application.latitude || 16.3067,
          longitude: application.longitude || 80.4365,
          notificationPreferences: {
            create: {
              inAppUrgent: true,
              inAppGeneral: true,
              smsEmergency: true,
              emailDigest: true,
            },
          },
        },
      });

      let facilityRecord: any;

      // 2. Create the authorized Hospital or BloodBank record
      if (application.facilityType === 'HOSPITAL') {
        facilityRecord = await tx.hospital.create({
          data: {
            userId: user.id,
            name: application.name,
            type: application.category || 'Private',
            registrationNumber: application.registrationNumber || `HOSP-REG-${Date.now().toString().slice(-6)}`,
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
      } else {
        facilityRecord = await tx.bloodBank.create({
          data: {
            userId: user.id,
            name: application.name,
            type: application.category || 'Private',
            registrationNumber: application.registrationNumber || `BB-REG-${Date.now().toString().slice(-6)}`,
            phone: application.phone,
            email: application.email,
            address: application.address,
            area: application.area || application.city,
            city: application.city,
            state: application.state || 'Andhra Pradesh',
            pinCode: application.pinCode || '522001',
            latitude: application.latitude || 16.3067,
            longitude: application.longitude || 80.4365,
            componentsAvailable:
              application.componentsAvailable && application.componentsAvailable.length > 0
                ? application.componentsAvailable
                : ['Red Blood Cells', 'Platelets', 'Plasma', 'Whole Blood'],
            licenseNumber: application.licenseNumber,
            issuingAuthority: application.issuingAuthority,
            licenseDocUrl: application.licenseDocUrl,
            registrationCertUrl: application.registrationCertUrl,
            authorizedPersonName: application.authorizedPersonName,
            authorizedPersonDesignation: application.authorizedPersonDesignation,
            authorizedPersonPhone: application.authorizedPersonPhone,
            authorizedPersonEmail: application.authorizedPersonEmail,
            isVerified: true,
            status: VerificationStatus.VERIFIED,
            facilityApplicationId: application.id,
          },
        });

        // Initialize blood balances for all 8 groups
        const allGroups = Object.values(BloodGroup);
        for (const group of allGroups) {
          await tx.inventoryBalance.create({
            data: {
              bloodBankId: facilityRecord.id,
              bloodGroup: group,
              componentType: ComponentType.RED_BLOOD_CELLS,
              availableUnits: 10,
              reservedUnits: 0,
              suppliedUnits: 0,
            },
          });
        }
      }

      // 3. Mark application as activated and link to created user
      await tx.facilityApplication.update({
        where: { id: application.id },
        data: {
          isActivated: true,
          activatedAt: new Date(),
          createdUserId: user.id,
          activationToken: null, // Clear used token
        },
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          eventType: 'FACILITY_ACCOUNT_ACTIVATED',
          description: `Facility account activated for ${application.name} (${application.facilityType}). User ID: ${user.id}`,
          actorId: user.id,
          actorRole: role,
          targetId: facilityRecord.id,
          targetType: application.facilityType,
          details: { referenceNumber: application.referenceNumber, facilityId: facilityRecord.id },
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
          facilityId: facilityRecord.id,
        },
        facility: facilityRecord,
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
