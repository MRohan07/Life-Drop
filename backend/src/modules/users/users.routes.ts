import { Router } from 'express';
import { usersController } from './users.controller.js';
import { authenticateUser } from '../../common/middleware/auth.middleware.js';

const router = Router();

router.use(authenticateUser);

router.get('/me', usersController.getMe);
router.patch('/me', usersController.updateMe);

export const usersRoutes = router;
