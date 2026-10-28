import { Request, Response, NextFunction } from 'express';
import { donorsService } from './donors.service.js';
import { BloodGroup } from '@prisma/client';
import { AppError } from '../../common/errors/AppError.js';

export class DonorsController {
  async listDonors(req: Request, res: Response, next: NextFunction) {
    try {
      const { bloodGroup, city, isEligible } = req.query;
      const donors = await donorsService.listDonors({
        bloodGroup: bloodGroup ? (bloodGroup as BloodGroup) : undefined,
        city: city ? String(city) : undefined,
        isEligible: isEligible !== undefined ? isEligible === 'true' : undefined,
        requesterRole: req.user?.role,
      });
      res.status(200).json({ status: 'success', results: donors.length, data: { donors } });
    } catch (err) {
      next(err);
    }
  }

  async getDonorById(req: Request, res: Response, next: NextFunction) {
    try {
      const donor = await donorsService.getDonorById(req.params.id, req.user?.role);
      res.status(200).json({ status: 'success', data: { donor } });
    } catch (err) {
      next(err);
    }
  }

  async updateAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const availability = await donorsService.updateAvailability(req.user.id, req.body);
      res.status(200).json({ status: 'success', message: 'Availability updated', data: { availability } });
    } catch (err) {
      next(err);
    }
  }

  async updateConsent(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const consent = await donorsService.updateConsent(req.user.id, req.body);
      res.status(200).json({ status: 'success', message: 'Consent preferences updated', data: { consent } });
    } catch (err) {
      next(err);
    }
  }

  async getDonationHistory(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const history = await donorsService.getDonationHistory(req.user.id);
      res.status(200).json({ status: 'success', results: history.length, data: { history } });
    } catch (err) {
      next(err);
    }
  }
}

export const donorsController = new DonorsController();
