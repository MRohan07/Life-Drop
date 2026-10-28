import { Request, Response, NextFunction } from 'express';
import { facilityApplicationsService } from './facility-applications.service.js';
import {
  submitFacilityApplicationSchema,
  requestInfoSchema,
  applicantResponseSchema,
  rejectApplicationSchema,
  approveApplicationSchema,
  suspendFacilitySchema,
  activateFacilitySchema,
  checkStatusAuthSchema,
} from './facility-applications.validation.js';
import { ApplicationStatus, FacilityType } from '@prisma/client';

export class FacilityApplicationsController {
  /**
   * Submit registration application (Hospital or Blood Bank)
   */
  async submitApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const data = submitFacilityApplicationSchema.parse(req.body);
      const application = await facilityApplicationsService.submitApplication(data);

      res.status(201).json({
        status: 'success',
        message: 'Facility registration application submitted successfully and is awaiting administrator approval.',
        data: {
          referenceNumber: application.referenceNumber,
          status: application.status,
          name: application.name,
          facilityType: application.facilityType,
          submittedAt: application.createdAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Public applicant status check
   */
  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const referenceNumber = (req.params.referenceNumber || req.query.referenceNumber) as string;
      const email = req.query.email as string | undefined;

      const statusData = await facilityApplicationsService.getApplicationStatus(referenceNumber, email);
      res.status(200).json({
        status: 'success',
        data: statusData,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Hospital or Blood Bank checks status by entering Email/UserID and Password
   */
  async checkStatusWithCredentials(req: Request, res: Response, next: NextFunction) {
    try {
      const { identifier, password } = checkStatusAuthSchema.parse(req.body);
      const statusData = await facilityApplicationsService.checkStatusWithCredentials(identifier, password);
      res.status(200).json({
        status: 'success',
        data: statusData,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Applicant submits requested additional information
   */
  async submitApplicantInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const referenceNumber = req.params.referenceNumber as string;
      const data = applicantResponseSchema.parse(req.body);
      const application = await facilityApplicationsService.submitApplicantInfo(referenceNumber, data);

      res.status(200).json({
        status: 'success',
        message: 'Additional information submitted successfully. Your application is now back under review.',
        data: {
          referenceNumber: application.referenceNumber,
          status: application.status,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin lists applications with filters & pagination
   */
  async listApplications(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, facilityType, search, page, limit } = req.query;

      const result = await facilityApplicationsService.listApplications({
        status: status as ApplicationStatus | undefined,
        facilityType: facilityType as FacilityType | undefined,
        search: search as string | undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin inspects application details
   */
  async getApplicationById(req: Request, res: Response, next: NextFunction) {
    try {
      const application = await facilityApplicationsService.getApplicationById(req.params.id);
      res.status(200).json({
        status: 'success',
        data: { application },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin marks application as UNDER_REVIEW
   */
  async markUnderReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { notes } = req.body;
      const application = await facilityApplicationsService.markUnderReview(
        req.params.id,
        req.user!.id,
        notes
      );

      res.status(200).json({
        status: 'success',
        message: 'Application marked as under review.',
        data: { application },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin requests additional information
   */
  async requestInformation(req: Request, res: Response, next: NextFunction) {
    try {
      const { query } = requestInfoSchema.parse(req.body);
      const application = await facilityApplicationsService.requestInformation(
        req.params.id,
        req.user!.id,
        query
      );

      res.status(200).json({
        status: 'success',
        message: 'Additional information requested from applicant.',
        data: { application },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin rejects application
   */
  async rejectApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason } = rejectApplicationSchema.parse(req.body);
      const application = await facilityApplicationsService.rejectApplication(
        req.params.id,
        req.user!.id,
        reason
      );

      res.status(200).json({
        status: 'success',
        message: 'Application rejected.',
        data: { application },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin approves application and generates activation token
   */
  async approveApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const { notes } = approveApplicationSchema.parse(req.body || {});
      const result = await facilityApplicationsService.approveApplication(
        req.params.id,
        req.user!.id,
        notes
      );

      res.status(200).json({
        status: 'success',
        message: 'Facility application approved successfully. Account activation invitation generated.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Public: verify activation token
   */
  async verifyActivationToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.params.token;
      const facilityInfo = await facilityApplicationsService.verifyActivationToken(token);

      res.status(200).json({
        status: 'success',
        data: { facility: facilityInfo },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Public: complete activation with password
   */
  async completeActivation(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.params.token || req.body.token;
      const { password } = activateFacilitySchema.parse(req.body);

      const result = await facilityApplicationsService.completeActivation(token, password);

      // Set refresh cookie if available
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        status: 'success',
        message: 'Facility account successfully activated and verified.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin suspends an approved facility
   */
  async suspendFacility(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason } = suspendFacilitySchema.parse(req.body);
      const application = await facilityApplicationsService.suspendFacility(
        req.params.id,
        req.user!.id,
        reason
      );

      res.status(200).json({
        status: 'success',
        message: 'Facility suspended and operational access revoked.',
        data: { application },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const facilityApplicationsController = new FacilityApplicationsController();
