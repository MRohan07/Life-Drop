import { Router } from 'express';
import { campaignsController } from './campaigns.controller.js';
import { authenticateUser, authorizeRoles, optionalAuth } from '../../common/middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

const router = Router();

router.get('/', optionalAuth, campaignsController.listCampaigns);
router.post('/', authenticateUser, authorizeRoles(UserRole.BLOOD_BANK, UserRole.ADMIN), campaignsController.createCampaign);
router.get('/:id', optionalAuth, campaignsController.getCampaignById);
router.post('/:id/register', authenticateUser, authorizeRoles(UserRole.USER), campaignsController.registerDonor);
router.delete('/:id/register', authenticateUser, authorizeRoles(UserRole.USER), campaignsController.deregisterDonor);
router.get('/:id/registrations', authenticateUser, authorizeRoles(UserRole.BLOOD_BANK, UserRole.ADMIN), campaignsController.getRegistrations);

export const campaignsRoutes = router;
