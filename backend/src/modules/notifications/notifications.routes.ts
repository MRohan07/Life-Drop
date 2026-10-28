import { Router } from 'express';
import { notificationsController } from './notifications.controller.js';
import { authenticateUser } from '../../common/middleware/auth.middleware.js';

const router = Router();

router.use(authenticateUser);

router.get('/', notificationsController.getMyNotifications);
router.patch('/:id/read', notificationsController.markAsRead);
router.post('/read-all', notificationsController.markAllAsRead);

export const notificationsRoutes = router;
