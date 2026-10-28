import { Router } from 'express';
import { inventoryController } from './inventory.controller.js';
import { authenticateUser, authorizeRoles, requireVerifiedFacility } from '../../common/middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticateUser);
router.use(authorizeRoles(UserRole.BLOOD_BANK, UserRole.ADMIN));
router.use(requireVerifiedFacility);

router.get('/', inventoryController.getMyInventory);
router.post('/stock', inventoryController.addStock);
router.post('/adjustments', inventoryController.adjustStock);
router.get('/transactions', inventoryController.getTransactions);
router.get('/expiring', inventoryController.getExpiringLots);

export const inventoryRoutes = router;
