import { prisma } from '../../config/database.js';
import { AppError } from '../../common/errors/AppError.js';
import { BloodGroup, UserRole } from '@prisma/client';
import { maskPhoneNumber, maskCoordinates } from '../../common/utils/security.js';

export class DonorsService {
  async listDonors(filters: {
    bloodGroup?: BloodGroup;
    city?: string;
    isEligible?: boolean;
    requesterRole?: UserRole;
  }) {
    const donors = await prisma.donorProfile.findMany({
      where: {
        bloodGroup: filters.bloodGroup,
        isEligible: filters.isEligible,
        user: {
          status: 'ACTIVE',
          ...(filters.city ? { city: { contains: filters.city, mode: 'insensitive' } } : {}),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            city: true,
            location: true,
            latitude: true,
            longitude: true,
            avatarUrl: true,
          },
        },
        availability: true,
        consent: true,
      },
      take: 50,
    });

    const isAuthorizedCoordinator =
      filters.requesterRole === UserRole.HOSPITAL ||
      filters.requesterRole === UserRole.BLOOD_BANK ||
      filters.requesterRole === UserRole.ADMIN;

    return donors.map((d) => {
      const sharePhone = d.consent?.sharePhoneWithHospitals && isAuthorizedCoordinator;
      const maskedPhone = sharePhone ? d.user.phone : maskPhoneNumber(d.user.phone);

      const coords =
        d.user.latitude && d.user.longitude
          ? isAuthorizedCoordinator
            ? { latitude: d.user.latitude, longitude: d.user.longitude }
            : maskCoordinates(d.user.latitude, d.user.longitude)
          : { latitude: null, longitude: null };

      return {
        id: d.user.id,
        donorProfileId: d.id,
        name: d.user.name,
        phone: maskedPhone,
        bloodGroup: d.bloodGroup,
        city: d.user.city,
        location: d.user.location,
        latitude: coords.latitude,
        longitude: coords.longitude,
        avatarUrl: d.user.avatarUrl,
        isEligible: d.isEligible,
        lastDonationDate: d.lastDonationDate,
        nextEligibleDate: d.nextEligibleDate,
        totalDonations: d.totalDonations,
        rank: d.rank,
        activeCommitmentRequestId: d.activeCommitmentRequestId,
        isAvailable: d.availability?.isAvailable ?? true,
      };
    });
  }

  async getDonorById(id: string, requesterRole?: UserRole) {
    const donor = await prisma.donorProfile.findFirst({
      where: { OR: [{ id }, { userId: id }] },
      include: {
        user: true,
        availability: true,
        consent: true,
      },
    });

    if (!donor) throw AppError.notFound('Donor not found');

    const isAuthorizedCoordinator =
      requesterRole === UserRole.HOSPITAL ||
      requesterRole === UserRole.BLOOD_BANK ||
      requesterRole === UserRole.ADMIN;

    return {
      ...donor,
      user: {
        ...donor.user,
        phone: isAuthorizedCoordinator ? donor.user.phone : maskPhoneNumber(donor.user.phone),
        passwordHash: undefined,
      },
    };
  }

  async updateAvailability(userId: string, data: { isAvailable?: boolean; preferredRadiusKm?: number; emergencyOnly?: boolean }) {
    const donorProfile = await prisma.donorProfile.findUnique({ where: { userId } });
    if (!donorProfile) throw AppError.notFound('Donor profile not found');

    return await prisma.donorAvailability.upsert({
      where: { donorProfileId: donorProfile.id },
      create: {
        donorProfileId: donorProfile.id,
        ...data,
      },
      update: data,
    });
  }

  async updateConsent(userId: string, data: { sharePhoneWithHospitals?: boolean; allowEmergencyRadar?: boolean; allowSmsNotifications?: boolean }) {
    const donorProfile = await prisma.donorProfile.findUnique({ where: { userId } });
    if (!donorProfile) throw AppError.notFound('Donor profile not found');

    return await prisma.donorConsent.upsert({
      where: { donorProfileId: donorProfile.id },
      create: {
        donorProfileId: donorProfile.id,
        ...data,
      },
      update: data,
    });
  }

  async getDonationHistory(userId: string) {
    const donorProfile = await prisma.donorProfile.findUnique({ where: { userId } });
    if (!donorProfile) throw AppError.notFound('Donor profile not found');

    return await prisma.donationRecord.findMany({
      where: { donorProfileId: donorProfile.id },
      include: {
        request: {
          select: {
            id: true,
            patientName: true,
            hospital: { select: { name: true } },
          },
        },
      },
      orderBy: { donatedAt: 'desc' },
    });
  }
}

export const donorsService = new DonorsService();
