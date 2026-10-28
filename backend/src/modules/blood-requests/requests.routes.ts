import { Router } from 'express';
import { requestsController } from './requests.controller.js';
import { authenticateUser, authorizeRoles, optionalAuth, requireVerifiedFacility } from '../../common/middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

const router = Router();

router.get('/', optionalAuth, requestsController.listRequests);
router.post('/', authenticateUser, authorizeRoles(UserRole.HOSPITAL, UserRole.ADMIN), requireVerifiedFacility, requestsController.createRequest);
router.get('/:id', optionalAuth, requestsController.getRequestById);
router.post('/:id/direct-requisition', authenticateUser, authorizeRoles(UserRole.HOSPITAL, UserRole.ADMIN), requireVerifiedFacility, requestsController.directRequisition);
router.post('/:id/responses', authenticateUser, authorizeRoles(UserRole.USER), requestsController.donorRespond);
router.post('/:id/cancel-commitment', authenticateUser, authorizeRoles(UserRole.USER), requestsController.donorCancelCommitment);
router.post('/:id/reservations', authenticateUser, authorizeRoles(UserRole.BLOOD_BANK), requireVerifiedFacility, requestsController.bloodBankReserve);
router.post('/:id/confirm-supply', authenticateUser, authorizeRoles(UserRole.BLOOD_BANK), requireVerifiedFacility, requestsController.bloodBankConfirmSupply);
router.post('/:id/cancel', authenticateUser, authorizeRoles(UserRole.HOSPITAL, UserRole.ADMIN), requireVerifiedFacility, requestsController.cancelRequest);
router.post('/:id/fulfill', authenticateUser, authorizeRoles(UserRole.HOSPITAL, UserRole.ADMIN), requireVerifiedFacility, requestsController.fulfillRequest);
router.delete('/:id', authenticateUser, authorizeRoles(UserRole.HOSPITAL, UserRole.ADMIN), requireVerifiedFacility, requestsController.deleteRequest);

export const requestsRoutes = router;
