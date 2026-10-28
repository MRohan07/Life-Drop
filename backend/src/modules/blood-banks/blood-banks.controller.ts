import { Request, Response, NextFunction } from 'express';
import { bloodBanksService } from './blood-banks.service.js';
import { AppError } from '../../common/errors/AppError.js';

export class BloodBanksController {
  async listBloodBanks(req: Request, res: Response, next: NextFunction) {
    try {
      const { city, verifiedOnly } = req.query;
      const bloodBanks = await bloodBanksService.listBloodBanks({
        city: city ? String(city) : undefined,
        verifiedOnly: verifiedOnly === 'true',
      });
      res.status(200).json({ status: 'success', results: bloodBanks.length, data: { bloodBanks } });
    } catch (err) {
      next(err);
    }
  }

  async getBloodBankById(req: Request, res: Response, next: NextFunction) {
    try {
      const bloodBank = await bloodBanksService.getBloodBankById(req.params.id);
      res.status(200).json({ status: 'success', data: { bloodBank } });
    } catch (err) {
      next(err);
    }
  }

  async getMyBloodBank(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const bloodBank = await bloodBanksService.getMyBloodBank(req.user.id);
      res.status(200).json({ status: 'success', data: { bloodBank } });
    } catch (err) {
      next(err);
    }
  }

  async updateMyBloodBank(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const bloodBank = await bloodBanksService.updateMyBloodBank(req.user.id, req.body);
      res.status(200).json({ status: 'success', message: 'Blood bank details updated', data: { bloodBank } });
    } catch (err) {
      next(err);
    }
  }
}

export const bloodBanksController = new BloodBanksController();
