import { Request, Response, NextFunction } from 'express';
import { hospitalsService } from './hospitals.service.js';
import { AppError } from '../../common/errors/AppError.js';

export class HospitalsController {
  async listHospitals(req: Request, res: Response, next: NextFunction) {
    try {
      const { city, verifiedOnly } = req.query;
      const hospitals = await hospitalsService.listHospitals({
        city: city ? String(city) : undefined,
        verifiedOnly: verifiedOnly === 'true',
      });
      res.status(200).json({ status: 'success', results: hospitals.length, data: { hospitals } });
    } catch (err) {
      next(err);
    }
  }

  async getHospitalById(req: Request, res: Response, next: NextFunction) {
    try {
      const hospital = await hospitalsService.getHospitalById(req.params.id);
      res.status(200).json({ status: 'success', data: { hospital } });
    } catch (err) {
      next(err);
    }
  }

  async getMyHospital(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const hospital = await hospitalsService.getMyHospital(req.user.id);
      res.status(200).json({ status: 'success', data: { hospital } });
    } catch (err) {
      next(err);
    }
  }

  async updateMyHospital(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const hospital = await hospitalsService.updateMyHospital(req.user.id, req.body);
      res.status(200).json({ status: 'success', message: 'Hospital details updated', data: { hospital } });
    } catch (err) {
      next(err);
    }
  }
}

export const hospitalsController = new HospitalsController();
