import { Router } from 'express';
import { feedbackController } from './feedback.controller.js';
import { authenticateUser, optionalAuth } from '../../common/middleware/auth.middleware.js';

const router = Router();

router.get('/', optionalAuth, feedbackController.listFeedback);
router.post('/', authenticateUser, feedbackController.submitFeedback);

export const feedbackRoutes = router;
