import { prisma } from '../../config/database.js';
import { FeedbackExperienceType } from '@prisma/client';

export class FeedbackService {
  async submitFeedback(
    userId: string,
    data: {
      rating: number;
      experienceType?: FeedbackExperienceType;
      relatedRequestId?: string;
      facilityName?: string;
      aspects?: string[];
      comments: string;
      suggestions?: string;
    }
  ) {
    return await prisma.feedbackSubmission.create({
      data: {
        userId,
        rating: data.rating,
        experienceType: data.experienceType || FeedbackExperienceType.DONATION,
        relatedRequestId: data.relatedRequestId,
        facilityName: data.facilityName,
        aspects: data.aspects || [],
        comments: data.comments,
        suggestions: data.suggestions,
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });
  }

  async listFeedback() {
    return await prisma.feedbackSubmission.findMany({
      include: {
        user: { select: { id: true, name: true, role: true, phone: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}

export const feedbackService = new FeedbackService();
