import { Request, Response, NextFunction } from 'express';
import { requestsService } from './requests.service.js';
import { AppError } from '../../common/errors/AppError.js';
import { BloodGroup, EmergencyLevel, RequestStatus, UserRole } from '@prisma/client';

export class RequestsController {
  async createRequest(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.hospitalId) {
        throw AppError.forbidden('Only verified hospital coordinators can create requisitions');
      }
      const request = await requestsService.createRequest(req.user.hospitalId, req.body);
      res.status(201).json({
        status: 'success',
        message: 'Emergency requisition created and radar broadcast initiated',
        data: { request },
      });
    } catch (err) {
      next(err);
    }
  }

  async listRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, bloodGroup, emergencyLevel, hospitalId } = req.query;
      const requests = await requestsService.listRequests({
        status: status ? (status as RequestStatus) : undefined,
        bloodGroup: bloodGroup ? (bloodGroup as BloodGroup) : undefined,
        emergencyLevel: emergencyLevel ? (emergencyLevel as EmergencyLevel) : undefined,
        hospitalId: hospitalId ? String(hospitalId) : undefined,
      });
      res.status(200).json({ status: 'success', results: requests.length, data: { requests } });
    } catch (err) {
      next(err);
    }
  }

  async getRequestById(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await requestsService.getRequestById(req.params.id);
      res.status(200).json({ status: 'success', data: { request } });
    } catch (err) {
      next(err);
    }
  }

  async donorRespond(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const { response, reason } = req.body;
      const result = await requestsService.donorRespond(
        req.params.id,
        req.user.id,
        response,
        reason
      );
      res.status(200).json({ status: 'success', message: result.message, data: result });
    } catch (err) {
      next(err);
    }
  }

  async directRequisition(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.hospitalId) {
        throw AppError.forbidden('Only verified hospital coordinators can assign requisitions');
      }
      const { bloodBankId, units } = req.body;
      const result = await requestsService.directRequisition(
        req.user.hospitalId,
        req.params.id,
        bloodBankId,
        units ? Number(units) : undefined
      );
      res.status(200).json({ status: 'success', message: result.message, data: result });
    } catch (err) {
      next(err);
    }
  }

  async donorCancelCommitment(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const { reason } = req.body;
      const result = await requestsService.donorCancelCommitment(
        req.params.id,
        req.user.id,
        reason
      );
      res.status(200).json({ status: 'success', message: result.message });
    } catch (err) {
      next(err);
    }
  }

  async bloodBankReserve(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.bloodBankId) {
        throw AppError.forbidden('Only blood bank accounts can reserve stock units');
      }
      const { units } = req.body;
      const result = await requestsService.bloodBankReserve(
        req.params.id,
        req.user.bloodBankId,
        req.user.id,
        req.user.role,
        units || 1
      );
      res.status(200).json({ status: 'success', message: result.message, data: result });
    } catch (err) {
      next(err);
    }
  }

  async bloodBankConfirmSupply(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.bloodBankId) {
        throw AppError.forbidden('Only blood bank accounts can confirm blood supply');
      }
      const result = await requestsService.bloodBankConfirmSupply(
        req.params.id,
        req.user.bloodBankId,
        req.user.id,
        req.user.role
      );
      res.status(200).json({ status: 'success', message: result.message, data: result });
    } catch (err) {
      next(err);
    }
  }

  async cancelRequest(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const { reason } = req.body;
      const result = await requestsService.cancelRequest(
        req.params.id,
        req.user.id,
        req.user.role,
        reason
      );
      res.status(200).json({ status: 'success', message: 'Requisition cancelled', data: { request: result } });
    } catch (err) {
      next(err);
    }
  }

  async fulfillRequest(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const result = await requestsService.fulfillRequest(req.params.id);
      res.status(200).json({ status: 'success', message: 'Requisition marked 100% fulfilled', data: { request: result } });
    } catch (err) {
      next(err);
    }
  }

  async deleteRequest(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const result = await requestsService.deleteRequest(
        req.params.id,
        req.user.id,
        req.user.role,
        req.user.hospitalId
      );
      res.status(200).json({ status: 'success', message: 'Requisition permanently deleted', data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const requestsController = new RequestsController();
