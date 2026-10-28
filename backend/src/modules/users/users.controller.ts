import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service.js';
import { AppError } from '../../common/errors/AppError.js';

export class UsersController {
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const user = await usersService.getMe(req.user.id);
      res.status(200).json({ status: 'success', data: { user } });
    } catch (err) {
      next(err);
    }
  }

  async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const user = await usersService.updateMe(req.user.id, req.body);
      res.status(200).json({ status: 'success', message: 'Profile updated successfully', data: { user } });
    } catch (err) {
      next(err);
    }
  }
}

export const usersController = new UsersController();
