import { prisma } from '../../config/database.js';
import { AppError } from '../../common/errors/AppError.js';
import { BloodGroup } from '@prisma/client';

export class UsersService {
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        donorProfile: {
          include: {
            availability: true,
            consent: true,
          },
        },
        hospital: true,
        bloodBank: {
          include: {
            inventoryBalances: true,
          },
        },
        adminProfile: true,
        notificationPreferences: true,
      },
    });

    if (!user) throw AppError.notFound('User account not found');
    return user;
  }

  async updateMe(
    userId: string,
    data: {
      name?: string;
      city?: string;
      location?: string;
      avatarUrl?: string;
      dob?: string;
      bloodGroup?: BloodGroup;
    }
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound('User not found');

    return await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          name: data.name,
          city: data.city,
          location: data.location,
          avatarUrl: data.avatarUrl,
          dob: data.dob ? new Date(data.dob) : undefined,
        },
      });

      if (data.bloodGroup && user.role === 'USER') {
        await tx.donorProfile.upsert({
          where: { userId },
          create: {
            userId,
            bloodGroup: data.bloodGroup,
          },
          update: {
            bloodGroup: data.bloodGroup,
          },
        });
      }

      return updatedUser;
    });
  }
}

export const usersService = new UsersService();
