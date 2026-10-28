import { Router } from 'express';
import { adminController } from './admin.controller.js';
import { authenticateUser, authorizeRoles } from '../../common/middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticateUser);
router.use(authorizeRoles(UserRole.ADMIN));

router.get('/dashboard', adminController.getDashboardStats);
router.get('/users', adminController.listUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.get('/hospitals', adminController.listHospitals);
router.patch('/hospitals/:id/verification', adminController.updateHospitalVerification);
router.get('/blood-banks', adminController.listBloodBanks);
router.patch('/blood-banks/:id/verification', adminController.updateBloodBankVerification);
router.get('/reports', adminController.listReports);
router.patch('/reports/:id', adminController.resolveReport);
router.get('/audit-logs', adminController.listAuditLogs);
router.post('/feedback/:id/reply', adminController.replyFeedback);

export const adminRoutes = router;
