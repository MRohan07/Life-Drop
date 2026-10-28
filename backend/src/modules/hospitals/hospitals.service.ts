import { prisma } from '../../config/database.js';
import { AppError } from '../../common/errors/AppError.js';
import { VerificationStatus } from '@prisma/client';

export class HospitalsService {
  async listHospitals(filters: { city?: string; verifiedOnly?: boolean }) {
    return await prisma.hospital.findMany({
      where: {
        ...(filters.city ? { city: { contains: filters.city, mode: 'insensitive' } } : {}),
        ...(filters.verifiedOnly ? { isVerified: true, status: VerificationStatus.VERIFIED } : {}),
      },
      include: {
        user: {
          select: { id: true, name: true, phone: true, email: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getHospitalById(id: string) {
    const hospital = await prisma.hospital.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, phone: true, email: true },
        },
      },
    });

    if (!hospital) throw AppError.notFound('Hospital not found');
    return hospital;
  }

  async getMyHospital(userId: string) {
    const hospital = await prisma.hospital.findUnique({
      where: { userId },
      include: {
        requests: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!hospital) throw AppError.notFound('Hospital profile not linked to this account');
    return hospital;
  }

  async updateMyHospital(userId: string, data: any) {
    const hospital = await prisma.hospital.findUnique({ where: { userId } });
    if (!hospital) throw AppError.notFound('Hospital not found');

    return await prisma.hospital.update({
      where: { id: hospital.id },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        website: data.website,
        image: data.image,
        address: data.address,
        area: data.area,
        city: data.city,
        state: data.state,
        pinCode: data.pinCode,
        emergencyContact: data.emergencyContact,
        services: data.services,
      },
    });
  }
}

export const hospitalsService = new HospitalsService();
