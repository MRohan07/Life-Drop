import { Router } from 'express';
import { appointmentsController } from './appointments.controller.js';
import { authenticateUser, authorizeRoles, requireVerifiedFacility } from '../../common/middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticateUser);

router.post('/', appointmentsController.bookAppointment);
router.get('/me', appointmentsController.getMyAppointments);
router.get('/facility', authorizeRoles(UserRole.BLOOD_BANK, UserRole.ADMIN), requireVerifiedFacility, appointmentsController.getBloodBankAppointments);
router.get('/:id', appointmentsController.getById);
router.patch('/:id/reschedule', appointmentsController.reschedule);
router.post('/:id/cancel', appointmentsController.cancel);
router.patch('/:id/status', authorizeRoles(UserRole.BLOOD_BANK, UserRole.ADMIN), requireVerifiedFacility, appointmentsController.updateStatus);

export const appointmentsRoutes = router;
