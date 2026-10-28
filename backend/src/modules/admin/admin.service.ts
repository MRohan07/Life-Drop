import { prisma } from '../../config/database.js';
import { AppError } from '../../common/errors/AppError.js';
import { UserStatus, VerificationStatus, ReportStatus, FeedbackStatus } from '@prisma/client';

export class AdminService {
  async getDashboardStats() {
    const [
      totalUsers,
      totalHospitals,
      totalBloodBanks,
      totalRequests,
      activeRequests,
      totalDonations,
      pendingHospitals,
      pendingBloodBanks,
      pendingReports,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.hospital.count(),
      prisma.bloodBank.count(),
      prisma.bloodRequest.count(),
      prisma.bloodRequest.count({ where: { status: { in: ['SEARCHING', 'ACTIVE', 'PARTIALLY_FULFILLED', 'RESERVED'] } } }),
      prisma.donationRecord.count({ where: { status: 'CONFIRMED' } }),
      prisma.hospital.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.bloodBank.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.userReport.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      totalUsers,
      totalHospitals,
      totalBloodBanks,
      totalRequests,
      activeRequests,
      totalDonations,
      pendingApprovals: pendingHospitals + pendingBloodBanks,
      pendingReports,
    };
  }

  async listUsers(role?: string) {
    return await prisma.user.findMany({
      where: role ? { role: role as any } : undefined,
      include: {
        donorProfile: true,
        hospital: { select: { id: true, name: true, status: true } },
        bloodBank: { select: { id: true, name: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async updateUserStatus(userId: string, status: UserStatus, reason?: string, actorId = 'ADMIN') {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound('User not found');

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          status,
          ...(status === 'WARNED' ? { warningCount: { increment: 1 } } : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          eventType: 'USER_STATUS_CHANGE',
          description: `User ${user.name} (${user.id}) status set to ${status}. Reason: ${reason || 'Administrative action'}`,
          actorId,
          actorRole: 'ADMIN',
          targetId: userId,
          targetType: 'USER',
          details: { oldStatus: user.status, newStatus: status, reason },
        },
      });

      return updated;
    });
  }

  async listHospitals() {
    return await prisma.hospital.findMany({
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
      },
      orderBy: { submittedDate: 'desc' },
    });
  }

  async updateHospitalVerification(hospitalId: string, status: VerificationStatus, reason?: string, actorId = 'ADMIN') {
    const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
    if (!hospital) throw AppError.notFound('Hospital not found');

    const isVerified = status === VerificationStatus.VERIFIED;

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.hospital.update({
        where: { id: hospitalId },
        data: {
          status,
          isVerified,
        },
      });

      await tx.auditLog.create({
        data: {
          eventType: 'HOSPITAL_VERIFICATION_CHANGE',
          description: `Hospital ${hospital.name} compliance status set to ${status}. Reason: ${reason || 'Compliance check'}`,
          actorId,
          actorRole: 'ADMIN',
          targetId: hospitalId,
          targetType: 'HOSPITAL',
          details: { status, isVerified, reason },
        },
      });

      return updated;
    });
  }

  async listBloodBanks() {
    return await prisma.bloodBank.findMany({
      include: {
        inventoryBalances: true,
        user: { select: { id: true, name: true, phone: true, email: true } },
      },
      orderBy: { submittedDate: 'desc' },
    });
  }

  async updateBloodBankVerification(bloodBankId: string, status: VerificationStatus, reason?: string, actorId = 'ADMIN') {
    const bloodBank = await prisma.bloodBank.findUnique({ where: { id: bloodBankId } });
    if (!bloodBank) throw AppError.notFound('Blood bank not found');

    const isVerified = status === VerificationStatus.VERIFIED;

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.bloodBank.update({
        where: { id: bloodBankId },
        data: {
          status,
          isVerified,
        },
      });

      await tx.auditLog.create({
        data: {
          eventType: 'BLOOD_BANK_VERIFICATION_CHANGE',
          description: `Blood Bank ${bloodBank.name} accreditation status set to ${status}. Reason: ${reason || 'Accreditation inspection'}`,
          actorId,
          actorRole: 'ADMIN',
          targetId: bloodBankId,
          targetType: 'BLOOD_BANK',
          details: { status, isVerified, reason },
        },
      });

      return updated;
    });
  }

  async listReports() {
    return await prisma.userReport.findMany({
      include: {
        reporterHospital: { select: { id: true, name: true, phone: true } },
        reportedUser: { select: { id: true, name: true, phone: true, status: true, warningCount: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveReport(reportId: string, status: ReportStatus, actionTaken?: string, actorId = 'ADMIN') {
    const report = await prisma.userReport.findUnique({ where: { id: reportId } });
    if (!report) throw AppError.notFound('Report not found');

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.userReport.update({
        where: { id: reportId },
        data: {
          status,
          actionTaken,
          resolvedBy: actorId,
        },
      });

      if (status === 'SUSPENDED') {
        await tx.user.update({
          where: { id: report.reportedUserId },
          data: { status: 'SUSPENDED' },
        });
      } else if (status === 'WARNED') {
        await tx.user.update({
          where: { id: report.reportedUserId },
          data: { status: 'WARNED', warningCount: { increment: 1 } },
        });
      }

      await tx.auditLog.create({
        data: {
          eventType: 'REPORT_RESOLUTION',
          description: `Report #${reportId} resolved with outcome ${status}. Action: ${actionTaken || 'None'}`,
          actorId,
          actorRole: 'ADMIN',
          targetId: reportId,
          targetType: 'USER_REPORT',
        },
      });

      return updated;
    });
  }

  async listAuditLogs(limit = 100) {
    return await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  async replyFeedback(
    feedbackId: string,
    message: string,
    adminStatus: 'RESOLVED' | 'INVESTIGATING' | 'ACKNOWLEDGED',
    adminName = 'Super Administrator'
  ) {
    const feedback = await prisma.feedbackSubmission.findUnique({ where: { id: feedbackId } });
    if (!feedback) throw AppError.notFound('Feedback not found');

    return await prisma.feedbackSubmission.update({
      where: { id: feedbackId },
      data: {
        status: FeedbackStatus.RESOLVED,
        adminReplyMessage: message,
        adminReplyStatus: adminStatus,
        adminRepliedAt: new Date(),
        adminRepliedBy: adminName,
      },
    });
  }
}

export const adminService = new AdminService();
