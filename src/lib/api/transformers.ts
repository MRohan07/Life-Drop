/* @module: api/transformers — Adapts backend database payloads to frontend component models */
import {
  BloodRequest,
  Hospital,
  BloodBank,
  UserProfile,
  Campaign,
  UserReport,
  AuditLog,
  AppNotification,
  DonationAppointment,
  FeedbackSubmission,
  BloodGroup,
} from '../../types';
import { normalizeBloodGroup } from './client';

export function transformBackendRequest(r: any): BloodRequest {
  const bg = normalizeBloodGroup(r.bloodGroup) as BloodGroup;

  const donorContributions = (r.donorContributions || []).map((c: any) => ({
    donorId: c.donorProfile?.userId || c.donorProfileId || c.donorId,
    donorName: c.donorProfile?.user?.name || c.donorName || 'Donor',
    bloodGroup: normalizeBloodGroup(c.donorProfile?.bloodGroup || c.bloodGroup) as BloodGroup,
    phone: c.donorProfile?.user?.phone || c.phone || '',
    status: c.status,
    units: c.units,
    acceptedAt: c.acceptedAt ? new Date(c.acceptedAt).toISOString().slice(0, 16).replace('T', ' ') : '',
    confirmedAt: c.confirmedAt ? new Date(c.confirmedAt).toISOString().slice(0, 16).replace('T', ' ') : undefined,
    declineReason: c.declineReason,
    cancellationReason: c.cancellationReason,
  }));

  const bloodBankContributions = (r.bloodBankContributions || []).map((b: any) => ({
    bloodBankId: b.bloodBankId,
    bloodBankName: b.bloodBank?.name || b.bloodBankName || 'Blood Bank',
    bloodGroup: normalizeBloodGroup(b.bloodGroup) as BloodGroup,
    offeredUnits: b.offeredUnits,
    allocatedUnits: b.allocatedUnits,
    status: b.status,
    reservedAt: b.reservedAt ? new Date(b.reservedAt).toISOString().slice(0, 16).replace('T', ' ') : '',
    confirmedAt: b.confirmedAt ? new Date(b.confirmedAt).toISOString().slice(0, 16).replace('T', ' ') : undefined,
  }));

  return {
    id: r.id,
    hospitalId: r.hospitalId,
    hospitalName: r.hospital?.name || r.hospitalName || 'General Hospital',
    hospitalAddress: r.hospital?.address || r.hospitalAddress || '',
    hospitalPhone: r.hospital?.phone || r.hospitalPhone || '',
    hospitalLatitude: r.hospital?.latitude ?? r.hospitalLatitude ?? 16.3,
    hospitalLongitude: r.hospital?.longitude ?? r.hospitalLongitude ?? 80.4,
    patientName: r.patientName,
    bloodGroup: bg,
    requiredUnits: r.requiredUnits,
    allocatedUnits: r.allocatedUnits ?? 0,
    confirmedUnits: r.confirmedUnits ?? 0,
    remainingUnits: r.remainingUnits ?? r.requiredUnits,
    emergencyLevel: r.emergencyLevel,
    requiredDateTime: typeof r.requiredDateTime === 'string' ? r.requiredDateTime : new Date(r.requiredDateTime).toISOString().slice(0, 16).replace('T', ' '),
    contactNumber: r.contactNumber,
    notes: r.notes || '',
    status: r.status,
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date(r.createdAt).toISOString().slice(0, 16).replace('T', ' '),
    donorContributions,
    bloodBankContributions,
    timeline: Array.isArray(r.timeline) ? r.timeline : [],
  };
}

