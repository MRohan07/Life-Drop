import { Request, Response, NextFunction } from 'express';
import { campaignsService } from './campaigns.service.js';
import { AppError } from '../../common/errors/AppError.js';

export class CampaignsController {
  async listCampaigns(req: Request, res: Response, next: NextFunction) {
    try {
      const city = req.query.city ? String(req.query.city) : undefined;
      const campaigns = await campaignsService.listCampaigns({ city });
      res.status(200).json({ status: 'success', results: campaigns.length, data: { campaigns } });
    } catch (err) {
      next(err);
    }
  }

  async getCampaignById(req: Request, res: Response, next: NextFunction) {
    try {
      const campaign = await campaignsService.getCampaignById(req.params.id);
      res.status(200).json({ status: 'success', data: { campaign } });
    } catch (err) {
      next(err);
    }
  }

  async createCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.bloodBankId) {
        throw AppError.forbidden('Only blood bank accounts can host donation drives');
      }
      const campaign = await campaignsService.createCampaign(req.user.bloodBankId, req.body);
      res.status(201).json({ status: 'success', message: 'Campaign drive announced', data: { campaign } });
    } catch (err) {
      next(err);
    }
  }

  async registerDonor(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const registration = await campaignsService.registerDonor(req.params.id, req.user.id);
      res.status(201).json({ status: 'success', message: 'Registered for blood drive camp', data: { registration } });
    } catch (err) {
      next(err);
    }
  }

  async deregisterDonor(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      await campaignsService.deregisterDonor(req.params.id, req.user.id);
      res.status(200).json({ status: 'success', message: 'Registration cancelled' });
    } catch (err) {
      next(err);
    }
  }

  async getRegistrations(req: Request, res: Response, next: NextFunction) {
    try {
      const registrations = await campaignsService.getRegistrations(req.params.id);
      res.status(200).json({ status: 'success', results: registrations.length, data: { registrations } });
    } catch (err) {
      next(err);
    }
  }
}

export const campaignsController = new CampaignsController();
