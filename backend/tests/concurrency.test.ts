import { describe, it, expect, beforeEach } from 'vitest';
import { request, clearTestDatabase, createTestHospital, createTestBloodBank, createTestDonor } from './helpers.js';
import { prisma } from '../src/config/database.js';
import { BloodGroup, ComponentType, EmergencyLevel, RequestStatus } from '@prisma/client';

describe('Concurrency Control, Transactions, & Race Condition Prevention', () => {
  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('should prevent double-allocation when concurrent requests compete for the last available unit', async () => {
    const { bloodBank, token: bbToken } = await createTestBloodBank();
    const { hospital, token: hospToken } = await createTestHospital();

    // 1. Stock exactly 1 unit of AB_POS in the blood bank
    await request
      .post('/api/v1/inventory/stock')
      .set('Authorization', `Bearer ${bbToken}`)
      .send({
        bloodGroup: 'AB_POS',
        units: 1,
      });

    // 2. Create two emergency requests for AB_POS
    const req1Res = await request
      .post('/api/v1/blood-requests')
      .set('Authorization', `Bearer ${hospToken}`)
      .send({
        patientName: 'Patient One',
        bloodGroup: 'AB_POS',
        requiredUnits: 1,
        emergencyLevel: 'CRITICAL',
        requiredDateTime: new Date(Date.now() + 3600000).toISOString(),
        contactNumber: '+919988776655',
      });

    const req2Res = await request
      .post('/api/v1/blood-requests')
      .set('Authorization', `Bearer ${hospToken}`)
      .send({
        patientName: 'Patient Two',
        bloodGroup: 'AB_POS',
        requiredUnits: 1,
        emergencyLevel: 'CRITICAL',
        requiredDateTime: new Date(Date.now() + 3600000).toISOString(),
        contactNumber: '+919988776655',
      });

    const req1Id = req1Res.body.data.request.id;
    const req2Id = req2Res.body.data.request.id;

    // 3. Concurrently try to reserve 1 unit for BOTH requests from the same blood bank
    const [res1, res2] = await Promise.all([
      request
        .post(`/api/v1/blood-requests/${req1Id}/reservations`)
        .set('Authorization', `Bearer ${bbToken}`)
        .send({ units: 1 }),
      request
        .post(`/api/v1/blood-requests/${req2Id}/reservations`)
        .set('Authorization', `Bearer ${bbToken}`)
        .send({ units: 1 }),
    ]);

    // One must succeed (200), the other must fail with 400 (insufficient stock)
    const statuses = [res1.status, res2.status];
    expect(statuses).toContain(200);
    expect(statuses).toContain(400);

    // Verify database availableUnits is exactly 0 and never negative
    const balance = await prisma.inventoryBalance.findUnique({
      where: {
        bloodBankId_bloodGroup_componentType: {
          bloodBankId: bloodBank.id,
          bloodGroup: BloodGroup.AB_POS,
          componentType: ComponentType.RED_BLOOD_CELLS,
        },
      },
    });

    expect(balance?.availableUnits).toBe(0);
    expect(balance?.reservedUnits).toBe(1);
  });

  it('should enforce campaign registration capacity limits under concurrency', async () => {
    const { bloodBank, token: bbToken } = await createTestBloodBank();

    // Create a campaign with targetUnits of 2
    const campRes = await request
      .post('/api/v1/campaigns')
      .set('Authorization', `Bearer ${bbToken}`)
      .send({
        name: 'Limited Seat Blood Drive',
        bloodBankId: bloodBank.id,
        date: new Date(Date.now() + 86400000).toISOString(),
        timeSlot: '10:00 AM - 01:00 PM',
        location: 'Community Hall',
        city: 'Guntur',
        description: 'Urgent community donation drive',
        targetUnits: 2,
      });

    expect(campRes.status).toBe(201);
    const campaignId = campRes.body.data.campaign.id;

    // Create 3 distinct donors
    const donor1 = await createTestDonor('+919876543201');
    const donor2 = await createTestDonor('+919876543202');
    const donor3 = await createTestDonor('+919876543203');

    // Register all 3 concurrently
    const [r1, r2, r3] = await Promise.all([
      request
        .post(`/api/v1/campaigns/${campaignId}/register`)
        .set('Authorization', `Bearer ${donor1.token}`),
      request
        .post(`/api/v1/campaigns/${campaignId}/register`)
        .set('Authorization', `Bearer ${donor2.token}`),
      request
        .post(`/api/v1/campaigns/${campaignId}/register`)
        .set('Authorization', `Bearer ${donor3.token}`),
    ]);

    const successes = [r1, r2, r3].filter((r) => r.status === 201);
    const failures = [r1, r2, r3].filter((r) => r.status === 400);

    expect(successes).toHaveLength(2);
    expect(failures).toHaveLength(1);
    expect(failures[0].body.message).toContain('maximum donor capacity');
  });
});
