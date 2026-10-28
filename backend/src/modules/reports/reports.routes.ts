import { Router } from 'express';
import { reportsController } from './reports.controller.js';
import { authenticateUser, authorizeRoles } from '../../common/middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticateUser);
router.post('/', authorizeRoles(UserRole.HOSPITAL, UserRole.ADMIN), reportsController.fileReport);

export const reportsRoutes = router;
