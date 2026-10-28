/* @module: facility.types — Hospital and Blood Bank institutional schemas */
import { BloodGroup } from './global.types';

export interface BloodInventoryItem {
  bloodGroup: BloodGroup;
  available: number;
  reserved: number;
  supplied: number;
}

export interface Hospital {
  id: string;
  name: string;
  type?: 'Government' | 'Private' | 'Trust / NGO' | 'Other';
  registrationNumber?: string;
  phone: string;
  email: string;
  website?: string;
  image: string;
  address: string;
  area?: string;
  city: string;
  state?: string;
  pinCode?: string;
  latitude: number;
  longitude: number;
  services: string[];
  licenseNumber: string;
  issuingAuthority?: string;
  licenseIssueDate?: string;
  licenseExpiryDate?: string;
  licenseDocUrl?: string;
  registrationCertUrl?: string;
  authorizedPersonName?: string;
  authorizedPersonDesignation?: string;
  authorizedPersonPhone?: string;
  authorizedPersonEmail?: string;
  emergencyContact?: string;
  emergencyServiceAvailable?: boolean;
  is24x7Emergency?: boolean;
  isVerified: boolean;
  status: 'PENDING_APPROVAL' | 'VERIFIED' | 'REJECTED';
  submittedDate: string;
}

export interface BloodBank {
  id: string;
  name: string;
  type?: 'Government' | 'Private' | 'Hospital Blood Bank' | 'NGO / Trust' | 'Other';
  registrationNumber?: string;
  phone: string;
  email: string;
  image: string;
  address: string;
  area?: string;
  city: string;
  state?: string;
  pinCode?: string;
  latitude: number;
  longitude: number;
  componentsAvailable?: string[];
  emergencySupplyAvailable?: boolean;
  is24x7Service?: boolean;
  licenseNumber: string;
  issuingAuthority?: string;
  licenseIssueDate?: string;
  licenseExpiryDate?: string;
  licenseDocUrl?: string;
  registrationCertUrl?: string;
  authorizedPersonName?: string;
  authorizedPersonDesignation?: string;
  authorizedPersonPhone?: string;
  authorizedPersonEmail?: string;
  isVerified: boolean;
  status: 'PENDING_APPROVAL' | 'VERIFIED' | 'REJECTED';
  inventory: Record<BloodGroup, BloodInventoryItem>;
  submittedDate: string;
}
