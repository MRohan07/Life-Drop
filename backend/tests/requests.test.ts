import { describe, it, expect, beforeEach } from 'vitest';
import { request, clearTestDatabase, createTestHospital, createTestDonor, createTestAdmin, createTestBloodBank } from './helpers.js';
import { prisma } from '../src/config/database.js';
import { BloodGroup } from '@prisma/client';

describe('Blood Requests Lifecycle & Donation Flow Tests', () => {
  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('should support full request lifecycle: create -> accept -> confirm donation -> fulfilled', async () => {
    const { token: hospToken } = await createTestHospital();
    const { user: donorUser, token: donorToken } = await createTestDonor('+919876543210', BloodGroup.O_POS);

    // 1. Hospital creates emergency blood request for 1 unit of O+
    const reqRes = await request
      .post('/api/v1/blood-requests')
      .set('Authorization', `Bearer ${hospToken}`)
      .send({
        patientName: 'Emergency Case A',
        bloodGroup: 'O_POS',
        requiredUnits: 1,
        emergencyLevel: 'CRITICAL',
        requiredDateTime: new Date(Date.now() + 7200000).toISOString(),
        contactNumber: '+919876543210',
      });

    expect(reqRes.status).toBe(201);
    const requestId = reqRes.body.data.request.id;

    // 2. Donor accepts commitment
    const acceptRes = await request
      .post(`/api/v1/blood-requests/${requestId}/responses`)
      .set('Authorization', `Bearer ${donorToken}`)
      .send({
        response: 'ACCEPT',
      });

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.data.request.allocatedUnits).toBe(1);

    // 3. Hospital confirms donation completion on site
    const confirmRes = await request
      .post('/api/v1/donations/confirm')
      .set('Authorization', `Bearer ${hospToken}`)
      .send({
        requestId,
        donorId: donorUser.id,
        units: 1,
      });

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.record).toBeDefined();

    // Check request is updated to FULFILLED in database
    const reqAfter = await prisma.bloodRequest.findUnique({
      where: { id: requestId },
    });
    expect(reqAfter?.status).toBe('FULFILLED');
    expect(reqAfter?.confirmedUnits).toBe(1);

    // 4. Verify donor profile is placed on 90-day cooldown and donations count incremented
    const updatedDonor = await prisma.donorProfile.findUnique({
      where: { userId: donorUser.id },
    });

    expect(updatedDonor?.isEligible).toBe(false);
    expect(updatedDonor?.totalDonations).toBe(1);
    expect(updatedDonor?.lastDonationDate).not.toBeNull();
  });

  it('should reject duplicate donation confirmation for same donor on same request', async () => {
    const { token: hospToken } = await createTestHospital();
    const { user: donorUser, token: donorToken } = await createTestDonor();

    const reqRes = await request
      .post('/api/v1/blood-requests')
      .set('Authorization', `Bearer ${hospToken}`)
      .send({
        patientName: 'Emergency Case B',
        bloodGroup: 'O_POS',
        requiredUnits: 1,
        emergencyLevel: 'URGENT',
        requiredDateTime: new Date(Date.now() + 7200000).toISOString(),
        contactNumber: '+919876543210',
      });

    const requestId = reqRes.body.data.request.id;

    await request
      .post(`/api/v1/blood-requests/${requestId}/responses`)
      .set('Authorization', `Bearer ${donorToken}`)
      .send({ response: 'ACCEPT' });

    // First confirmation
    await request
      .post('/api/v1/donations/confirm')
      .set('Authorization', `Bearer ${hospToken}`)
      .send({
        requestId,
        donorId: donorUser.id,
        units: 1,
      });

    // Second confirmation attempt
    const dupRes = await request
      .post('/api/v1/donations/confirm')
      .set('Authorization', `Bearer ${hospToken}`)
      .send({
        requestId,
        donorId: donorUser.id,
        units: 1,
      });

    expect(dupRes.status).toBe(409);
    expect(dupRes.body.message).toContain('already been confirmed');
  });

  it('should reject commitment if donor is incompatible', async () => {
    const { token: hospToken } = await createTestHospital();
    // Patient is O-POS, Donor is AB-POS (cannot give to O-POS)
    const { token: donorToken } = await createTestDonor('+919876543210', BloodGroup.AB_POS);

    const reqRes = await request
      .post('/api/v1/blood-requests')
      .set('Authorization', `Bearer ${hospToken}`)
      .send({
        patientName: 'Emergency Incompatible',
        bloodGroup: 'O_POS',
        requiredUnits: 1,
        emergencyLevel: 'CRITICAL',
        requiredDateTime: new Date(Date.now() + 7200000).toISOString(),
        contactNumber: '+919876543210',
      });

    const requestId = reqRes.body.data.request.id;

    const res = await request
      .post(`/api/v1/blood-requests/${requestId}/responses`)
      .set('Authorization', `Bearer ${donorToken}`)
      .send({ response: 'ACCEPT' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('not compatible');
  });

  it('should allow the creator hospital to delete their blood request and release committed donors', async () => {
    const { token: hospToken } = await createTestHospital();
    const { user: donorUser, token: donorToken } = await createTestDonor('+919876543210', BloodGroup.O_POS);

    // 1. Create request
    const reqRes = await request
      .post('/api/v1/blood-requests')
      .set('Authorization', `Bearer ${hospToken}`)
      .send({
        patientName: 'Case to Delete',
        bloodGroup: 'O_POS',
        requiredUnits: 1,
        emergencyLevel: 'CRITICAL',
        requiredDateTime: new Date(Date.now() + 7200000).toISOString(),
        contactNumber: '+919876543210',
      });
    expect(reqRes.status).toBe(201);
    const requestId = reqRes.body.data.request.id;

    // 2. Donor accepts
    const acceptRes = await request
      .post(`/api/v1/blood-requests/${requestId}/responses`)
      .set('Authorization', `Bearer ${donorToken}`)
      .send({ response: 'ACCEPT' });
    expect(acceptRes.status).toBe(200);

    // Verify donor is committed
    const donorBefore = await prisma.donorProfile.findUnique({ where: { userId: donorUser.id } });
    expect(donorBefore?.activeCommitmentRequestId).toBe(requestId);

    // 3. Hospital deletes the request
    const delRes = await request
      .delete(`/api/v1/blood-requests/${requestId}`)
      .set('Authorization', `Bearer ${hospToken}`);
    expect(delRes.status).toBe(200);
    expect(delRes.body.status).toBe('success');

    // Verify request is removed from database
    const reqInDb = await prisma.bloodRequest.findUnique({ where: { id: requestId } });
    expect(reqInDb).toBeNull();

    // Verify donor commitment is released
    const donorAfter = await prisma.donorProfile.findUnique({ where: { userId: donorUser.id } });
    expect(donorAfter?.activeCommitmentRequestId).toBeNull();
  });

  it('should prevent another hospital from deleting a request they did not create', async () => {
    const { token: creatorToken } = await createTestHospital();
    const { token: anotherHospToken } = await createTestHospital();

    const reqRes = await request
      .post('/api/v1/blood-requests')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        patientName: 'Protected Case',
        bloodGroup: 'O_POS',
        requiredUnits: 1,
        emergencyLevel: 'NORMAL',
        requiredDateTime: new Date(Date.now() + 7200000).toISOString(),
        contactNumber: '+919876543210',
      });
    const requestId = reqRes.body.data.request.id;

    const delRes = await request
      .delete(`/api/v1/blood-requests/${requestId}`)
      .set('Authorization', `Bearer ${anotherHospToken}`);
    expect(delRes.status).toBe(403);
    expect(delRes.body.message).toContain('only delete blood requests created by your hospital');
  });

  it('should allow system administrator to delete any blood request', async () => {
    const { token: creatorToken } = await createTestHospital();
    const { token: adminToken } = await createTestAdmin();

    const reqRes = await request
      .post('/api/v1/blood-requests')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        patientName: 'Admin Deletable Case',
        bloodGroup: 'A_POS',
        requiredUnits: 2,
        emergencyLevel: 'URGENT',
        requiredDateTime: new Date(Date.now() + 7200000).toISOString(),
        contactNumber: '+919876543210',
      });
    const requestId = reqRes.body.data.request.id;

    const delRes = await request
      .delete(`/api/v1/blood-requests/${requestId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(delRes.status).toBe(200);

    const reqInDb = await prisma.bloodRequest.findUnique({ where: { id: requestId } });
    expect(reqInDb).toBeNull();
  });

  it('should support direct transfer from hospital to blood bank: create -> pending approval -> approve & reserve -> confirm supply & fulfill', async () => {
    const { hospital, token: hospToken } = await createTestHospital();
    const { bloodBank, token: bbToken } = await createTestBloodBank();

    // 1. Seed 10 available units of O_POS for the test blood bank
    await prisma.inventoryBalance.create({
      data: {
        bloodBankId: bloodBank.id,
        bloodGroup: BloodGroup.O_POS,
        availableUnits: 10,
        reservedUnits: 0,
        suppliedUnits: 0,
      },
    });

    // 2. Hospital creates direct emergency transfer requisition to the blood bank
    const createRes = await request
      .post('/api/v1/blood-requests')
      .set('Authorization', `Bearer ${hospToken}`)
      .send({
        patientName: 'ICU Direct Transfer Patient',
        bloodGroup: 'O_POS',
        requiredUnits: 2,
        emergencyLevel: 'URGENT',
        requiredDateTime: new Date(Date.now() + 7200000).toISOString(),
        contactNumber: '+919876543210',
        targetBloodBankId: bloodBank.id,
      });

    expect(createRes.status).toBe(201);
    const requestId = createRes.body.data.request.id;

    // Verify request is created with PENDING reservation and 0 allocated units before approval
    const reqInDb = await prisma.bloodRequest.findUnique({
      where: { id: requestId },
      include: { bloodBankContributions: true },
    });
    expect(reqInDb?.allocatedUnits).toBe(0);
    expect(reqInDb?.remainingUnits).toBe(2);
    expect(reqInDb?.bloodBankContributions.length).toBe(1);
    expect(reqInDb?.bloodBankContributions[0].status).toBe('PENDING');
    expect(reqInDb?.bloodBankContributions[0].offeredUnits).toBe(2);
    expect(reqInDb?.bloodBankContributions[0].allocatedUnits).toBe(0);

    // Verify stock is NOT deducted before approval
    const balanceBeforeApproval = await prisma.inventoryBalance.findUnique({
      where: {
        bloodBankId_bloodGroup_componentType: {
          bloodBankId: bloodBank.id,
          bloodGroup: BloodGroup.O_POS,
          componentType: 'RED_BLOOD_CELLS',
        },
      },
    });
    expect(balanceBeforeApproval?.availableUnits).toBe(10);
    expect(balanceBeforeApproval?.reservedUnits).toBe(0);

    // 3. Attempting to send confirmation before approval should fail
    const prematureConfirm = await request
      .post(`/api/v1/blood-requests/${requestId}/confirm-supply`)
      .set('Authorization', `Bearer ${bbToken}`);
    expect(prematureConfirm.status).toBe(400);
    expect(prematureConfirm.body.message).toContain('Please review and approve');

    // 4. Blood bank approves requisition & reserves 2 units
    const reserveRes = await request
      .post(`/api/v1/blood-requests/${requestId}/reservations`)
      .set('Authorization', `Bearer ${bbToken}`)
      .send({ units: 2 });

    expect(reserveRes.status).toBe(200);
    expect(reserveRes.body.data.reservation.status).toBe('RESERVED');
    expect(reserveRes.body.data.reservation.allocatedUnits).toBe(2);

    // Verify stock is now reserved
    const balanceAfterApproval = await prisma.inventoryBalance.findUnique({
      where: {
        bloodBankId_bloodGroup_componentType: {
          bloodBankId: bloodBank.id,
          bloodGroup: BloodGroup.O_POS,
          componentType: 'RED_BLOOD_CELLS',
        },
      },
    });
    expect(balanceAfterApproval?.availableUnits).toBe(8);
    expect(balanceAfterApproval?.reservedUnits).toBe(2);

    // 5. Blood bank dispatches and sends blood confirmation
    const confirmRes = await request
      .post(`/api/v1/blood-requests/${requestId}/confirm-supply`)
      .set('Authorization', `Bearer ${bbToken}`);

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.reservation.status).toBe('CONFIRMED');

    // Verify inventory shifted from reserved to supplied
    const balanceAfterConfirm = await prisma.inventoryBalance.findUnique({
      where: {
        bloodBankId_bloodGroup_componentType: {
          bloodBankId: bloodBank.id,
          bloodGroup: BloodGroup.O_POS,
          componentType: 'RED_BLOOD_CELLS',
        },
      },
    });
    expect(balanceAfterConfirm?.availableUnits).toBe(8);
    expect(balanceAfterConfirm?.reservedUnits).toBe(0);
    expect(balanceAfterConfirm?.suppliedUnits).toBe(2);

    // Verify request is now FULFILLED
    const finalReq = await prisma.bloodRequest.findUnique({
      where: { id: requestId },
    });
    expect(finalReq?.status).toBe('FULFILLED');
    expect(finalReq?.confirmedUnits).toBe(2);
    expect(finalReq?.remainingUnits).toBe(0);
  });
});
