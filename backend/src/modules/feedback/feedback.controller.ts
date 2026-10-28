import { Request, Response, NextFunction } from 'express';
import { feedbackService } from './feedback.service.js';
import { AppError } from '../../common/errors/AppError.js';

export class FeedbackController {
  async submitFeedback(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const feedback = await feedbackService.submitFeedback(req.user.id, req.body);
      res.status(201).json({ status: 'success', message: 'Thank you! Your feedback has been submitted.', data: { feedback } });
    } catch (err) {
      next(err);
    }
  }

  async listFeedback(req: Request, res: Response, next: NextFunction) {
    try {
      const feedbacks = await feedbackService.listFeedback();
      res.status(200).json({ status: 'success', results: feedbacks.length, data: { feedbacks } });
    } catch (err) {
      next(err);
    }
  }
}

export const feedbackController = new FeedbackController();
