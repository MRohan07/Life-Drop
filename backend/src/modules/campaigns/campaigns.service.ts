import { prisma } from '../../config/database.js';
import { AppError } from '../../common/errors/AppError.js';

export class CampaignsService {
  async listCampaigns(filters: { city?: string }) {
    return await prisma.campaign.findMany({
      where: {
        status: 'ACTIVE',
        ...(filters.city ? { city: { contains: filters.city, mode: 'insensitive' } } : {}),
      },
      include: {
        bloodBank: { select: { id: true, name: true, phone: true } },
        _count: { select: { registrations: true } },
      },
      orderBy: { date: 'asc' },
    });
  }

  async getCampaignById(id: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        bloodBank: true,
        _count: { select: { registrations: true } },
      },
    });
    if (!campaign) throw AppError.notFound('Campaign not found');
    return campaign;
  }

  async createCampaign(
    bloodBankId: string,
    data: {
      name: string;
      image?: string;
      date: string;
      timeSlot: string;
      location: string;
      city: string;
      latitude?: number;
      longitude?: number;
      description: string;
      googleFormUrl?: string;
      targetUnits?: number;
    }
  ) {
    return await prisma.campaign.create({
      data: {
        bloodBankId,
        name: data.name,
        image: data.image,
        date: new Date(data.date),
        timeSlot: data.timeSlot,
        location: data.location,
        city: data.city,
        latitude: data.latitude || 16.305,
        longitude: data.longitude || 80.437,
        description: data.description,
        googleFormUrl: data.googleFormUrl,
        targetUnits: data.targetUnits || 50,
      },
    });
  }

  async registerDonor(campaignId: string, userId: string) {
    const donorProfile = await prisma.donorProfile.findUnique({ where: { userId } });
    if (!donorProfile) throw AppError.notFound('Donor profile not found');

    return await prisma.$transaction(async (tx) => {
      // Row lock on Campaign to prevent concurrent oversubscription race conditions
      await tx.$executeRaw`SELECT id FROM "Campaign" WHERE id = ${campaignId} FOR UPDATE`;

      const campaign = await tx.campaign.findUnique({
        where: { id: campaignId },
        include: { _count: { select: { registrations: true } } },
      });
      if (!campaign) throw AppError.notFound('Campaign not found');

      if (campaign._count.registrations >= campaign.targetUnits) {
        throw AppError.badRequest('Campaign has reached maximum donor capacity');
      }

      const existing = await tx.campaignRegistration.findUnique({
        where: {
          campaignId_donorProfileId: {
            campaignId,
            donorProfileId: donorProfile.id,
          },
        },
      });

      if (existing) {
        throw AppError.conflict('You have already registered for this blood drive camp');
      }

      return await tx.campaignRegistration.create({
        data: {
          campaignId,
          donorProfileId: donorProfile.id,
        },
      });
    });
  }

  async deregisterDonor(campaignId: string, userId: string) {
    const donorProfile = await prisma.donorProfile.findUnique({ where: { userId } });
    if (!donorProfile) throw AppError.notFound('Donor profile not found');

    return await prisma.campaignRegistration.deleteMany({
      where: {
        campaignId,
        donorProfileId: donorProfile.id,
      },
    });
  }

  async getRegistrations(campaignId: string) {
    return await prisma.campaignRegistration.findMany({
      where: { campaignId },
      include: {
        donorProfile: {
          include: {
            user: { select: { name: true, phone: true, email: true } },
          },
        },
      },
      orderBy: { registeredAt: 'asc' },
    });
  }
}

export const campaignsService = new CampaignsService();
