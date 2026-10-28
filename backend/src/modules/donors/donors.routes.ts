import { Router } from 'express';
import { donorsController } from './donors.controller.js';
import { authenticateUser, optionalAuth } from '../../common/middleware/auth.middleware.js';

const router = Router();

router.get('/', optionalAuth, donorsController.listDonors);
router.get('/me/donation-history', authenticateUser, donorsController.getDonationHistory);
router.patch('/me/availability', authenticateUser, donorsController.updateAvailability);
router.patch('/me/consent', authenticateUser, donorsController.updateConsent);
router.get('/:id', optionalAuth, donorsController.getDonorById);

export const donorsRoutes = router;
