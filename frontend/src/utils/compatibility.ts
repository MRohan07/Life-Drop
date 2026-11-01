import { BloodGroup, DonorRank } from '../types';

/**
 * Red-cell compatibility mapping:
 * Recipient (Patient) Blood Group -> Array of compatible Donor Blood Groups
 */
export const RED_CELL_COMPATIBILITY: Record<BloodGroup, BloodGroup[]> = {
  'O-': ['O-'],
  'O+': ['O+', 'O-'],
  'A-': ['A-', 'O-'],
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
};

/**
 * Checks if a donor blood group is compatible for a patient's blood group
 */
export function isBloodCompatible(recipientGroup: BloodGroup, donorGroup: BloodGroup): boolean {
  const compatibleDonors = RED_CELL_COMPATIBILITY[recipientGroup] || [];
  return compatibleDonors.includes(donorGroup);
}

/**
 * Calculates next eligible date (90 days after last donation) and current eligibility status
 */
export function checkEligibility(lastDonationDateStr: string | null): {
  isEligible: boolean;
  nextEligibleDate: string;
  daysRemaining: number;
  progressPercent: number; // 0% (just donated) to 100% (eligible)
} {
  if (!lastDonationDateStr) {
    const today = new Date().toISOString().split('T')[0];
    return {
      isEligible: true,
      nextEligibleDate: today,
      daysRemaining: 0,
      progressPercent: 100,
    };
  }

  const lastDate = new Date(lastDonationDateStr);
  const nextDate = new Date(lastDate);
  nextDate.setDate(lastDate.getDate() + 90);

  const today = new Date();
  const diffTime = nextDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const nextEligibleDate = nextDate.toISOString().split('T')[0];

  if (daysRemaining <= 0) {
    return {
      isEligible: true,
      nextEligibleDate,
      daysRemaining: 0,
      progressPercent: 100,
    };
  }

  const elapsedDays = Math.max(0, 90 - daysRemaining);
  const progressPercent = Math.min(100, Math.round((elapsedDays / 90) * 100));

  return {
    isEligible: false,
    nextEligibleDate,
    daysRemaining,
    progressPercent,
  };
}

/**
 * Calculates donor rank based ONLY on confirmed completed donations
 */
export function calculateDonorRank(confirmedDonations: number): DonorRank {
  if (confirmedDonations >= 6) return 'Platinum';
  if (confirmedDonations >= 3) return 'Gold';
  if (confirmedDonations >= 1) return 'Silver';
  return 'Bronze';
}

/**
 * Haversine formula to compute distance in km between two GPS coordinates
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}
