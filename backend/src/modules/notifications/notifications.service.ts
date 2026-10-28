import { prisma } from '../../config/database.js';
import { AppError } from '../../common/errors/AppError.js';

export class NotificationsService {
  async getMyNotifications(userId: string) {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 40,
    });
  }

  async markAsRead(id: string, userId: string) {
    const notif = await prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notif) throw AppError.notFound('Notification not found');

    return await prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async getPreferences(userId: string) {
    return await prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  async updatePreferences(userId: string, data: any) {
    return await prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }
}

export const notificationsService = new NotificationsService();
