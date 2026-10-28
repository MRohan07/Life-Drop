import { describe, it, expect, beforeEach } from 'vitest';
import {
  request,
  clearTestDatabase,
  createTestAdmin,
  createTestDonor,
  createTestHospital,
  createTestBloodBank,
} from './helpers.js';
import { prisma } from '../src/config/database.js';
import { ApplicationStatus } from '@prisma/client';

describe('Hospital and Blood Bank Registration & Admin Approval Workflow', () => {
  beforeEach(async () => {
    await clearTestDatabase();
  });

  // 1. Hospital registration creates a pending application, not an active account
  it('1. Hospital registration creates a pending application, not an active user account', async () => {
    const appData = {
      facilityType: 'HOSPITAL',
      name: 'St. Jude Emergency Hospital',
      category: 'Private',
      phone: '+919876000001',
      email: 'admin@stjudehospital.org',
      address: '4th Cross, Health City',
      city: 'Guntur',
      state: 'Andhra Pradesh',
      pinCode: '522002',
      licenseNumber: 'HOSP-LIC-2026-9901',
      authorizedPersonName: 'Dr. Sarah Jenkins',
      authorizedPersonDesignation: 'Chief Medical Officer',
      authorizedPersonPhone: '+919876000002',
      authorizedPersonEmail: 's.jenkins@stjudehospital.org',
    };

    const res = await request.post('/api/v1/facility-applications').send(appData);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.referenceNumber).toMatch(/^APP-HOSP-/);
    expect(res.body.data.status).toBe('PENDING');

    // Verify application in PostgreSQL
    const dbApp = await prisma.facilityApplication.findUnique({
      where: { referenceNumber: res.body.data.referenceNumber },
    });
    expect(dbApp).not.toBeNull();
    expect(dbApp?.status).toBe('PENDING');
    expect(dbApp?.isActivated).toBe(false);

    // Verify NO User or Hospital record was created
    const dbUser = await prisma.user.findFirst({
      where: { email: 'admin@stjudehospital.org' },
    });
    expect(dbUser).toBeNull();

    const dbHosp = await prisma.hospital.findFirst({
      where: { email: 'admin@stjudehospital.org' },
    });
    expect(dbHosp).toBeNull();
  });

  // 2. Blood bank registration creates a pending application, not an active account
  it('2. Blood bank registration creates a pending application, not an active user account', async () => {
    const appData = {
      facilityType: 'BLOOD_BANK',
      name: 'Metropolis Central Blood Bank',
      category: 'Charitable',
      phone: '+919876000010',
      email: 'contact@metropolisbloodbank.org',
      address: 'Red Cross Compound',
      city: 'Guntur',
      licenseNumber: 'BB-LIC-2026-5541',
      authorizedPersonName: 'Rajesh Kumar',
      authorizedPersonDesignation: 'Blood Bank Director',
      authorizedPersonPhone: '+919876000011',
      authorizedPersonEmail: 'r.kumar@metropolisbloodbank.org',
    };

    const res = await request.post('/api/v1/facility-applications').send(appData);

    expect(res.status).toBe(201);
    expect(res.body.data.referenceNumber).toMatch(/^APP-BB-/);
    expect(res.body.data.status).toBe('PENDING');

    // Direct registration of facility via public auth/register is also strictly blocked
    const directRes = await request.post('/api/v1/auth/register').send({
      role: 'BLOOD_BANK',
      name: 'Fake Direct Blood Bank',
      phone: '+919876000099',
      city: 'Guntur',
    });
    expect(directRes.status).toBe(400);
    expect(directRes.body.message).toContain('restricted');
  });

  // 3. Pending facilities cannot access operational dashboards or protected APIs
  it('3. Pending/unverified facilities cannot access operational facility APIs', async () => {
    // Create an unverified hospital user in database
    const { token: unverifiedToken } = await createTestHospital();
    // Set unverified
    await prisma.hospital.updateMany({
      data: { isVerified: false, status: 'PENDING_APPROVAL' },
    });

    // Attempt to create blood request (operational action)
    const reqRes = await request
      .post('/api/v1/blood-requests')
      .set('Authorization', `Bearer ${unverifiedToken}`)
      .send({
        bloodGroup: 'O+',
        unitsRequired: 2,
        urgency: 'URGENT',
        patientName: 'Emergency Patient',
      });

    expect(reqRes.status).toBe(403);
    expect(reqRes.body.message).toContain('restricted');
  });

  // 4. Ordinary users cannot approve applications
  it('4. Ordinary users cannot approve applications (403 Forbidden)', async () => {
    const { token: donorToken } = await createTestDonor();

    // Create a pending application
    const app = await prisma.facilityApplication.create({
      data: {
        referenceNumber: 'APP-HOSP-2026-TEST1',
        facilityType: 'HOSPITAL',
        name: 'Apollo Trauma Hospital',
        phone: '+919876000021',
        email: 'apollo@example.com',
        address: 'Ring Road',
        city: 'Guntur',
        licenseNumber: 'HOSP-LIC-TEST1',
        authorizedPersonName: 'Dr. Rao',
        authorizedPersonDesignation: 'Director',
        authorizedPersonPhone: '+919876000022',
        authorizedPersonEmail: 'dr.rao@example.com',
        status: ApplicationStatus.PENDING,
      },
    });

    const approveRes = await request
      .post(`/api/v1/facility-applications/${app.id}/approve`)
      .set('Authorization', `Bearer ${donorToken}`)
      .send({});

    expect(approveRes.status).toBe(403);
  });

  // 5. Administrators can review and approve eligible applications
  it('5. Administrators can approve eligible applications and generate activation token', async () => {
    const { token: adminToken, user: adminUser } = await createTestAdmin();

    const app = await prisma.facilityApplication.create({
      data: {
        referenceNumber: 'APP-HOSP-2026-TEST2',
        facilityType: 'HOSPITAL',
        name: 'Medicover Multi-Speciality Hospital',
        phone: '+919876000031',
        email: 'info@medicoverguntur.com',
        address: 'Collector Road',
        city: 'Guntur',
        licenseNumber: 'HOSP-LIC-MED-01',
        authorizedPersonName: 'Dr. V. Prasad',
        authorizedPersonDesignation: 'Superintendent',
        authorizedPersonPhone: '+919876000032',
        authorizedPersonEmail: 'v.prasad@medicoverguntur.com',
        status: ApplicationStatus.PENDING,
      },
    });

    const approveRes = await request
      .post(`/api/v1/facility-applications/${app.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ notes: 'Credentials and state license verified.' });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.application.status).toBe('APPROVED');
    expect(approveRes.body.data.activationToken).toBeDefined();

    // Verify status in DB
    const dbApp = await prisma.facilityApplication.findUnique({ where: { id: app.id } });
    expect(dbApp?.status).toBe('APPROVED');
    expect(dbApp?.approvedByAdminId).toBe(adminUser.id);
    expect(dbApp?.activationToken).toBeDefined();
  });

  // 6. Approval creates account exactly once through secure activation
  it('6. Account is created exactly once through the activation process', async () => {
    const { token: adminToken } = await createTestAdmin();

    const app = await prisma.facilityApplication.create({
      data: {
        referenceNumber: 'APP-BB-2026-TEST3',
        facilityType: 'BLOOD_BANK',
        name: 'Lifesaver Regional Blood Bank',
        phone: '+919876000041',
        email: 'director@lifesaverbb.org',
        address: 'Brodipet 6th Lane',
        city: 'Guntur',
        licenseNumber: 'BB-LIC-LIFE-99',
        authorizedPersonName: 'Sunil Varma',
        authorizedPersonDesignation: 'Administrator',
        authorizedPersonPhone: '+919876000042',
        authorizedPersonEmail: 's.varma@lifesaverbb.org',
        status: ApplicationStatus.PENDING,
      },
    });

    // 1. Admin approves
    const approveRes = await request
      .post(`/api/v1/facility-applications/${app.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    const token = approveRes.body.data.activationToken;

    // 2. Applicant verifies token
    const verifyRes = await request.get(`/api/v1/facility-applications/activation/${token}`);
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.facility.name).toBe('Lifesaver Regional Blood Bank');

    // 3. Complete activation with new password
    const activateRes = await request
      .post(`/api/v1/facility-applications/activation/${token}`)
      .send({ password: 'FacilitySecurePass2026!' });

    expect(activateRes.status).toBe(200);
    expect(activateRes.body.data.user.role).toBe('BLOOD_BANK');
    expect(activateRes.body.data.accessToken).toBeDefined();

    // 4. Attempting to reuse activation token must fail
    const reuseRes = await request
      .post(`/api/v1/facility-applications/activation/${token}`)
      .send({ password: 'AnotherPassword123!' });

    expect(reuseRes.status).toBe(400);

    // 5. Verify created blood bank has 8 initialized inventory balances
    const bloodBank = await prisma.bloodBank.findFirst({
      where: { email: 'director@lifesaverbb.org' },
      include: { inventoryBalances: true },
    });
    expect(bloodBank).not.toBeNull();
    expect(bloodBank?.isVerified).toBe(true);
    expect(bloodBank?.inventoryBalances).toHaveLength(8);
  });

  // 7. Rejected applications cannot access facility operations
  it('7. Rejected applications cannot be activated or access operations', async () => {
    const { token: adminToken } = await createTestAdmin();

    const app = await prisma.facilityApplication.create({
      data: {
        referenceNumber: 'APP-HOSP-2026-REJ',
        facilityType: 'HOSPITAL',
        name: 'Defunct Medical Center',
        phone: '+919876000051',
        email: 'info@defuncthospital.com',
        address: 'Unknown St',
        city: 'Guntur',
        licenseNumber: 'FAKE-LIC-1111',
        authorizedPersonName: 'Anonymous',
        authorizedPersonDesignation: 'Unknown',
        authorizedPersonPhone: '+919876000052',
        authorizedPersonEmail: 'anon@defuncthospital.com',
        status: ApplicationStatus.PENDING,
      },
    });

    const rejectRes = await request
      .post(`/api/v1/facility-applications/${app.id}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Invalid state medical license number.' });

    expect(rejectRes.status).toBe(200);

    const dbApp = await prisma.facilityApplication.findUnique({ where: { id: app.id } });
    expect(dbApp?.status).toBe('REJECTED');
    expect(dbApp?.rejectionReason).toBe('Invalid state medical license number.');

    // Cannot approve rejected application
    const approveRes = await request
      .post(`/api/v1/facility-applications/${app.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(approveRes.status).toBe(400);
  });

  // 8. Suspended facilities lose operational access immediately
  it('8. Suspended facilities lose operational access immediately', async () => {
    const { token: adminToken } = await createTestAdmin();

    // Create an approved and activated hospital
    const app = await prisma.facilityApplication.create({
      data: {
        referenceNumber: 'APP-HOSP-2026-SUSP',
        facilityType: 'HOSPITAL',
        name: 'Care Well Hospital',
        phone: '+919876000061',
        email: 'admin@carewellhospital.com',
        address: 'Main Bazaar',
        city: 'Guntur',
        licenseNumber: 'HOSP-LIC-SUSP-01',
        authorizedPersonName: 'Dr. John',
        authorizedPersonDesignation: 'Director',
        authorizedPersonPhone: '+919876000062',
        authorizedPersonEmail: 'john@carewellhospital.com',
        status: ApplicationStatus.PENDING,
      },
    });

    const approveRes = await request
      .post(`/api/v1/facility-applications/${app.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    const token = approveRes.body.data.activationToken;

    const activateRes = await request
      .post(`/api/v1/facility-applications/activation/${token}`)
      .send({ password: 'HospitalPassword2026!' });

    const facilityToken = activateRes.body.data.accessToken;

    // Verify operational request creation works while verified
    const createReqRes = await request
      .post('/api/v1/blood-requests')
      .set('Authorization', `Bearer ${facilityToken}`)
      .send({
        patientName: 'Patient In Need',
        bloodGroup: 'B_POS',
        requiredUnits: 1,
        emergencyLevel: 'URGENT',
        requiredDateTime: new Date(Date.now() + 7200000).toISOString(),
        contactNumber: '+919876000061',
      });
    expect(createReqRes.status).toBe(201);

    // Administrator suspends the facility
    const suspendRes = await request
      .post(`/api/v1/facility-applications/${app.id}/suspend`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'License expired and not renewed with health authority.' });

    expect(suspendRes.status).toBe(200);

    // Facility's subsequent operational attempt must be rejected with 403 Forbidden
    const blockedReqRes = await request
      .post('/api/v1/blood-requests')
      .set('Authorization', `Bearer ${facilityToken}`)
      .send({
        patientName: 'Another Patient',
        bloodGroup: 'B_POS',
        requiredUnits: 1,
        emergencyLevel: 'URGENT',
        requiredDateTime: new Date(Date.now() + 7200000).toISOString(),
        contactNumber: '+919876000061',
      });

    expect(blockedReqRes.status).toBe(403);
  });

  // 9. Public APIs cannot change approval status
  it('9. Public APIs cannot change approval status', async () => {
    const app = await prisma.facilityApplication.create({
      data: {
        referenceNumber: 'APP-HOSP-2026-UNAUTH',
        facilityType: 'HOSPITAL',
        name: 'Unauthorized Mod Hospital',
        phone: '+919876000071',
        email: 'unauth@hospital.org',
        address: 'Main Street',
        city: 'Guntur',
        licenseNumber: 'HOSP-LIC-UNAUTH',
        authorizedPersonName: 'Admin',
        authorizedPersonDesignation: 'Officer',
        authorizedPersonPhone: '+919876000072',
        authorizedPersonEmail: 'admin@hospital.org',
        status: ApplicationStatus.PENDING,
      },
    });

    // Unauthenticated attempt to approve
    const unauthRes = await request.post(`/api/v1/facility-applications/${app.id}/approve`).send({});
    expect(unauthRes.status).toBe(401);

    // Public status endpoint only allows reading status
    const statusRes = await request.get(`/api/v1/facility-applications/status/${app.referenceNumber}`);
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.data.status).toBe('PENDING');
  });

  // 10. Audit logs record administrative decisions
  it('10. Audit logs record administrative decisions with admin ID and reason', async () => {
    const { token: adminToken, user: adminUser } = await createTestAdmin();

    const app = await prisma.facilityApplication.create({
      data: {
        referenceNumber: 'APP-HOSP-2026-AUDIT',
        facilityType: 'HOSPITAL',
        name: 'Trust Health Center',
        phone: '+919876000081',
        email: 'trust@healthcenter.org',
        address: 'Main Road',
        city: 'Guntur',
        licenseNumber: 'HOSP-LIC-AUDIT',
        authorizedPersonName: 'Manager',
        authorizedPersonDesignation: 'Admin',
        authorizedPersonPhone: '+919876000082',
        authorizedPersonEmail: 'mgr@healthcenter.org',
        status: ApplicationStatus.PENDING,
      },
    });

    await request
      .post(`/api/v1/facility-applications/${app.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ notes: 'Audit verification test.' });

    const auditLog = await prisma.auditLog.findFirst({
      where: {
        eventType: 'FACILITY_APPLICATION_APPROVED',
        targetId: app.id,
      },
    });

    expect(auditLog).not.toBeNull();
    expect(auditLog?.actorId).toBe(adminUser.id);
    expect(auditLog?.actorRole).toBe('ADMIN');
  });

  // 11. Regular donor registration and login continue working seamlessly
  it('11. Regular donor registration and login continue working seamlessly', async () => {
    const regRes = await request.post('/api/v1/auth/register').send({
      phone: '+919848099999',
      password: 'DonorPassword123!',
      name: 'Ravi Kumar',
      role: 'USER',
      bloodGroup: 'O_POS',
      city: 'Guntur',
    });

    expect(regRes.status).toBe(201);
    expect(regRes.body.data.user.role).toBe('USER');
    expect(regRes.body.data.accessToken).toBeDefined();

    // Login with new credentials
    const loginRes = await request.post('/api/v1/auth/login').send({
      identifier: '+919848099999',
      password: 'DonorPassword123!',
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.user.role).toBe('USER');
  });
});
