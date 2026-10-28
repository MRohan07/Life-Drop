import { prisma } from '../../config/database.js';
import { AppError } from '../../common/errors/AppError.js';
import {
  BloodGroup,
  ComponentType,
  DonorResponseStatus,
  RequestStatus,
  UserRole,
  InventoryTransactionType,
} from '@prisma/client';
import { calculateDonorRank } from '../../common/utils/compatibility.js';

export class DonationsService {
  /**
   * Hospital or Blood Bank confirms an official blood donation unit
   */
  async confirmDonation(
    actorId: string,
    actorRole: UserRole,
    data: {
      donorId: string; // User ID or DonorProfile ID
      units: number;
      requestId?: string;
      hospitalId?: string;
      bloodBankId?: string;
      bloodGroup?: BloodGroup;
      componentType?: ComponentType;
      donationType?: 'EMERGENCY_RESPONSE' | 'DIRECT_WALK_IN' | 'CAMPAIGN_DRIVE';
    }
  ) {
    if (data.units <= 0) {
      throw AppError.badRequest('Donated units must be greater than zero');
    }

    const donor = await prisma.user.findFirst({
      where: {
        OR: [{ id: data.donorId }, { donorProfile: { id: data.donorId } }],
      },
      include: { donorProfile: true },
    });

    if (!donor || !donor.donorProfile) {
      throw AppError.notFound('Donor profile not found in registry');
    }

    const donorProfile = donor.donorProfile;
    const bloodGroup = data.bloodGroup || donorProfile.bloodGroup;
    const componentType = data.componentType || ComponentType.RED_BLOOD_CELLS;
    const donationType = data.donationType || (data.requestId ? 'EMERGENCY_RESPONSE' : 'DIRECT_WALK_IN');

    return await prisma.$transaction(async (tx) => {
      // 1. Prevent duplicate confirmation for this request and donor
      if (data.requestId) {
        const existingRecord = await tx.donationRecord.findFirst({
          where: {
            requestId: data.requestId,
            donorProfileId: donorProfile.id,
            status: 'CONFIRMED',
          },
        });
        if (existingRecord) {
          throw AppError.conflict('A donation record has already been confirmed for this donor on this request');
        }
      }

      // 2. Create official DonationRecord
      const record = await tx.donationRecord.create({
        data: {
          donorProfileId: donorProfile.id,
          requestId: data.requestId,
          hospitalId: data.hospitalId,
          bloodBankId: data.bloodBankId,
          bloodGroup,
          componentType,
          units: data.units,
          donationType,
          status: 'CONFIRMED',
          verifiedByActorId: actorId,
          donatedAt: new Date(),
        },
      });

      // 3. Update donor stats & 90-day cooldown
      const newTotalDonations = donorProfile.totalDonations + data.units;
      const newRank = calculateDonorRank(newTotalDonations);

      const nextEligibleDate = new Date();
      nextEligibleDate.setDate(nextEligibleDate.getDate() + 90);

      await tx.donorProfile.update({
        where: { id: donorProfile.id },
        data: {
          totalDonations: newTotalDonations,
          rank: newRank,
          lastDonationDate: new Date(),
          nextEligibleDate,
          isEligible: false,
          activeCommitmentRequestId: null,
        },
      });

      // 4. If associated with BloodRequest, update request state
      if (data.requestId) {
        const request = await tx.bloodRequest.findUnique({
          where: { id: data.requestId },
          include: { hospital: true },
        });

        if (request) {
          // Update response
          await tx.bloodRequestResponse.updateMany({
            where: {
              requestId: data.requestId,
              donorProfileId: donorProfile.id,
            },
            data: {
              status: DonorResponseStatus.COMPLETED,
              confirmedAt: new Date(),
            },
          });

          const newConfirmed = request.confirmedUnits + data.units;
          const newAllocated = Math.max(0, request.allocatedUnits - data.units);
          const newRemaining = Math.max(0, request.requiredUnits - newConfirmed);
          const newStatus = newConfirmed >= request.requiredUnits ? RequestStatus.FULFILLED : request.status;

          const timeline = Array.isArray(request.timeline) ? [...request.timeline] : [];
          timeline.push({
            title: `Donor ${donor.name} Donated ${data.units} Unit(s)`,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            description: `Transfusion staff confirmed and verified donation of ${data.units} unit(s).`,
            type: 'fulfilment',
          });

          await tx.bloodRequest.update({
            where: { id: data.requestId },
            data: {
              confirmedUnits: newConfirmed,
              allocatedUnits: newAllocated,
              remainingUnits: newRemaining,
              status: newStatus,
              timeline: timeline as any,
            },
          });
        }
      }

      // 5. If logged by Blood Bank (e.g. walk-in), increment blood bank stock
      if (data.bloodBankId) {
        const balance = await tx.inventoryBalance.upsert({
          where: {
            bloodBankId_bloodGroup_componentType: {
              bloodBankId: data.bloodBankId,
              bloodGroup,
              componentType,
            },
          },
          create: {
            bloodBankId: data.bloodBankId,
            bloodGroup,
            componentType,
            availableUnits: data.units,
            reservedUnits: 0,
            suppliedUnits: 0,
          },
          update: {
            availableUnits: { increment: data.units },
            lastReconciledAt: new Date(),
          },
        });

        // Add lot
        const lot = await tx.inventoryLot.create({
          data: {
            bloodBankId: data.bloodBankId,
            bloodGroup,
            componentType,
            batchNumber: `DON-${Date.now().toString(36).toUpperCase()}-${bloodGroup}`,
            initialUnits: data.units,
            availableUnits: data.units,
            collectionDate: new Date(),
            expiryDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000),
            status: 'AVAILABLE',
          },
        });

        // Record in ledger
        await tx.inventoryTransaction.create({
          data: {
            bloodBankId: data.bloodBankId,
            lotId: lot.id,
            bloodGroup,
            componentType,
            operationType: InventoryTransactionType.DONATION_COLLECTION,
            quantityChange: data.units,
            balanceAfter: balance.availableUnits,
            actorId,
            actorRole,
            reason: `Intake donation from donor ${donor.name}`,
          },
        });
      }

      // Notify donor of gratitude and new rank
      await tx.notification.create({
        data: {
          userId: donor.id,
          title: '🎖️ Blood Donation Confirmed — Life Saved!',
          message: `Thank you, ${donor.name}! Your donation was verified. You are now a ${newRank} Donor.`,
          type: 'success',
        },
      });

      return { record, newRank, totalDonations: newTotalDonations };
    });
  }

  /**
   * Hospital marks committed donor as NO_SHOW
   */
  async markNoShow(requestId: string, donorId: string) {
    const donor = await prisma.user.findFirst({
      where: { OR: [{ id: donorId }, { donorProfile: { id: donorId } }] },
      include: { donorProfile: true },
    });
    if (!donor || !donor.donorProfile) throw AppError.notFound('Donor not found');

    return await prisma.$transaction(async (tx) => {
      await tx.bloodRequestResponse.updateMany({
        where: {
          requestId,
          donorProfileId: donor.donorProfile!.id,
          status: 'ACCEPTED',
        },
        data: { status: DonorResponseStatus.NO_SHOW },
      });

      await tx.donorProfile.update({
        where: { id: donor.donorProfile!.id },
        data: { activeCommitmentRequestId: null },
      });

      const request = await tx.bloodRequest.findUnique({ where: { id: requestId } });
      if (request) {
        const newAllocated = Math.max(0, request.allocatedUnits - 1);
        const newRemaining = Math.max(0, request.requiredUnits - request.confirmedUnits - newAllocated);

        await tx.bloodRequest.update({
          where: { id: requestId },
          data: {
            allocatedUnits: newAllocated,
            remainingUnits: newRemaining,
            status: request.confirmedUnits > 0 ? RequestStatus.PARTIALLY_FULFILLED : RequestStatus.SEARCHING,
          },
        });
      }

      return { success: true, message: 'Donor commitment released. Radar resumed.' };
    });
  }

  /**
   * Hospital marks donor NOT_COMPLETED (clinical deferral, e.g. low hemoglobin)
   */
  async markNotCompleted(requestId: string, donorId: string, reason: string) {
    const donor = await prisma.user.findFirst({
      where: { OR: [{ id: donorId }, { donorProfile: { id: donorId } }] },
      include: { donorProfile: true },
    });
    if (!donor || !donor.donorProfile) throw AppError.notFound('Donor not found');

    return await prisma.$transaction(async (tx) => {
      await tx.bloodRequestResponse.updateMany({
        where: {
          requestId,
          donorProfileId: donor.donorProfile!.id,
        },
        data: {
          status: DonorResponseStatus.NOT_COMPLETED,
          declineReason: reason,
        },
      });

      await tx.donorProfile.update({
        where: { id: donor.donorProfile!.id },
        data: { activeCommitmentRequestId: null },
      });

      const request = await tx.bloodRequest.findUnique({ where: { id: requestId } });
      if (request) {
        const newAllocated = Math.max(0, request.allocatedUnits - 1);
        const newRemaining = Math.max(0, request.requiredUnits - request.confirmedUnits - newAllocated);

        await tx.bloodRequest.update({
          where: { id: requestId },
          data: {
            allocatedUnits: newAllocated,
            remainingUnits: newRemaining,
            status: request.confirmedUnits > 0 ? RequestStatus.PARTIALLY_FULFILLED : RequestStatus.SEARCHING,
          },
        });
      }

      return { success: true, message: 'Clinical deferral noted. Donor slot released.' };
    });
  }

  async getMyDonations(userId: string) {
    const donorProfile = await prisma.donorProfile.findUnique({ where: { userId } });
    if (!donorProfile) throw AppError.notFound('Donor profile not found');

    return await prisma.donationRecord.findMany({
      where: { donorProfileId: donorProfile.id },
      include: {
        request: {
          select: {
            id: true,
            patientName: true,
            hospital: { select: { name: true, city: true } },
          },
        },
      },
      orderBy: { donatedAt: 'desc' },
    });
  }

  async getDonationById(id: string) {
    const donation = await prisma.donationRecord.findUnique({
      where: { id },
      include: {
        donorProfile: {
          include: { user: { select: { name: true, email: true, phone: true } } },
        },
        request: true,
      },
    });
    if (!donation) throw AppError.notFound('Donation record not found');
    return donation;
  }
}

export const donationsService = new DonationsService();
