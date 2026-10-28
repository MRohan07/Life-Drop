import { describe, it, expect, beforeEach } from 'vitest';
import { request, clearTestDatabase, createTestDonor } from './helpers.js';
import { BloodGroup } from '@prisma/client';

describe('Donor Privacy, Consent, & Discovery Tests', () => {
  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('should list public donors with masked phone numbers to preserve privacy', async () => {
    await createTestDonor('+919876543211', BloodGroup.O_POS);

    const res = await request.get('/api/v1/donors');
    expect(res.status).toBe(200);
    expect(res.body.data.donors).toHaveLength(1);

    const listed = res.body.data.donors[0];
    // Phone must be masked for public search (not raw +919876543211)
    expect(listed.phone).not.toBe('+919876543211');
    expect(listed.phone).toContain('•');
    expect(listed.name).toBe('Test Donor');
  });

  it('should allow donor to update their availability preferences', async () => {
    const { token } = await createTestDonor('+919876543210');

    const res = await request
      .patch('/api/v1/donors/me/availability')
      .set('Authorization', `Bearer ${token}`)
      .send({
        isAvailable: false,
        preferredRadiusKm: 15,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.availability.isAvailable).toBe(false);
    expect(res.body.data.availability.preferredRadiusKm).toBe(15);
  });

  it('should allow donor to update their privacy and consent preferences', async () => {
    const { token } = await createTestDonor('+919876543210');

    const res = await request
      .patch('/api/v1/donors/me/consent')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sharePhoneWithHospitals: false,
        allowEmergencyRadar: false,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.consent.sharePhoneWithHospitals).toBe(false);
    expect(res.body.data.consent.allowEmergencyRadar).toBe(false);
  });
});
