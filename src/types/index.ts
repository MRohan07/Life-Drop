/* @module: types/index — exports all domain types */
export * from './global.types';
export * from './feedback.types';
import {
  BloodGroup,
  EmergencyLevel,
  RequestStatus,
  DonorResponseStatus,
  BloodBankResponseStatus,
  UserRole,
} from './global.types';

export interface DonorContribution {
  donorId: string;
  donorName: string;
  bloodGroup: BloodGroup;
  phone: string;
  status: DonorResponseStatus;
  units: number;
  acceptedAt: string;
  declineReason?: string;
  cancellationReason?: string;
  confirmedAt?: string;
}

export interface BloodBankContribution {
  bloodBankId: string;
  bloodBankName: string;
  bloodGroup: BloodGroup;
  offeredUnits: number;
  allocatedUnits: number;
  status: BloodBankResponseStatus;
  reservedAt: string;
  confirmedAt?: string;
}

export interface BloodRequest {
  id: string;
  hospitalId: string;
  hospitalName: string;
  hospitalAddress: string;
  hospitalPhone: string;
  hospitalLatitude: number;
  hospitalLongitude: number;
  patientName: string;
  bloodGroup: BloodGroup;
  requiredUnits: number;
  allocatedUnits: number;
  confirmedUnits: number;
  remainingUnits: number;
  emergencyLevel: EmergencyLevel;
  requiredDateTime: string;
  contactNumber: string;
  notes?: string;
  status: RequestStatus;
  createdAt: string;
  donorContributions: DonorContribution[];
  bloodBankContributions: BloodBankContribution[];
  timeline: {
    title: string;
    timestamp: string;
    description: string;
    type: 'creation' | 'match' | 'allocation' | 'fulfilment' | 'cancel';
  }[];
}

export interface Campaign {
  id: string;
  name: string;
  bloodBankId: string;
  bloodBankName: string;
  image: string;
  date: string;
  time: string;
  location: string;
  city: string;
  latitude: number;
  longitude: number;
  description: string;
  googleFormUrl: string;
  distanceKm?: number;
}

export interface DonationAppointment {
  id: string;
  donorId: string;
  donorName: string;
  donorPhone: string;
  bloodGroup: BloodGroup;
  bloodBankId: string;
  bloodBankName: string;
  date: string;
  timeSlot: string;
  status: 'REGISTERED' | 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW';
  createdAt: string;
}

export interface UserReport {
  id: string;
  reporterHospitalId: string;
  reporterHospitalName: string;
  reportedUserId: string;
  reportedUserName: string;
  requestId: string;
  reason: 'Fraud' | 'Misuse' | 'Fake details' | 'Repeated false acceptance' | 'Suspicious activity' | 'Other';
  description: string;
  evidenceUrl?: string;
  status: 'PENDING' | 'WARNED' | 'SUSPENDED' | 'DISMISSED';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  eventType: string;
  description: string;
  actor: string;
  targetId?: string;
  details?: Record<string, any>;
}

export interface AppNotification {
  id: string;
  recipientRole: UserRole;
  recipientId?: string;
  title: string;
  message: string;
  type: 'emergency' | 'success' | 'warning' | 'info';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  requestId?: string;
  smsPreview?: string;
}
