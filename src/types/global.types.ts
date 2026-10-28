/* @module: global.types — global application type definitions */
export * from './facility.types';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type UserRole = 'USER' | 'HOSPITAL' | 'BLOOD_BANK' | 'ADMIN';
export type EmergencyLevel = 'CRITICAL' | 'URGENT' | 'NORMAL';
export type DonorRank = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export type RequestStatus = 
  | 'SEARCHING'
  | 'ACTIVE'
  | 'PARTIALLY_FULFILLED'
  | 'RESERVED'
  | 'FULFILLED'
  | 'CLOSED'
  | 'CANCELLED'
  | 'EXPIRED';

export type DonorResponseStatus = 
  | 'NOTIFIED'
  | 'VIEWED'
  | 'ACCEPTED'
  | 'AWAITING_DONATION'
  | 'COMPLETED'
  | 'DECLINED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'NOT_COMPLETED'
  | 'EXPIRED';

export type BloodBankResponseStatus = 
  | 'PENDING'
  | 'ACCEPTED'
  | 'RESERVED'
  | 'ALLOCATED'
  | 'CONFIRMED'
  | 'RELEASED'
  | 'CANCELLED';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  dob: string;
  bloodGroup: BloodGroup;
  city: string;
  location: string;
  latitude: number;
  longitude: number;
  lastDonationDate: string | null;
  nextEligibleDate: string;
  isEligible: boolean;
  totalDonations: number;
  rank: DonorRank;
  activeCommitmentRequestId: string | null;
  status: 'ACTIVE' | 'WARNED' | 'SUSPENDED';
  warningCount: number;
  avatarUrl?: string;
}

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  designation: string;
  department: string;
  employeeId: string;
  twoFactorEnabled: boolean;
  lastPasswordChange: string;
  lastLogin: string;
  status: 'ACTIVE' | 'RESTRICTED';
}
