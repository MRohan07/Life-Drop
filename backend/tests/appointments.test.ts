import { describe, it, expect, beforeEach } from 'vitest';
import { request, clearTestDatabase, createTestDonor, createTestBloodBank } from './helpers.js';
import { prisma } from '../src/config/database.js';

describe('Appointments & Donation History Integration Tests', () => {
  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('should book an appointment, list appointments, retrieve by ID, and cancel', async () => {
    const { user: donor, token: donorToken } = await createTestDonor();
    const { bloodBank } = await createTestBloodBank();

    // 1. Book appointment
    const bookRes = await request
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${donorToken}`)
      .send({
        bloodBankId: bloodBank.id,
        date: new Date(Date.now() + 86400000).toISOString(),
        timeSlot: '10:00 AM - 11:30 AM',
      });

    expect(bookRes.status).toBe(201);
    expect(bookRes.body.data.appointment).toBeDefined();
    expect(bookRes.body.data.appointment.status).toBe('REGISTERED');
    const appointmentId = bookRes.body.data.appointment.id;

    // 2. Fetch my appointments
    const myApptsRes = await request
      .get('/api/v1/appointments/me')
      .set('Authorization', `Bearer ${donorToken}`);

    expect(myApptsRes.status).toBe(200);
    expect(myApptsRes.body.data.appointments).toHaveLength(1);
    expect(myApptsRes.body.data.appointments[0].id).toBe(appointmentId);

    // 3. Retrieve appointment by ID
    const getRes = await request
      .get(`/api/v1/appointments/${appointmentId}`)
      .set('Authorization', `Bearer ${donorToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.appointment.id).toBe(appointmentId);
    expect(getRes.body.data.appointment.bloodBank.id).toBe(bloodBank.id);

    // 4. Cancel appointment
    const cancelRes = await request
      .post(`/api/v1/appointments/${appointmentId}/cancel`)
      .set('Authorization', `Bearer ${donorToken}`);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.appointment.status).toBe('CANCELLED');

    // 5. Verify status in database
    const dbAppt = await prisma.donationAppointment.findUnique({
      where: { id: appointmentId },
    });
    expect(dbAppt?.status).toBe('CANCELLED');
  });

  it('should prevent unauthorized users from cancelling another user appointment', async () => {
    const { token: donorToken1 } = await createTestDonor();
    const { token: donorToken2 } = await createTestDonor();
    const { bloodBank } = await createTestBloodBank();

    // Donor 1 books
    const bookRes = await request
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${donorToken1}`)
      .send({
        bloodBankId: bloodBank.id,
        date: new Date(Date.now() + 86400000).toISOString(),
        timeSlot: '02:00 PM - 03:30 PM',
      });

    const appointmentId = bookRes.body.data.appointment.id;

    // Donor 2 attempts to cancel Donor 1's appointment
    const cancelRes = await request
      .post(`/api/v1/appointments/${appointmentId}/cancel`)
      .set('Authorization', `Bearer ${donorToken2}`);

    expect(cancelRes.status).toBe(403);
    expect(cancelRes.body.message).toContain('Cannot cancel an appointment that does not belong to you');
  });

  it('should allow blood bank staff to mark appointment as COMPLETED and record donation', async () => {
    const { token: donorToken } = await createTestDonor();
    const { bloodBank, token: bbToken } = await createTestBloodBank();

    // Donor books appointment
    const bookRes = await request
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${donorToken}`)
      .send({
        bloodBankId: bloodBank.id,
        date: new Date().toISOString(),
        timeSlot: '11:00 AM - 12:00 PM',
      });

    const appointmentId = bookRes.body.data.appointment.id;

    // Blood bank staff confirms completed donation
    const updateRes = await request
      .patch(`/api/v1/appointments/${appointmentId}/status`)
      .set('Authorization', `Bearer ${bbToken}`)
      .send({
        status: 'COMPLETED',
        units: 1,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.appointment.status).toBe('COMPLETED');

    // Verify donation record was created
    const donationRecord = await prisma.donationRecord.findFirst({
      where: { bloodBankId: bloodBank.id },
    });
    expect(donationRecord).not.toBeNull();
    expect(donationRecord?.status).toBe('VERIFIED');
  });
});
