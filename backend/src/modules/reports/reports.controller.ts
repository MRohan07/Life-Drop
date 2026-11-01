import { Request, Response, NextFunction } from 'express';
import { reportsService } from './reports.service.js';
import { AppError } from '../../common/errors/AppError.js';

export class ReportsController {
  async getMyReports(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.hospitalId) {
        throw AppError.forbidden('Only authorized hospitals can view their submitted reports');
      }
      const reports = await reportsService.getMyReports(req.user.hospitalId);
      res.status(200).json({
        status: 'success',
        results: reports.length,
        data: { reports },
      });
    } catch (err) {
      next(err);
    }
  }

  async fileReport(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.hospitalId) {
        throw AppError.forbidden('Only authorized hospitals can submit clinical abuse reports');
      }
      const report = await reportsService.fileReport(req.user.hospitalId, req.body);
      res.status(201).json({
        status: 'success',
        message: 'Incident report submitted for state oversight review',
        data: { report },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const reportsController = new ReportsController();
