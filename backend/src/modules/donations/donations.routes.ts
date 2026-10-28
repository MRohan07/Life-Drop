import { Router } from 'express';
import { donationsController } from './donations.controller.js';
import { authenticateUser, authorizeRoles } from '../../common/middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticateUser);

router.post(
  '/confirm',
  authorizeRoles(UserRole.HOSPITAL, UserRole.BLOOD_BANK, UserRole.ADMIN),
  donationsController.confirmDonation
);

router.post(
  '/mark-no-show',
  authorizeRoles(UserRole.HOSPITAL, UserRole.BLOOD_BANK, UserRole.ADMIN),
  donationsController.markNoShow
);

router.post(
  '/mark-not-completed',
  authorizeRoles(UserRole.HOSPITAL, UserRole.BLOOD_BANK, UserRole.ADMIN),
  donationsController.markNotCompleted
);

router.get('/me', donationsController.getMyDonations);
router.get('/:id', donationsController.getDonationById);

export const donationsRoutes = router;
