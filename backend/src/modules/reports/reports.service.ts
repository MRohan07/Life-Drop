import { prisma } from '../../config/database.js';
import { AppError } from '../../common/errors/AppError.js';
import { ReportReason, ReportStatus } from '@prisma/client';

export class ReportsService {
  async fileReport(
    reporterHospitalId: string,
    data: {
      reportedUserId: string;
      requestId?: string;
      reason: ReportReason;
      description: string;
      evidenceUrl?: string;
    }
  ) {
    const reportedUser = await prisma.user.findUnique({
      where: { id: data.reportedUserId },
    });
    if (!reportedUser) throw AppError.notFound('Reported user does not exist');

    return await prisma.userReport.create({
      data: {
        reporterHospitalId,
        reportedUserId: data.reportedUserId,
        requestId: data.requestId,
        reason: data.reason,
        description: data.description,
        evidenceUrl: data.evidenceUrl,
        status: ReportStatus.PENDING,
      },
      include: {
        reporterHospital: { select: { id: true, name: true } },
        reportedUser: { select: { id: true, name: true, phone: true } },
      },
    });
  }
}

export const reportsService = new ReportsService();
