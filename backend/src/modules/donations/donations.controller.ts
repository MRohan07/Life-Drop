import { Request, Response, NextFunction } from 'express';
import { donationsService } from './donations.service.js';
import { AppError } from '../../common/errors/AppError.js';

export class DonationsController {
  async confirmDonation(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const result = await donationsService.confirmDonation(
        req.user.id,
        req.user.role,
        {
          ...req.body,
          hospitalId: req.user.hospitalId,
          bloodBankId: req.user.bloodBankId,
        }
      );
      res.status(200).json({
        status: 'success',
        message: 'Donation successfully verified and recorded',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async markNoShow(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const { requestId, donorId } = req.body;
      const result = await donationsService.markNoShow(requestId, donorId);
      res.status(200).json({ status: 'success', message: result.message });
    } catch (err) {
      next(err);
    }
  }

  async markNotCompleted(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const { requestId, donorId, reason } = req.body;
      const result = await donationsService.markNotCompleted(requestId, donorId, reason);
      res.status(200).json({ status: 'success', message: result.message });
    } catch (err) {
      next(err);
    }
  }

  async getMyDonations(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const donations = await donationsService.getMyDonations(req.user.id);
      res.status(200).json({ status: 'success', results: donations.length, data: { donations } });
    } catch (err) {
      next(err);
    }
  }

  async getDonationById(req: Request, res: Response, next: NextFunction) {
    try {
      const donation = await donationsService.getDonationById(req.params.id);
      res.status(200).json({ status: 'success', data: { donation } });
    } catch (err) {
      next(err);
    }
  }
}

export const donationsController = new DonationsController();
