import { describe, it, expect, beforeEach } from 'vitest';
import { request, clearTestDatabase, createTestAdmin, createTestDonor, createTestBloodBank } from './helpers.js';
import { prisma } from '../src/config/database.js';

describe('Administrator Authorization & Moderation Tests', () => {
  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('should enforce role-based access control: reject non-admin from accessing admin endpoints', async () => {
    const { token: donorToken } = await createTestDonor();

    const res = await request
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${donorToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('restricted');
  });

  it('should allow admin to inspect dashboard analytics and audit logs', async () => {
    const { token: adminToken } = await createTestAdmin();

    const res = await request
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.stats).toBeDefined();
    expect(res.body.data.stats.totalUsers).toBeDefined();
  });

  it('should allow admin to verify a blood bank and record an audit log', async () => {
    const { token: adminToken } = await createTestAdmin();
    const { bloodBank } = await createTestBloodBank();

    const res = await request
      .patch(`/api/v1/admin/blood-banks/${bloodBank.id}/verification`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'VERIFIED',
        reason: 'License documents successfully audited by health ministry',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.bloodBank.status).toBe('VERIFIED');
    expect(res.body.data.bloodBank.isVerified).toBe(true);

    // Verify Audit log was written
    const logs = await prisma.auditLog.findMany({
      where: { targetId: bloodBank.id },
    });

    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs[0].eventType).toBe('BLOOD_BANK_VERIFICATION_CHANGE');
  });

  it('should allow admin to suspend an abusive user account', async () => {
    const { token: adminToken } = await createTestAdmin();
    const { user: donorUser } = await createTestDonor();

    const res = await request
      .patch(`/api/v1/admin/users/${donorUser.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'SUSPENDED',
        reason: 'Repeated non-attendance and abuse reports confirmed',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.user.status).toBe('SUSPENDED');
  });
});
