/* @module: feedback.types — User, Hospital & Blood Bank Feedback schemas */
import { UserRole } from './global.types';

export type FeedbackExperienceType = 'DONATION' | 'COORDINATION' | 'PLATFORM' | 'GENERAL';

export interface FeedbackAdminReply {
  replyId: string;
  adminName: string;
  adminEmail?: string;
  message: string;
  status: 'RESOLVED' | 'INVESTIGATING' | 'ACKNOWLEDGED';
  repliedAt: string;
}

export interface FeedbackSubmission {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  userEmail?: string;
  userPhone?: string;
  userBloodGroup?: string;
  rating: number; // 1 to 5 stars
  experienceType?: FeedbackExperienceType;
  relatedRequestId?: string;
  facilityName?: string;
  aspects?: string[];
  comments: string;
  suggestions?: string;
  createdAt: string;
  status?: 'SUBMITTED' | 'REVIEWED' | 'FEATURED' | 'RESOLVED' | 'INVESTIGATING' | 'ACKNOWLEDGED';
  adminReply?: FeedbackAdminReply;
}
