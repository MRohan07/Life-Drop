import { Request, Response, NextFunction } from 'express';
import { appointmentsService } from './appointments.service.js';
import { AppError } from '../../common/errors/AppError.js';
import { AppointmentStatus } from '@prisma/client';

export class AppointmentsController {
  async bookAppointment(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const appointment = await appointmentsService.bookAppointment(req.user.id, req.body);
      res.status(201).json({ status: 'success', message: 'Appointment booked successfully', data: { appointment } });
    } catch (err) {
      next(err);
    }
  }

  async getMyAppointments(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const appointments = await appointmentsService.getMyAppointments(req.user.id);
      res.status(200).json({ status: 'success', results: appointments.length, data: { appointments } });
    } catch (err) {
      next(err);
    }
  }

  async getBloodBankAppointments(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.bloodBankId) throw AppError.forbidden('Only blood bank staff can view facility appointments');
      const appointments = await appointmentsService.getBloodBankAppointments(req.user.bloodBankId);
      res.status(200).json({ status: 'success', results: appointments.length, data: { appointments } });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const appointment = await appointmentsService.getAppointmentById(req.params.id, req.user.id, req.user.role);
      res.status(200).json({ status: 'success', data: { appointment } });
    } catch (err) {
      next(err);
    }
  }

  async reschedule(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const appointment = await appointmentsService.rescheduleAppointment(
        req.params.id,
        req.user.id,
        req.user.role,
        req.body
      );
      res.status(200).json({ status: 'success', message: 'Appointment rescheduled successfully', data: { appointment } });
    } catch (err) {
      next(err);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const appointment = await appointmentsService.cancelAppointment(
        req.params.id,
        req.user.id,
        req.user.role,
        req.body.reason
      );
      res.status(200).json({ status: 'success', message: 'Appointment cancelled successfully', data: { appointment } });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, units } = req.body;
      const appointment = await appointmentsService.updateStatus(
        req.params.id,
        status as AppointmentStatus,
        req.user?.id,
        units ? parseInt(units, 10) : 1
      );
      res.status(200).json({ status: 'success', message: 'Status updated', data: { appointment } });
    } catch (err) {
      next(err);
    }
  }
}

export const appointmentsController = new AppointmentsController();
