import { Router } from 'express';
import { facilityApplicationsController } from './facility-applications.controller.js';
import { authenticateUser, authorizeRoles } from '../../common/middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

const router = Router();

// --- Public Applicant Endpoints ---
router.post('/', facilityApplicationsController.submitApplication);
router.post('/submit', facilityApplicationsController.submitApplication);
router.get('/status', facilityApplicationsController.getStatus);
router.get('/status/:referenceNumber', facilityApplicationsController.getStatus);
router.post('/check-status', facilityApplicationsController.checkStatusWithCredentials);
router.post('/status/:referenceNumber/additional-info', facilityApplicationsController.submitApplicantInfo);

// --- Public Activation Portal Endpoints ---
router.get('/activation/:token', facilityApplicationsController.verifyActivationToken);
router.post('/activation/:token', facilityApplicationsController.completeActivation);
router.post('/activate', facilityApplicationsController.completeActivation);

// --- Protected Administrator Endpoints ---
router.use(authenticateUser);
router.use(authorizeRoles(UserRole.ADMIN));

router.get('/', facilityApplicationsController.listApplications);
router.get('/:id', facilityApplicationsController.getApplicationById);
router.post('/:id/review', facilityApplicationsController.markUnderReview);
router.post('/:id/request-info', facilityApplicationsController.requestInformation);
router.post('/:id/reject', facilityApplicationsController.rejectApplication);
router.post('/:id/approve', facilityApplicationsController.approveApplication);
router.post('/:id/suspend', facilityApplicationsController.suspendFacility);

export const facilityApplicationsRoutes = router;