export function transformBackendBloodBank(b: any): BloodBank {
  const inventory: any = {};
  const allGroups = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] as BloodGroup[];

  allGroups.forEach((g) => {
    inventory[g] = {
      bloodGroup: g,
      available: 0,
      reserved: 0,
      supplied: 0,
    };
  });

  if (b.inventory) {
    Object.keys(b.inventory).forEach((k) => {
      const norm = normalizeBloodGroup(k) as BloodGroup;
      const item = b.inventory[k] || {};
      inventory[norm] = {
        bloodGroup: norm,
        available: Number(item.available ?? item.availableUnits ?? 0),
        reserved: Number(item.reserved ?? item.reservedUnits ?? 0),
        supplied: Number(item.supplied ?? item.suppliedUnits ?? 0),
      };
    });
  }

  if (Array.isArray(b.inventoryBalances)) {
    b.inventoryBalances.forEach((bal: any) => {
      const norm = normalizeBloodGroup(bal.bloodGroup) as BloodGroup;
      inventory[norm] = {
        bloodGroup: norm,
        available: Number(bal.availableUnits ?? bal.available ?? 0),
        reserved: Number(bal.reservedUnits ?? bal.reserved ?? 0),
        supplied: Number(bal.suppliedUnits ?? bal.supplied ?? 0),
      };
    });
  }

  return {
    id: b.id,
    name: b.name,
    type: b.type,
    registrationNumber: b.registrationNumber,
    phone: b.phone,
    email: b.email,
    image: b.image || 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=600&auto=format&fit=crop&q=80',
    address: b.address,
    area: b.area,
    city: b.city,
    state: b.state,
    pinCode: b.pinCode,
    latitude: b.latitude,
    longitude: b.longitude,
    componentsAvailable: b.componentsAvailable || ['Whole Blood', 'Packed Red Blood Cells', 'Plasma', 'Platelets'],
    emergencySupplyAvailable: b.emergencySupplyAvailable ?? true,
    is24x7Service: b.is24x7Service ?? true,
    licenseNumber: b.licenseNumber || 'BB-AP-2026',
    isVerified: b.isVerified ?? false,
    status: b.status,
    submittedDate: b.submittedDate ? new Date(b.submittedDate).toISOString().slice(0, 10) : '2026-01-01',
    inventory,
  };
}

export function transformBackendHospital(h: any): Hospital {
  return {
    id: h.id,
    name: h.name,
    type: h.type,
    registrationNumber: h.registrationNumber,
    phone: h.phone,
    email: h.email,
    website: h.website,
    image: h.image || 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&auto=format&fit=crop&q=80',
    address: h.address,
    area: h.area,
    city: h.city,
    state: h.state,
    pinCode: h.pinCode,
    latitude: h.latitude,
    longitude: h.longitude,
    services: h.services || [],
    licenseNumber: h.licenseNumber || 'HOSP-AP-2026',
    isVerified: h.isVerified ?? false,
    status: h.status,
    submittedDate: h.submittedDate ? new Date(h.submittedDate).toISOString().slice(0, 10) : '2026-01-01',
  };
}

export function transformBackendDonor(d: any): UserProfile {
  return {
    id: d.id,
    name: d.name,
    phone: d.phone,
    email: d.email || `${d.id.toLowerCase()}@lifedrop.io`,
    dob: d.dob ? new Date(d.dob).toISOString().slice(0, 10) : '1998-01-01',
    bloodGroup: normalizeBloodGroup(d.bloodGroup) as BloodGroup,
    city: d.city || 'Guntur',
    location: d.location || 'Guntur',
    latitude: d.latitude ?? 16.3067,
    longitude: d.longitude ?? 80.4365,
    lastDonationDate: d.lastDonationDate ? new Date(d.lastDonationDate).toISOString().slice(0, 10) : null,
    nextEligibleDate: d.nextEligibleDate ? new Date(d.nextEligibleDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    isEligible: d.isEligible ?? true,
    totalDonations: d.totalDonations ?? 0,
    rank: d.rank || 'Bronze',
    activeCommitmentRequestId: d.activeCommitmentRequestId || null,
    status: d.status || 'ACTIVE',
    warningCount: d.warningCount || 0,
    avatarUrl: d.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  };
}

export function transformBackendCampaign(c: any): Campaign {
  return {
    id: c.id,
    name: c.name,
    bloodBankId: c.bloodBankId,
    bloodBankName: c.bloodBank?.name || 'Authorized Blood Center',
    image: c.image || 'https://images.unsplash.com/photo-1536856136534-bb679c52a9aa?w=600&auto=format&fit=crop&q=80',
    date: c.date ? new Date(c.date).toISOString().slice(0, 10) : '2026-09-05',
    time: c.timeSlot || '09:00 AM - 05:00 PM',
    location: c.location,
    city: c.city,
    latitude: c.latitude,
    longitude: c.longitude,
    description: c.description,
    googleFormUrl: c.googleFormUrl || '',
    distanceKm: 1.5,
  };
}
