import { BloodGroup } from '@prisma/client';

/**
 * Standard red-cell compatibility mapping
 */
export const RED_CELL_COMPATIBILITY: Record<BloodGroup, BloodGroup[]> = {
  [BloodGroup.O_NEG]: [BloodGroup.O_NEG],
  [BloodGroup.O_POS]: [BloodGroup.O_POS, BloodGroup.O_NEG],
  [BloodGroup.A_NEG]: [BloodGroup.A_NEG, BloodGroup.O_NEG],
  [BloodGroup.A_POS]: [BloodGroup.A_POS, BloodGroup.A_NEG, BloodGroup.O_POS, BloodGroup.O_NEG],
  [BloodGroup.B_NEG]: [BloodGroup.B_NEG, BloodGroup.O_NEG],
  [BloodGroup.B_POS]: [BloodGroup.B_POS, BloodGroup.B_NEG, BloodGroup.O_POS, BloodGroup.O_NEG],
  [BloodGroup.AB_NEG]: [BloodGroup.AB_NEG, BloodGroup.A_NEG, BloodGroup.B_NEG, BloodGroup.O_NEG],
  [BloodGroup.AB_POS]: [
    BloodGroup.AB_POS,
    BloodGroup.AB_NEG,
    BloodGroup.A_POS,
    BloodGroup.A_NEG,
    BloodGroup.B_POS,
    BloodGroup.B_NEG,
    BloodGroup.O_POS,
    BloodGroup.O_NEG,
  ],
};

export function isBloodCompatible(recipientGroup: BloodGroup, donorGroup: BloodGroup): boolean {
  const compatible = RED_CELL_COMPATIBILITY[recipientGroup] || [];
  return compatible.includes(donorGroup);
}

export function checkEligibility(lastDonationDate: Date | null | undefined): {
  isEligible: boolean;
  nextEligibleDate: Date;
  daysRemaining: number;
} {
  const now = new Date();
  if (!lastDonationDate) {
    return {
      isEligible: true,
      nextEligibleDate: now,
      daysRemaining: 0,
    };
  }

  const nextDate = new Date(lastDonationDate);
  nextDate.setDate(nextDate.getDate() + 90);

  const diffTime = nextDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining <= 0) {
    return {
      isEligible: true,
      nextEligibleDate: now,
      daysRemaining: 0,
    };
  }

  return {
    isEligible: false,
    nextEligibleDate: nextDate,
    daysRemaining,
  };
}

export function calculateDonorRank(completedUnits: number): 'Bronze' | 'Silver' | 'Gold' | 'Platinum' {
  if (completedUnits >= 6) return 'Platinum';
  if (completedUnits >= 3) return 'Gold';
  if (completedUnits >= 1) return 'Silver';
  return 'Bronze';
}

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}
