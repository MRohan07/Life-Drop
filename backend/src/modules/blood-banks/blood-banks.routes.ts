import { Router } from 'express';
import { bloodBanksController } from './blood-banks.controller.js';
import { authenticateUser, authorizeRoles, optionalAuth } from '../../common/middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

const router = Router();

router.get('/', optionalAuth, bloodBanksController.listBloodBanks);
router.get('/me', authenticateUser, authorizeRoles(UserRole.BLOOD_BANK, UserRole.ADMIN), bloodBanksController.getMyBloodBank);
router.patch('/me', authenticateUser, authorizeRoles(UserRole.BLOOD_BANK, UserRole.ADMIN), bloodBanksController.updateMyBloodBank);
router.get('/:id', optionalAuth, bloodBanksController.getBloodBankById);

export const bloodBanksRoutes = router;
