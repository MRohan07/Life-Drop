import { prisma } from '../../config/database.js';
import { AppError } from '../../common/errors/AppError.js';
import { AppointmentStatus } from '@prisma/client';

export class AppointmentsService {
  async bookAppointment(userId: string, data: { bloodBankId: string; date: string; timeSlot: string }) {
    const donorProfile = await prisma.donorProfile.findUnique({ where: { userId } });
    if (!donorProfile) throw AppError.notFound('Donor profile not found');

    const appointment = await prisma.donationAppointment.create({
      data: {
        donorProfileId: donorProfile.id,
        bloodBankId: data.bloodBankId,
        date: new Date(data.date),
        timeSlot: data.timeSlot,
        status: AppointmentStatus.REGISTERED,
      },
      include: {
        bloodBank: { select: { id: true, name: true, phone: true, address: true } },
      },
    });

    return appointment;
  }

  async getMyAppointments(userId: string) {
    const donorProfile = await prisma.donorProfile.findUnique({ where: { userId } });
    if (!donorProfile) throw AppError.notFound('Donor profile not found');

    return await prisma.donationAppointment.findMany({
      where: { donorProfileId: donorProfile.id },
      include: {
        bloodBank: { select: { id: true, name: true, phone: true, address: true } },
      },
      orderBy: { date: 'asc' },
    });
  }

  async getBloodBankAppointments(bloodBankId: string) {
    return await prisma.donationAppointment.findMany({
      where: { bloodBankId },
      include: {
        donorProfile: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
          },
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  async getAppointmentById(id: string, userId: string, role: string) {
    const appointment = await prisma.donationAppointment.findUnique({
      where: { id },
      include: {
        bloodBank: { select: { id: true, name: true, phone: true, address: true } },
        donorProfile: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
          },
        },
      },
    });
    if (!appointment) throw AppError.notFound('Appointment not found');
    if (role === 'USER' && appointment.donorProfile.userId !== userId) {
      throw AppError.forbidden('Access denied to this appointment');
    }
    return appointment;
  }

  async rescheduleAppointment(id: string, userId: string, role: string, data: { date: string; timeSlot: string }) {
    const appointment = await prisma.donationAppointment.findUnique({
      where: { id },
      include: { donorProfile: true },
    });
    if (!appointment) throw AppError.notFound('Appointment not found');
    if (role === 'USER' && appointment.donorProfile.userId !== userId) {
      throw AppError.forbidden('Cannot reschedule an appointment that does not belong to you');
    }
    if (appointment.status === AppointmentStatus.COMPLETED || appointment.status === AppointmentStatus.CANCELLED) {
      throw AppError.badRequest(`Cannot reschedule an appointment in ${appointment.status} status`);
    }
    return await prisma.donationAppointment.update({
      where: { id },
      data: {
        date: new Date(data.date),
        timeSlot: data.timeSlot,
      },
      include: {
        bloodBank: { select: { id: true, name: true, phone: true, address: true } },
      },
    });
  }

  async cancelAppointment(id: string, userId: string, role: string, reason?: string) {
    const appointment = await prisma.donationAppointment.findUnique({
      where: { id },
      include: { donorProfile: true },
    });
    if (!appointment) throw AppError.notFound('Appointment not found');
    if (role === 'USER' && appointment.donorProfile.userId !== userId) {
      throw AppError.forbidden('Cannot cancel an appointment that does not belong to you');
    }
    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw AppError.badRequest('Cannot cancel a completed donation appointment');
    }
    return await prisma.donationAppointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CANCELLED,
      },
      include: {
        bloodBank: { select: { id: true, name: true, phone: true, address: true } },
      },
    });
  }

  async updateStatus(id: string, status: AppointmentStatus, staffUserId?: string, units: number = 1) {
    const appointment = await prisma.donationAppointment.findUnique({
      where: { id },
      include: {
        donorProfile: true,
        bloodBank: true,
      },
    });
    if (!appointment) throw AppError.notFound('Appointment not found');

    if (status === AppointmentStatus.COMPLETED && appointment.status !== AppointmentStatus.COMPLETED) {
      return await prisma.$transaction(async (tx) => {
        const updatedAppt = await tx.donationAppointment.update({
          where: { id },
          data: { status },
          include: {
            bloodBank: { select: { id: true, name: true, phone: true, address: true } },
          },
        });

        await tx.donationRecord.create({
          data: {
            donorProfileId: appointment.donorProfileId,
            bloodBankId: appointment.bloodBankId,
            bloodGroup: appointment.donorProfile.bloodGroup,
            componentType: 'RED_BLOOD_CELLS',
            units,
            donationType: 'DIRECT_WALK_IN',
            status: 'VERIFIED',
            verifiedByActorId: staffUserId || appointment.bloodBank.userId || 'system',
            donatedAt: new Date(),
          },
        });

        const newTotal = (appointment.donorProfile.totalDonations || 0) + units;
        let newRank = appointment.donorProfile.rank;
        if (newTotal >= 10) newRank = 'Platinum';
        else if (newTotal >= 6) newRank = 'Gold';
        else if (newTotal >= 3) newRank = 'Silver';

        await tx.donorProfile.update({
          where: { id: appointment.donorProfileId },
          data: {
            totalDonations: newTotal,
            rank: newRank,
            lastDonationDate: new Date(),
          },
        });

        return updatedAppt;
      });
    }

    return await prisma.donationAppointment.update({
      where: { id },
      data: { status },
      include: {
        bloodBank: { select: { id: true, name: true, phone: true, address: true } },
      },
    });
  }
}

export const appointmentsService = new AppointmentsService();
