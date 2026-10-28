import { prisma } from '../../config/database.js';
import { AppError } from '../../common/errors/AppError.js';
import {
  BloodGroup,
  EmergencyLevel,
  RequestStatus,
  DonorResponseStatus,
  BloodBankResponseStatus,
  InventoryTransactionType,
  ComponentType,
  UserRole,
} from '@prisma/client';
import { isBloodCompatible, checkEligibility } from '../../common/utils/compatibility.js';

export class RequestsService {
  /**
   * Create an emergency or routine blood requisition
   */
  async createRequest(
    hospitalId: string,
    data: {
      patientName: string;
      bloodGroup: BloodGroup;
      componentType?: ComponentType;
      requiredUnits: number;
      emergencyLevel: EmergencyLevel;
      requiredDateTime: string;
      contactNumber: string;
      notes?: string;
      targetBloodBankId?: string;
      bloodBankId?: string;
    }
  ) {
    if (data.requiredUnits <= 0) {
      throw AppError.badRequest('Required units must be greater than zero');
    }

    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
    });
    if (!hospital) throw AppError.notFound('Hospital not found');

    const targetBankId = data.targetBloodBankId || data.bloodBankId;
    let targetBank: any = null;
    if (targetBankId) {
      targetBank = await prisma.bloodBank.findUnique({
        where: { id: targetBankId },
      });
      if (!targetBank) throw AppError.notFound('Target blood bank not found');
    }

    const componentType = data.componentType || ComponentType.RED_BLOOD_CELLS;
    const requiredDateTime = new Date(data.requiredDateTime);
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const initialTimeline = targetBank
      ? [
          {
            title: 'Direct Transfer Requisition Created',
            timestamp: nowStr,
            description: `${hospital.name} initiated direct inter-facility requisition for ${data.requiredUnits} unit(s) of ${data.bloodGroup} directed to ${targetBank.name}.`,
            type: 'creation',
          },
          {
            title: 'Requisition Awaiting Blood Bank Approval',
            timestamp: nowStr,
            description: `Requisition submitted to ${targetBank.name}. Cold storage units awaiting blood bank approval and reservation before clinical dispatch.`,
            type: 'allocation',
          },
        ]
      : [
          {
            title: 'Emergency Request Created',
            timestamp: nowStr,
            description: `${hospital.name} initiated emergency requisition for ${data.requiredUnits} unit(s) of ${data.bloodGroup} blood.`,
            type: 'creation',
          },
          {
            title: 'Radar Broadcast Initiated',
            timestamp: nowStr,
            description: `Searching compatible nearby donors and registered blood banks in ${hospital.city} region.`,
            type: 'match',
          },
        ];

    // Idempotency / duplicate submission protection (within 3.5 seconds)
    const recentDuplicate = await prisma.bloodRequest.findFirst({
      where: {
        hospitalId,
        patientName: data.patientName,
        bloodGroup: data.bloodGroup,
        requiredUnits: data.requiredUnits,
        createdAt: { gte: new Date(Date.now() - 3500) },
      },
      include: {
        hospital: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            city: true,
            latitude: true,
            longitude: true,
          },
        },
        donorContributions: {
          include: {
            donorProfile: {
              include: {
                user: { select: { id: true, name: true, phone: true } },
              },
            },
          },
        },
        bloodBankContributions: {
          include: {
            bloodBank: { select: { id: true, name: true, phone: true } },
          },
        },
      },
    });

    if (recentDuplicate) {
      return recentDuplicate;
    }

    const bloodRequest = await prisma.bloodRequest.create({
      data: {
        hospitalId,
        patientName: data.patientName,
        bloodGroup: data.bloodGroup,
        componentType,
        requiredUnits: data.requiredUnits,
        allocatedUnits: 0,
        confirmedUnits: 0,
        remainingUnits: data.requiredUnits,
        emergencyLevel: data.emergencyLevel,
        requiredDateTime,
        contactNumber: data.contactNumber,
        notes: data.notes,
        status: RequestStatus.SEARCHING,
        timeline: initialTimeline as any,
      },
      include: {
        hospital: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            city: true,
            latitude: true,
            longitude: true,
          },
        },
        donorContributions: {
          include: {
            donorProfile: {
              include: {
                user: { select: { id: true, name: true, phone: true } },
              },
            },
          },
        },
        bloodBankContributions: {
          include: {
            bloodBank: { select: { id: true, name: true, phone: true } },
          },
        },
      },
    });

    if (targetBankId && targetBank) {
      // 1. Atomically create Pending Reservation linking target blood bank
      const reservation = await prisma.inventoryReservation.create({
        data: {
          requestId: bloodRequest.id,
          bloodBankId: targetBankId,
          bloodGroup: data.bloodGroup,
          componentType,
          offeredUnits: data.requiredUnits,
          allocatedUnits: 0,
          status: BloodBankResponseStatus.PENDING,
        },
        include: {
          bloodBank: { select: { id: true, name: true, phone: true } },
        },
      });

      // 2. Alert blood bank coordinators via in-app notification
      if (targetBank.userId) {
        await prisma.notification.create({
          data: {
            userId: targetBank.userId,
            title: `🏥 Direct Requisition from ${hospital.name}`,
            message: `${hospital.name} requested ${data.requiredUnits} unit(s) of ${data.bloodGroup} for patient ${data.patientName}. Blood bank approval required.`,
            type: 'emergency',
            actionUrl: 'bb-requests',
            requestId: bloodRequest.id,
          },
        });
      }

      bloodRequest.bloodBankContributions = [reservation as any];
    } else {
      // Notify nearby compatible voluntary donors for public broadcasts
      const eligibleDonors = await prisma.donorProfile.findMany({
        where: {
          isEligible: true,
          user: { status: 'ACTIVE' },
        },
        include: { user: true, consent: true },
      });

      for (const donor of eligibleDonors) {
        if (isBloodCompatible(data.bloodGroup, donor.bloodGroup)) {
          await prisma.notification.create({
            data: {
              userId: donor.userId,
              title: `🚨 Emergency ${data.bloodGroup} Blood Needed in ${hospital.city}`,
              message: `${hospital.name} urgently requires ${data.requiredUnits} unit(s) for patient ${data.patientName}.`,
              type: 'emergency',
              actionUrl: 'user-requests',
              requestId: bloodRequest.id,
            },
          });
        }
      }
    }

    return bloodRequest;
  }

  /**
   * Assign an existing hospital requisition directly to a blood bank (Pending Approval)
   */
  async directRequisition(
    hospitalId: string,
    requestId: string,
    bloodBankId: string,
    units?: number
  ) {
    return await prisma.$transaction(async (tx) => {
      const request = await tx.bloodRequest.findUnique({
        where: { id: requestId },
        include: { hospital: true },
      });
      if (!request) throw AppError.notFound('Blood request not found');
      if (request.hospitalId !== hospitalId) {
        throw AppError.forbidden('You can only assign requisitions created by your hospital');
      }

      const bank = await tx.bloodBank.findUnique({ where: { id: bloodBankId } });
      if (!bank) throw AppError.notFound('Blood bank not found');

      const unitsToRequest = units && units > 0 ? units : request.remainingUnits;

      // Find or create pending reservation
      let reservation = await tx.inventoryReservation.findFirst({
        where: { requestId, bloodBankId },
      });

      if (reservation) {
        reservation = await tx.inventoryReservation.update({
          where: { id: reservation.id },
          data: {
            offeredUnits: unitsToRequest,
            allocatedUnits: 0,
            status: BloodBankResponseStatus.PENDING,
          },
          include: {
            bloodBank: { select: { id: true, name: true, phone: true } },
          },
        });
      } else {
        reservation = await tx.inventoryReservation.create({
          data: {
            requestId,
            bloodBankId,
            bloodGroup: request.bloodGroup,
            componentType: request.componentType,
            offeredUnits: unitsToRequest,
            allocatedUnits: 0,
            status: BloodBankResponseStatus.PENDING,
          },
          include: {
            bloodBank: { select: { id: true, name: true, phone: true } },
          },
        });
      }

      // Recalculate active allocations for the request (only counting active RESERVED or ALLOCATED)
      const allActiveReservations = await tx.inventoryReservation.findMany({
        where: {
          requestId,
          status: { in: [BloodBankResponseStatus.RESERVED, BloodBankResponseStatus.ALLOCATED] },
        },
      });
      const totalBankAllocated = allActiveReservations.reduce((s, r) => s + r.allocatedUnits, 0);

      const allActiveDonors = await tx.bloodRequestResponse.findMany({
        where: {
          requestId,
          status: DonorResponseStatus.ACCEPTED,
        },
      });
      const totalDonorAllocated = allActiveDonors.reduce((s: number, d) => s + d.units, 0);

      const activeAllocated = totalBankAllocated + totalDonorAllocated;
      let newRequiredUnits = request.requiredUnits;
      const currentAvailableCapacity = Math.max(0, newRequiredUnits - request.confirmedUnits - activeAllocated);
      if (unitsToRequest > currentAvailableCapacity) {
        newRequiredUnits = request.confirmedUnits + activeAllocated + unitsToRequest;
      }
      const newRemainingUnits = Math.max(0, newRequiredUnits - request.confirmedUnits - activeAllocated);
      const newStatus =
        request.confirmedUnits >= newRequiredUnits
          ? RequestStatus.FULFILLED
          : activeAllocated >= newRequiredUnits
          ? RequestStatus.RESERVED
          : activeAllocated > 0
          ? RequestStatus.PARTIALLY_FULFILLED
          : RequestStatus.SEARCHING;

      const timeline = Array.isArray(request.timeline) ? [...request.timeline] : [];
      timeline.push({
        title: `Direct Transfer Requisition: ${bank.name}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        description: `Direct transfer requisition submitted to ${bank.name} for ${unitsToRequest} unit(s) of ${request.bloodGroup}. Awaiting blood bank approval.`,
        type: 'allocation',
      });

      const updatedRequest = await tx.bloodRequest.update({
        where: { id: requestId },
        data: {
          requiredUnits: newRequiredUnits,
          allocatedUnits: activeAllocated,
          remainingUnits: newRemainingUnits,
          status: newStatus,
          timeline: timeline as any,
        },
        include: {
          hospital: {
            select: {
              id: true,
              name: true,
              address: true,
              phone: true,
              city: true,
              latitude: true,
              longitude: true,
            },
          },
          donorContributions: {
            include: {
              donorProfile: {
                include: {
                  user: { select: { id: true, name: true, phone: true } },
                },
              },
            },
          },
          bloodBankContributions: {
            include: { bloodBank: { select: { id: true, name: true, phone: true } } },
          },
        },
      });

      // Notify blood bank user
      if (bank.userId) {
        await tx.notification.create({
          data: {
            userId: bank.userId,
            title: `🏥 Direct Requisition from ${request.hospital.name}`,
            message: `${request.hospital.name} requested ${unitsToRequest} unit(s) of ${request.bloodGroup} for patient ${request.patientName}. Blood bank approval required.`,
            type: 'emergency',
            actionUrl: 'bb-requests',
            requestId: request.id,
          },
        });
      }

      return {
        success: true,
        message: `Direct requisition successfully submitted to ${bank.name}. Awaiting approval.`,
        reservation,
        request: updatedRequest,
      };
    });
  }

  /**
   * Query blood requests with filters
   */
  async listRequests(filters: {
    status?: RequestStatus;
    bloodGroup?: BloodGroup;
    emergencyLevel?: EmergencyLevel;
    hospitalId?: string;
  }) {
    return await prisma.bloodRequest.findMany({
      where: {
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.bloodGroup ? { bloodGroup: filters.bloodGroup } : {}),
        ...(filters.emergencyLevel ? { emergencyLevel: filters.emergencyLevel } : {}),
        ...(filters.hospitalId ? { hospitalId: filters.hospitalId } : {}),
      },
      include: {
        hospital: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            city: true,
            latitude: true,
            longitude: true,
          },
        },
        donorContributions: {
          include: {
            donorProfile: {
              include: {
                user: { select: { id: true, name: true, phone: true } },
              },
            },
          },
        },
        bloodBankContributions: {
          include: {
            bloodBank: { select: { id: true, name: true, phone: true } },
          },
        },
      },
      orderBy: [{ emergencyLevel: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Get single request with complete contributions & timeline
   */
  async getRequestById(id: string) {
    const request = await prisma.bloodRequest.findUnique({
      where: { id },
      include: {
        hospital: true,
        donorContributions: {
          include: {
            donorProfile: {
              include: {
                user: { select: { id: true, name: true, phone: true, avatarUrl: true } },
              },
            },
          },
        },
        bloodBankContributions: {
          include: {
            bloodBank: true,
          },
        },
      },
    });

    if (!request) throw AppError.notFound('Blood requisition not found');
    return request;
  }

  /**
   * Donor responds to emergency request (ACCEPT or DECLINE)
   */
  async donorRespond(
    requestId: string,
    userId: string,
    response: 'ACCEPT' | 'DECLINE',
    reason?: string
  ) {
    const donorProfile = await prisma.donorProfile.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!donorProfile) throw AppError.notFound('Donor profile not found');

    if (response === 'ACCEPT') {
      // Cooldown check
      const { isEligible, daysRemaining } = checkEligibility(donorProfile.lastDonationDate);
      if (!isEligible) {
        throw AppError.badRequest(
          `You are in 90-day cooldown. You will be eligible in ${daysRemaining} day(s).`
        );
      }

      if (donorProfile.activeCommitmentRequestId && donorProfile.activeCommitmentRequestId !== requestId) {
        throw AppError.badRequest(
          'You already have an active blood donation commitment pending.'
        );
      }
    }

    return await prisma.$transaction(async (tx) => {
      const request = await tx.bloodRequest.findUnique({
        where: { id: requestId },
        include: {
          donorContributions: true,
          bloodBankContributions: true,
          hospital: true,
        },
      });

      if (!request) throw AppError.notFound('Request not found');

      if (request.status === 'FULFILLED' || request.status === 'CLOSED' || request.status === 'CANCELLED') {
        throw AppError.badRequest(`Cannot accept request in status ${request.status}`);
      }

      if (response === 'ACCEPT') {
        if (!isBloodCompatible(request.bloodGroup, donorProfile.bloodGroup)) {
          throw AppError.badRequest(
            `Donor blood group (${donorProfile.bloodGroup}) is not compatible with patient requirement (${request.bloodGroup})`
          );
        }
      }

      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

      if (response === 'DECLINE') {
        await tx.bloodRequestResponse.upsert({
          where: {
            requestId_donorProfileId: {
              requestId,
              donorProfileId: donorProfile.id,
            },
          },
          create: {
            requestId,
            donorProfileId: donorProfile.id,
            status: DonorResponseStatus.DECLINED,
            declineReason: reason || 'Donor unavailable',
          },
          update: {
            status: DonorResponseStatus.DECLINED,
            declineReason: reason || 'Donor unavailable',
          },
        });

        return { success: true, message: 'Response recorded: Request declined' };
      }

      // ACCEPT Workflow
      const unitsNeeded = Math.max(0, request.requiredUnits - request.confirmedUnits - request.allocatedUnits);
      if (unitsNeeded <= 0) {
        throw AppError.badRequest('This requisition already has all required units allocated or confirmed');
      }

      await tx.bloodRequestResponse.upsert({
        where: {
          requestId_donorProfileId: {
            requestId,
            donorProfileId: donorProfile.id,
          },
        },
        create: {
          requestId,
          donorProfileId: donorProfile.id,
          status: DonorResponseStatus.ACCEPTED,
          units: 1,
          acceptedAt: new Date(),
        },
        update: {
          status: DonorResponseStatus.ACCEPTED,
          units: 1,
          acceptedAt: new Date(),
        },
      });

      // Update donor active commitment
      await tx.donorProfile.update({
        where: { id: donorProfile.id },
        data: { activeCommitmentRequestId: requestId },
      });

      // Recalculate request units
      const newAllocated = request.allocatedUnits + 1;
      const newRemaining = Math.max(0, request.requiredUnits - request.confirmedUnits - newAllocated);
      const newStatus =
        request.confirmedUnits + newAllocated >= request.requiredUnits
          ? RequestStatus.RESERVED
          : RequestStatus.PARTIALLY_FULFILLED;

      const timeline = Array.isArray(request.timeline) ? [...request.timeline] : [];
      timeline.push({
        title: `Donor ${donorProfile.user.name} Accepted`,
        timestamp: nowStr,
        description: `Voluntary donor ${donorProfile.user.name} committed 1 unit of ${donorProfile.bloodGroup}.`,
        type: 'allocation',
      });

      const updatedRequest = await tx.bloodRequest.update({
        where: { id: requestId },
        data: {
          allocatedUnits: newAllocated,
          remainingUnits: newRemaining,
          status: newStatus,
          timeline: timeline as any,
        },
      });

      // Notify hospital
      await tx.notification.create({
        data: {
          userId: request.hospital.userId,
          title: `🩸 Donor Match for Request #${requestId}`,
          message: `${donorProfile.user.name} accepted your request for patient ${request.patientName}.`,
          type: 'success',
          requestId,
        },
      });

      return {
        success: true,
        message: 'Commitment registered! Please proceed to the hospital transfusion counter.',
        request: updatedRequest,
      };
    });
  }

  /**
   * Donor cancels active commitment
   */
  async donorCancelCommitment(requestId: string, userId: string, reason?: string) {
    const donorProfile = await prisma.donorProfile.findUnique({ where: { userId } });
    if (!donorProfile) throw AppError.notFound('Donor profile not found');

    return await prisma.$transaction(async (tx) => {
      const response = await tx.bloodRequestResponse.findUnique({
        where: {
          requestId_donorProfileId: {
            requestId,
            donorProfileId: donorProfile.id,
          },
        },
      });

      if (!response || response.status !== 'ACCEPTED') {
        throw AppError.badRequest('No active acceptance to cancel');
      }

      await tx.bloodRequestResponse.update({
        where: { id: response.id },
        data: {
          status: DonorResponseStatus.CANCELLED,
          cancellationReason: reason || 'Donor cancelled commitment',
        },
      });

      await tx.donorProfile.update({
        where: { id: donorProfile.id },
        data: { activeCommitmentRequestId: null },
      });

      const request = await tx.bloodRequest.findUnique({ where: { id: requestId } });
      if (request) {
        const newAllocated = Math.max(0, request.allocatedUnits - response.units);
        const newRemaining = Math.max(0, request.requiredUnits - request.confirmedUnits - newAllocated);
        const newStatus =
          request.confirmedUnits > 0 || newAllocated > 0
            ? RequestStatus.PARTIALLY_FULFILLED
            : RequestStatus.SEARCHING;

        const timeline = Array.isArray(request.timeline) ? [...request.timeline] : [];
        timeline.push({
          title: 'Donor Commitment Cancelled',
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          description: `Commitment was released. Radar search resumed.`,
          type: 'cancel',
        });

        await tx.bloodRequest.update({
          where: { id: requestId },
          data: {
            allocatedUnits: newAllocated,
            remainingUnits: newRemaining,
            status: newStatus,
            timeline: timeline as any,
          },
        });
      }

      return { success: true, message: 'Commitment successfully released' };
    });
  }

  /**
   * Blood bank reserves stock units for an emergency request
   */
  async bloodBankReserve(
    requestId: string,
    bloodBankId: string,
    actorId: string,
    actorRole: UserRole,
    unitsToReserve: number
  ) {
    if (unitsToReserve <= 0) {
      throw AppError.badRequest('Units to reserve must be greater than zero');
    }

    return await prisma.$transaction(async (tx) => {
      const request = await tx.bloodRequest.findUnique({
        where: { id: requestId },
        include: { hospital: true },
      });
      if (!request) throw AppError.notFound('Blood request not found');

      const bank = await tx.bloodBank.findUnique({ where: { id: bloodBankId } });
      if (!bank) throw AppError.notFound('Blood bank not found');

      // Check available stock in blood bank balance
      const balance = await tx.inventoryBalance.findUnique({
        where: {
          bloodBankId_bloodGroup_componentType: {
            bloodBankId,
            bloodGroup: request.bloodGroup,
            componentType: request.componentType,
          },
        },
      });

      if (!balance || balance.availableUnits < unitsToReserve) {
        throw AppError.badRequest(
          `Insufficient available stock. Blood bank has ${balance?.availableUnits ?? 0} unit(s) available.`
        );
      }

      // Check if this blood bank had an existing active reservation counted in request.allocatedUnits
      const existingRes = await tx.inventoryReservation.findFirst({
        where: {
          requestId,
          bloodBankId,
        },
      });

      const previouslyActiveAllocated =
        existingRes &&
        (existingRes.status === BloodBankResponseStatus.RESERVED ||
          existingRes.status === BloodBankResponseStatus.ALLOCATED)
          ? existingRes.allocatedUnits
          : 0;

      const baseAllocated = Math.max(0, request.allocatedUnits - previouslyActiveAllocated);
      const maxCanAllocate = Math.max(0, request.requiredUnits - request.confirmedUnits - baseAllocated);
      if (unitsToReserve > maxCanAllocate) {
        throw AppError.badRequest(
          `Cannot allocate ${unitsToReserve} units. Request only requires ${maxCanAllocate} more unit(s).`
        );
      }

      // 1. Update Blood Bank Balance
      await tx.inventoryBalance.update({
        where: { id: balance.id },
        data: {
          availableUnits: { decrement: unitsToReserve },
          reservedUnits: { increment: unitsToReserve },
          lastReconciledAt: new Date(),
        },
      });

      // 2. Create or Update Reservation (support approving PENDING direct requisitions)
      let reservation;
      if (existingRes) {
        reservation = await tx.inventoryReservation.update({
          where: { id: existingRes.id },
          data: {
            status: BloodBankResponseStatus.RESERVED,
            offeredUnits: Math.max(existingRes.offeredUnits, unitsToReserve),
            allocatedUnits: unitsToReserve,
            reservedAt: new Date(),
          },
          include: {
            bloodBank: { select: { id: true, name: true, phone: true } },
          },
        });
      } else {
        reservation = await tx.inventoryReservation.create({
          data: {
            requestId,
            bloodBankId,
            bloodGroup: request.bloodGroup,
            componentType: request.componentType,
            offeredUnits: unitsToReserve,
            allocatedUnits: unitsToReserve,
            status: BloodBankResponseStatus.RESERVED,
          },
          include: {
            bloodBank: { select: { id: true, name: true, phone: true } },
          },
        });
      }

      // 3. Record in ledger
      await tx.inventoryTransaction.create({
        data: {
          bloodBankId,
          bloodGroup: request.bloodGroup,
          componentType: request.componentType,
          operationType: InventoryTransactionType.RESERVATION_HOLD,
          quantityChange: -unitsToReserve,
          balanceAfter: balance.availableUnits - unitsToReserve,
          relatedRequestId: requestId,
          relatedReservationId: reservation.id,
          actorId,
          actorRole,
          reason: `Reserved ${unitsToReserve} unit(s) for emergency request #${requestId}`,
        },
      });

      // 4. Update request allocation
      const newAllocated = baseAllocated + unitsToReserve;
      const newRemaining = Math.max(0, request.requiredUnits - request.confirmedUnits - newAllocated);
      const newStatus =
        request.confirmedUnits + newAllocated >= request.requiredUnits
          ? RequestStatus.RESERVED
          : RequestStatus.PARTIALLY_FULFILLED;

      const timeline = Array.isArray(request.timeline) ? [...request.timeline] : [];
      timeline.push({
        title: `${bank.name} Approved & Reserved ${unitsToReserve} Unit(s)`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        description: `Approved requisition and reserved ${unitsToReserve} unit(s) of ${request.bloodGroup} in cold vault awaiting dispatch confirmation.`,
        type: 'allocation',
      });

      const updatedRequest = await tx.bloodRequest.update({
        where: { id: requestId },
        data: {
          allocatedUnits: newAllocated,
          remainingUnits: newRemaining,
          status: newStatus,
          timeline: timeline as any,
        },
      });

      // 5. Notify hospital coordinator
      if (request.hospital?.userId) {
        await tx.notification.create({
          data: {
            userId: request.hospital.userId,
            title: `✅ Blood Bank Approved Requisition: ${bank.name}`,
            message: `${bank.name} approved and reserved ${unitsToReserve} unit(s) of ${request.bloodGroup}. Ready for clinical dispatch.`,
            type: 'allocation',
            actionUrl: 'hospital-requests',
            requestId: request.id,
          },
        });
      }

      return {
        success: true,
        message: `Successfully approved and reserved ${unitsToReserve} unit(s) for Request #${requestId}`,
        reservation,
        request: updatedRequest,
      };
    });
  }

  /**
   * Blood bank confirms dispatch and clinical delivery of reserved units (Blood Confirmation)
   */
  async bloodBankConfirmSupply(
    requestId: string,
    bloodBankId: string,
    actorId: string,
    actorRole: UserRole
  ) {
    return await prisma.$transaction(async (tx) => {
      const request = await tx.bloodRequest.findUnique({
        where: { id: requestId },
        include: { hospital: true },
      });
      if (!request) throw AppError.notFound('Blood request not found');

      const bank = await tx.bloodBank.findUnique({ where: { id: bloodBankId } });
      if (!bank) throw AppError.notFound('Blood bank not found');

      // Find active reservation
      const reservation = await tx.inventoryReservation.findFirst({
        where: {
          requestId,
          bloodBankId,
          status: BloodBankResponseStatus.RESERVED,
        },
      });

      if (!reservation) {
        throw AppError.badRequest(
          'No active reserved units found to confirm for this request. Please review and approve the requisition first.'
        );
      }

      const unitsToConfirm = reservation.allocatedUnits;

      // 1. Shift reserved -> supplied in Blood Bank Balance
      const balance = await tx.inventoryBalance.findUnique({
        where: {
          bloodBankId_bloodGroup_componentType: {
            bloodBankId,
            bloodGroup: reservation.bloodGroup,
            componentType: reservation.componentType,
          },
        },
      });

      if (balance) {
        await tx.inventoryBalance.update({
          where: { id: balance.id },
          data: {
            reservedUnits: { decrement: unitsToConfirm },
            suppliedUnits: { increment: unitsToConfirm },
            lastReconciledAt: new Date(),
          },
        });
      }

      // 2. Mark reservation as CONFIRMED
      const updatedReservation = await tx.inventoryReservation.update({
        where: { id: reservation.id },
        data: {
          status: BloodBankResponseStatus.CONFIRMED,
          confirmedAt: new Date(),
        },
        include: {
          bloodBank: { select: { id: true, name: true, phone: true } },
        },
      });

      // 3. Record in ledger
      await tx.inventoryTransaction.create({
        data: {
          bloodBankId,
          bloodGroup: reservation.bloodGroup,
          componentType: reservation.componentType,
          operationType: InventoryTransactionType.FULFILLMENT_DEDUCTION,
          quantityChange: -unitsToConfirm,
          balanceAfter: balance ? balance.availableUnits : 0,
          relatedRequestId: requestId,
          relatedReservationId: reservation.id,
          actorId,
          actorRole,
          reason: `Dispatched and confirmed supply of ${unitsToConfirm} unit(s) for request #${requestId} (${request.hospital.name})`,
        },
      });

      // 4. Update request confirmed units & status
      const newConfirmed = request.confirmedUnits + unitsToConfirm;
      const newAllocated = Math.max(0, request.allocatedUnits - unitsToConfirm);
      const newRemaining = Math.max(0, request.requiredUnits - newConfirmed - newAllocated);
      const isFulfilled = newConfirmed >= request.requiredUnits;
      const newStatus = isFulfilled
        ? RequestStatus.FULFILLED
        : newAllocated > 0
        ? RequestStatus.RESERVED
        : RequestStatus.PARTIALLY_FULFILLED;

      const timeline = Array.isArray(request.timeline) ? [...request.timeline] : [];
      timeline.push({
        title: `${bank.name} Dispatched & Confirmed Delivery`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        description: `Verified clinical delivery of ${unitsToConfirm} unit(s) of ${reservation.bloodGroup} to ${request.hospital.name}. Cold chain verified.`,
        type: 'fulfilment',
      });

      const updatedRequest = await tx.bloodRequest.update({
        where: { id: requestId },
        data: {
          confirmedUnits: newConfirmed,
          allocatedUnits: newAllocated,
          remainingUnits: newRemaining,
          status: newStatus,
          timeline: timeline as any,
        },
      });

      // 5. Notify Hospital coordinator
      if (request.hospital?.userId) {
        await tx.notification.create({
          data: {
            userId: request.hospital.userId,
            title: `🚚 Blood Delivery Confirmed: ${bank.name}`,
            message: `${bank.name} dispatched and confirmed ${unitsToConfirm} unit(s) of ${reservation.bloodGroup} for patient ${request.patientName}.`,
            type: 'dispatch',
            actionUrl: 'hospital-requests',
            requestId: request.id,
          },
        });
      }

      return {
        success: true,
        message: `Successfully dispatched and confirmed delivery of ${unitsToConfirm} unit(s) to ${request.hospital.name}.`,
        reservation: updatedReservation,
        request: updatedRequest,
      };
    });
  }

  /**
   * Cancel blood request (by Hospital or Admin)
   */
  async cancelRequest(requestId: string, actorId: string, actorRole: UserRole, reason?: string) {
    return await prisma.$transaction(async (tx) => {
      const request = await tx.bloodRequest.findUnique({
        where: { id: requestId },
        include: {
          donorContributions: true,
          bloodBankContributions: true,
        },
      });
      if (!request) throw AppError.notFound('Blood request not found');

      // Release active donors
      for (const d of request.donorContributions) {
        if (d.status === 'ACCEPTED' || d.status === 'AWAITING_DONATION') {
          await tx.donorProfile.update({
            where: { id: d.donorProfileId },
            data: { activeCommitmentRequestId: null },
          });
          await tx.bloodRequestResponse.update({
            where: { id: d.id },
            data: { status: DonorResponseStatus.CANCELLED },
          });
        }
      }

      // Release blood bank reservations
      for (const bb of request.bloodBankContributions) {
        if (bb.status === 'RESERVED' || bb.status === 'ALLOCATED') {
          await tx.inventoryBalance.update({
            where: {
              bloodBankId_bloodGroup_componentType: {
                bloodBankId: bb.bloodBankId,
                bloodGroup: bb.bloodGroup,
                componentType: bb.componentType,
              },
            },
            data: {
              availableUnits: { increment: bb.allocatedUnits },
              reservedUnits: { decrement: bb.allocatedUnits },
            },
          });

          await tx.inventoryReservation.update({
            where: { id: bb.id },
            data: { status: BloodBankResponseStatus.RELEASED },
          });
        }
      }

      const timeline = Array.isArray(request.timeline) ? [...request.timeline] : [];
      timeline.push({
        title: 'Requisition Cancelled',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        description: reason || 'Request cancelled by authorizing institution.',
        type: 'cancel',
      });

      return await tx.bloodRequest.update({
        where: { id: requestId },
        data: {
          status: RequestStatus.CANCELLED,
          allocatedUnits: 0,
          remainingUnits: 0,
          timeline: timeline as any,
        },
      });
    });
  }

  /**
   * Mark request fully completed/fulfilled
   */
  async fulfillRequest(requestId: string) {
    const request = await prisma.bloodRequest.findUnique({ where: { id: requestId } });
    if (!request) throw AppError.notFound('Request not found');

    if (request.confirmedUnits < request.requiredUnits) {
      throw AppError.badRequest(
        `Cannot fulfill request. Confirmed units (${request.confirmedUnits}) is less than required (${request.requiredUnits}).`
      );
    }

    const timeline = Array.isArray(request.timeline) ? [...request.timeline] : [];
    timeline.push({
      title: 'Requisition 100% Fulfilled',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      description: `All ${request.requiredUnits} required units verified and transfused.`,
      type: 'fulfilment',
    });

    return await prisma.bloodRequest.update({
      where: { id: requestId },
      data: {
        status: RequestStatus.FULFILLED,
        remainingUnits: 0,
        timeline: timeline as any,
      },
    });
  }

  /**
   * Delete blood request (by creator Hospital or Admin)
   */
  async deleteRequest(
    requestId: string,
    actorId: string,
    actorRole: UserRole,
    hospitalId?: string
  ) {
    const request = await prisma.bloodRequest.findUnique({
      where: { id: requestId },
      include: {
        donorContributions: true,
        bloodBankContributions: true,
      },
    });
    if (!request) throw AppError.notFound('Blood request not found');

    // Only creator hospital or system admin can delete
    if (actorRole !== UserRole.ADMIN) {
      if (!hospitalId || request.hospitalId !== hospitalId) {
        throw AppError.forbidden('You can only delete blood requests created by your hospital');
      }
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Release active committed donors
      for (const d of request.donorContributions) {
        if (d.status === 'ACCEPTED' || d.status === 'AWAITING_DONATION') {
          await tx.donorProfile.update({
            where: { id: d.donorProfileId },
            data: { activeCommitmentRequestId: null },
          });
        }
      }

      // 2. Release reserved blood bank stock units
      for (const bb of request.bloodBankContributions) {
        if (bb.status === 'RESERVED' || bb.status === 'ALLOCATED') {
          await tx.inventoryBalance.update({
            where: {
              bloodBankId_bloodGroup_componentType: {
                bloodBankId: bb.bloodBankId,
                bloodGroup: bb.bloodGroup,
                componentType: bb.componentType,
              },
            },
            data: {
              availableUnits: { increment: bb.allocatedUnits },
              reservedUnits: { decrement: bb.allocatedUnits },
            },
          });
        }
      }

      // 3. Delete the request (cascades to responses and reservations)
      await tx.bloodRequest.delete({
        where: { id: requestId },
      });

      // 4. Record audit log
      await tx.auditLog.create({
        data: {
          eventType: 'BLOOD_REQUEST_DELETED',
          actorId,
          actorRole: String(actorRole),
          targetId: requestId,
          targetType: 'BLOOD_REQUEST',
          description: `Emergency blood request #${requestId} deleted by ${actorRole}.`,
          details: { requestId, patientName: request.patientName, hospitalId: request.hospitalId },
        },
      });

      return { success: true, id: requestId, message: 'Requisition deleted successfully' };
    });
  }
}

export const requestsService = new RequestsService();
