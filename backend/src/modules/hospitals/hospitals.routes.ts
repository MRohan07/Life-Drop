import { Router } from 'express';
import { hospitalsController } from './hospitals.controller.js';
import { authenticateUser, authorizeRoles, optionalAuth } from '../../common/middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

const router = Router();

router.get('/', optionalAuth, hospitalsController.listHospitals);
router.get('/me', authenticateUser, authorizeRoles(UserRole.HOSPITAL, UserRole.ADMIN), hospitalsController.getMyHospital);
router.patch('/me', authenticateUser, authorizeRoles(UserRole.HOSPITAL, UserRole.ADMIN), hospitalsController.updateMyHospital);
router.get('/:id', optionalAuth, hospitalsController.getHospitalById);

export const hospitalsRoutes = router;
