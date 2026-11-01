import { BloodRequest, RequestStatus } from '../types';

export interface AllocationUpdateResult {
  updatedRequest: BloodRequest;
  fulfilledJustNow: boolean;
  releasedDonorIds: string[];
  releasedBloodBankIds: string[];
  message: string;
}

/**
 * Recalculates and enforces the strict allocation cap for a BloodRequest.
 * Rule: Required = Confirmed + Remaining (Remaining = Math.max(0, Required - Confirmed))
 * Total Allocated + Confirmed NEVER exceeds RequiredUnits.
 */
export function recalculateRequestFulfillment(request: BloodRequest): BloodRequest {
  const confirmedFromDonors = request.donorContributions
    .filter((d) => d.status === 'COMPLETED')
    .reduce((sum, d) => sum + d.units, 0);

  const confirmedFromBB = request.bloodBankContributions
    .filter((b) => b.status === 'CONFIRMED')
    .reduce((sum, b) => sum + b.allocatedUnits, 0);

  const confirmedUnits = confirmedFromDonors + confirmedFromBB;
  const remainingUnits = Math.max(0, request.requiredUnits - confirmedUnits);

  // Active accepted donors awaiting donation
  const activeDonors = request.donorContributions.filter(
    (d) => d.status === 'ACCEPTED' || d.status === 'AWAITING_DONATION'
  );

  // Active reserved blood bank units
  const activeBB = request.bloodBankContributions.filter(
    (b) => b.status === 'RESERVED' || b.status === 'ALLOCATED'
  );

  let allocatedUnits = 0;
  const neededAllocationSlots = remainingUnits;

  // Allocate first from BB or Donors without exceeding neededAllocationSlots
  for (const bb of activeBB) {
    if (allocatedUnits + bb.allocatedUnits <= neededAllocationSlots) {
      allocatedUnits += bb.allocatedUnits;
    } else {
      // Partial or excess release
      bb.allocatedUnits = Math.max(0, neededAllocationSlots - allocatedUnits);
      allocatedUnits += bb.allocatedUnits;
      if (bb.allocatedUnits === 0) {
        bb.status = 'RELEASED';
      }
    }
  }

  for (const d of activeDonors) {
    if (allocatedUnits + d.units <= neededAllocationSlots) {
      allocatedUnits += d.units;
    } else {
      d.status = 'DECLINED';
      d.declineReason = 'Request requirement already fulfilled by other sources';
    }
  }

  let newStatus: RequestStatus = request.status;
  if (confirmedUnits >= request.requiredUnits) {
    newStatus = 'FULFILLED';
  } else if (confirmedUnits > 0 || allocatedUnits > 0) {
    newStatus = allocatedUnits + confirmedUnits >= request.requiredUnits ? 'RESERVED' : 'PARTIALLY_FULFILLED';
  } else if (request.status !== 'CLOSED' && request.status !== 'CANCELLED') {
    newStatus = 'SEARCHING';
  }

  return {
    ...request,
    confirmedUnits,
    allocatedUnits,
    remainingUnits,
    status: newStatus,
  };
}
