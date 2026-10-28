import { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service.js';
import { UserStatus, VerificationStatus, ReportStatus } from '@prisma/client';
import { AppError } from '../../common/errors/AppError.js';

export class AdminController {
  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getDashboardStats();
      res.status(200).json({ status: 'success', data: { stats } });
    } catch (err) {
      next(err);
    }
  }

  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const role = req.query.role ? String(req.query.role) : undefined;
      const users = await adminService.listUsers(role);
      res.status(200).json({ status: 'success', results: users.length, data: { users } });
    } catch (err) {
      next(err);
    }
  }

  async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, reason } = req.body;
      const user = await adminService.updateUserStatus(
        req.params.id,
        status as UserStatus,
        reason,
        req.user?.id
      );
      res.status(200).json({ status: 'success', message: 'User status updated', data: { user } });
    } catch (err) {
      next(err);
    }
  }

  async listHospitals(req: Request, res: Response, next: NextFunction) {
    try {
      const hospitals = await adminService.listHospitals();
      res.status(200).json({ status: 'success', results: hospitals.length, data: { hospitals } });
    } catch (err) {
      next(err);
    }
  }

  async updateHospitalVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, reason } = req.body;
      const hospital = await adminService.updateHospitalVerification(
        req.params.id,
        status as VerificationStatus,
        reason,
        req.user?.id
      );
      res.status(200).json({ status: 'success', message: 'Hospital verification updated', data: { hospital } });
    } catch (err) {
      next(err);
    }
  }

  async listBloodBanks(req: Request, res: Response, next: NextFunction) {
    try {
      const bloodBanks = await adminService.listBloodBanks();
      res.status(200).json({ status: 'success', results: bloodBanks.length, data: { bloodBanks } });
    } catch (err) {
      next(err);
    }
  }

  async updateBloodBankVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, reason } = req.body;
      const bloodBank = await adminService.updateBloodBankVerification(
        req.params.id,
        status as VerificationStatus,
        reason,
        req.user?.id
      );
      res.status(200).json({ status: 'success', message: 'Blood bank accreditation updated', data: { bloodBank } });
    } catch (err) {
      next(err);
    }
  }

  async listReports(req: Request, res: Response, next: NextFunction) {
    try {
      const reports = await adminService.listReports();
      res.status(200).json({ status: 'success', results: reports.length, data: { reports } });
    } catch (err) {
      next(err);
    }
  }

  async resolveReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, actionTaken } = req.body;
      const report = await adminService.resolveReport(
        req.params.id,
        status as ReportStatus,
        actionTaken,
        req.user?.id
      );
      res.status(200).json({ status: 'success', message: 'Report resolved', data: { report } });
    } catch (err) {
      next(err);
    }
  }

  async listAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 100;
      const logs = await adminService.listAuditLogs(limit);
      res.status(200).json({ status: 'success', results: logs.length, data: { logs } });
    } catch (err) {
      next(err);
    }
  }

  async replyFeedback(req: Request, res: Response, next: NextFunction) {
    try {
      const { message, status } = req.body;
      const feedback = await adminService.replyFeedback(
        req.params.id,
        message,
        status || 'RESOLVED',
        req.user?.name
      );
      res.status(200).json({ status: 'success', message: 'Admin reply posted', data: { feedback } });
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();
