import { Request, Response, NextFunction } from 'express';
import { notificationsService } from './notifications.service.js';
import { AppError } from '../../common/errors/AppError.js';

export class NotificationsController {
  async getMyNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const notifications = await notificationsService.getMyNotifications(req.user.id);
      res.status(200).json({ status: 'success', results: notifications.length, data: { notifications } });
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const notification = await notificationsService.markAsRead(req.params.id, req.user.id);
      res.status(200).json({ status: 'success', message: 'Notification marked as read', data: { notification } });
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      await notificationsService.markAllAsRead(req.user.id);
      res.status(200).json({ status: 'success', message: 'All notifications marked as read' });
    } catch (err) {
      next(err);
    }
  }

  async getPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const preferences = await notificationsService.getPreferences(req.user.id);
      res.status(200).json({ status: 'success', data: { preferences } });
    } catch (err) {
      next(err);
    }
  }

  async updatePreferences(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const preferences = await notificationsService.updatePreferences(req.user.id, req.body);
      res.status(200).json({ status: 'success', message: 'Preferences updated', data: { preferences } });
    } catch (err) {
      next(err);
    }
  }
}

export const notificationsController = new NotificationsController();
