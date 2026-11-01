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
import { ApplicationStatus, UserRole, UserStatus, VerificationStatus } from '@prisma/client';
import { signAccessToken } from '../src/common/utils/tokens.js';

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
    expect(reqRes.body.code).toBe('FACILITY_PENDING_APPROVAL');
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

    // 5. Verify created blood bank has NO fabricated inventory balances created during approval or activation
    const bloodBank = await prisma.bloodBank.findFirst({
      where: { email: 'director@lifesaverbb.org' },
      include: { inventoryBalances: true },
    });
    expect(bloodBank).not.toBeNull();
    expect(bloodBank?.isVerified).toBe(true);
    expect(bloodBank?.inventoryBalances).toHaveLength(0);
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

  // 12. Public registration rejects direct ADMIN role
  it('12. Public registration rejects direct ADMIN role with 403', async () => {
    const adminRegRes = await request.post('/api/v1/auth/register').send({
      role: 'ADMIN',
      name: 'Malicious Admin',
      phone: '+919876543210',
      city: 'Guntur',
    });

    expect(adminRegRes.status).toBe(403);
    expect(adminRegRes.body.message).toContain('Administrator');
  });

  // 13. Pending facilities cannot log in and receive FACILITY_PENDING_APPROVAL
  it('13. Pending facilities cannot log in and receive FACILITY_PENDING_APPROVAL', async () => {
    // Submit application with password
    const appRes = await request.post('/api/v1/facility-applications').send({
      facilityType: 'HOSPITAL',
      name: 'Pending Sunrise Hospital',
      category: 'Private',
      phone: '+919876111111',
      email: 'contact@sunrisehospital.org',
      address: 'Main Road',
      city: 'Guntur',
      licenseNumber: 'HOSP-LIC-SUN-01',
      authorizedPersonName: 'Dr. Sun',
      authorizedPersonDesignation: 'Director',
      authorizedPersonPhone: '+919876111112',
      authorizedPersonEmail: 'sun@sunrisehospital.org',
      password: 'PendingHospitalPass123!',
    });

    expect(appRes.status).toBe(201);

    // Attempt login with application credentials
    const loginRes = await request.post('/api/v1/auth/login').send({
      identifier: 'contact@sunrisehospital.org',
      password: 'PendingHospitalPass123!',
    });

    expect(loginRes.status).toBe(403);
    expect(loginRes.body.code).toBe('FACILITY_PENDING_APPROVAL');
  });

  // 14. Unactivated approved facilities cannot log in and receive ACCOUNT_PENDING_ACTIVATION
  it('14. Unactivated approved facilities receive ACCOUNT_PENDING_ACTIVATION on login', async () => {
    const { token: adminToken } = await createTestAdmin();

    const app = await prisma.facilityApplication.create({
      data: {
        referenceNumber: 'APP-HOSP-2026-ACT1',
        facilityType: 'HOSPITAL',
        name: 'Approved But Unactivated Hospital',
        phone: '+919876222221',
        email: 'unactivated@hospital.org',
        address: 'Park Avenue',
        city: 'Guntur',
        licenseNumber: 'HOSP-LIC-ACT1',
        authorizedPersonName: 'Dr. Act',
        authorizedPersonDesignation: 'Medical Director',
        authorizedPersonPhone: '+919876222222',
        authorizedPersonEmail: 'act@hospital.org',
        status: ApplicationStatus.PENDING,
      },
    });

    // Admin approves the application
    const approveRes = await request
      .post(`/api/v1/facility-applications/${app.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ notes: 'Approved for activation.' });

    expect(approveRes.status).toBe(200);

    // Attempt login before redeeming activation token
    const loginRes = await request.post('/api/v1/auth/login').send({
      identifier: 'unactivated@hospital.org',
      password: 'LifeDrop@2026!',
    });

    expect(loginRes.status).toBe(403);
    expect(loginRes.body.code).toBe('ACCOUNT_PENDING_ACTIVATION');
  });

  // 15. Activation transitions user to ACTIVE and allows login
  it('15. Activation transitions user to ACTIVE and allows login', async () => {
    const { token: adminToken } = await createTestAdmin();

    const app = await prisma.facilityApplication.create({
      data: {
        referenceNumber: 'APP-BB-2026-ACT2',
        facilityType: 'BLOOD_BANK',
        name: 'Central Hope Blood Bank',
        phone: '+919876333331',
        email: 'hope@bloodbank.org',
        address: 'Clinic Road',
        city: 'Guntur',
        licenseNumber: 'BB-LIC-ACT2',
        authorizedPersonName: 'Dr. Hope',
        authorizedPersonDesignation: 'Chief',
        authorizedPersonPhone: '+919876333332',
        authorizedPersonEmail: 'hope.chief@bloodbank.org',
        status: ApplicationStatus.PENDING,
      },
    });

    const approveRes = await request
      .post(`/api/v1/facility-applications/${app.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    const token = approveRes.body.data.activationToken;

    // Complete activation
    const activateRes = await request
      .post(`/api/v1/facility-applications/activation/${token}`)
      .send({ password: 'HopeSecurePassword2026!' });

    expect(activateRes.status).toBe(200);
    expect(activateRes.body.data.user.role).toBe('BLOOD_BANK');

    // Login with new password
    const loginRes = await request.post('/api/v1/auth/login').send({
      identifier: 'hope@bloodbank.org',
      password: 'HopeSecurePassword2026!',
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.user.role).toBe('BLOOD_BANK');
    expect(loginRes.body.data.accessToken).toBeDefined();
  });

  // 16. Suspended facilities cannot log in and receive ACCOUNT_SUSPENDED
  it('16. Suspended facilities receive ACCOUNT_SUSPENDED on login', async () => {
    const { token: adminToken } = await createTestAdmin();

    const app = await prisma.facilityApplication.create({
      data: {
        referenceNumber: 'APP-HOSP-2026-SUSPLOG',
        facilityType: 'HOSPITAL',
        name: 'Suspended Hospital Log Test',
        phone: '+919876444441',
        email: 'susp@hospital.org',
        address: 'Old Town',
        city: 'Guntur',
        licenseNumber: 'HOSP-LIC-SUSPLOG',
        authorizedPersonName: 'Dr. Susp',
        authorizedPersonDesignation: 'Dean',
        authorizedPersonPhone: '+919876444442',
        authorizedPersonEmail: 'susp@hospital.org',
        status: ApplicationStatus.PENDING,
      },
    });

    const approveRes = await request
      .post(`/api/v1/facility-applications/${app.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    const token = approveRes.body.data.activationToken;

    await request
      .post(`/api/v1/facility-applications/activation/${token}`)
      .send({ password: 'ValidPass123!' });

    // Suspend
    await request
      .post(`/api/v1/facility-applications/${app.id}/suspend`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Compliance failure' });

    // Attempt login
    const loginRes = await request.post('/api/v1/auth/login').send({
      identifier: 'susp@hospital.org',
      password: 'ValidPass123!',
    });

    expect(loginRes.status).toBe(403);
    expect(loginRes.body.code).toBe('ACCOUNT_SUSPENDED');
  });

  // 17. Ownership checks reject cross-facility modifications
  it('17. Ownership checks reject cross-facility modifications', async () => {
    const { hospital: hospA, token: tokenA } = await createTestHospital();
    const { hospital: hospB, token: tokenB } = await createTestHospital();

    // Hospital A creates a blood request
    const reqRes = await request
      .post('/api/v1/blood-requests')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        patientName: 'Hospital A Patient',
        bloodGroup: 'O_POS',
        requiredUnits: 2,
        emergencyLevel: 'URGENT',
        requiredDateTime: new Date(Date.now() + 7200000).toISOString(),
        contactNumber: '+919876999991',
      });

    expect(reqRes.status).toBe(201);
    const requestId = reqRes.body.data.request.id;

    // Hospital B attempts to cancel Hospital A's request -> must fail with 403
    const cancelRes = await request
      .post(`/api/v1/blood-requests/${requestId}/cancel`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ reason: 'Malicious cancellation by competitor' });

    expect(cancelRes.status).toBe(403);

    // Hospital B attempts to fulfill Hospital A's request -> must fail with 403
    const fulfillRes = await request
      .post(`/api/v1/blood-requests/${requestId}/fulfill`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({});

    expect(fulfillRes.status).toBe(403);

    // Blood Bank cross-facility check
    const { bloodBank: bbA, token: bbTokenA } = await createTestBloodBank();
    const { bloodBank: bbB, token: bbTokenB } = await createTestBloodBank();

    // Blood Bank A creates a campaign
    const campRes = await request
      .post('/api/v1/campaigns')
      .set('Authorization', `Bearer ${bbTokenA}`)
      .send({
        name: 'Camp A Blood Drive',
        date: new Date(Date.now() + 86400000).toISOString(),
        timeSlot: '09:00 - 17:00',
        location: 'Town Hall Compound, Ring Road',
        city: 'Guntur',
        description: 'Community emergency blood donation camp',
        targetUnits: 50,
      });

    expect(campRes.status).toBe(201);
    const campaignId = campRes.body.data.campaign.id;

    // Blood Bank B attempts to view registrations for Blood Bank A's campaign -> must fail with 403
    const regRes = await request
      .get(`/api/v1/campaigns/${campaignId}/registrations`)
      .set('Authorization', `Bearer ${bbTokenB}`);

    expect(regRes.status).toBe(403);
  });

  // 18. Approval rejects email/phone collision with existing donor (USER) account (409 Conflict)
  it('18. Approval rejects email/phone collision with existing donor account (409 Conflict)', async () => {
    const { token: adminToken } = await createTestAdmin();
    await prisma.user.create({
      data: {
        name: 'Existing Donor',
        email: 'existing.donor@example.com',
        phone: '+919876550001',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      },
    });

    // Application with matching email
    const appWithEmail = await prisma.facilityApplication.create({
      data: {
        referenceNumber: 'APP-HOSP-COLL-EMAIL',
        facilityType: 'HOSPITAL',
        name: 'Collision Hospital Email',
        phone: '+919876550002',
        email: 'existing.donor@example.com',
        address: 'Medical Way',
        city: 'Guntur',
        licenseNumber: 'HOSP-LIC-COLL-1',
        authorizedPersonName: 'Dr. Collide',
        authorizedPersonDesignation: 'CMO',
        authorizedPersonPhone: '+919876550003',
        authorizedPersonEmail: 'dr.collide@example.com',
        status: ApplicationStatus.PENDING,
      },
    });

    const approveEmailRes = await request
      .post(`/api/v1/facility-applications/${appWithEmail.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(approveEmailRes.status).toBe(409);
    expect(approveEmailRes.body.message).toContain('incompatible role');

    // Application with matching phone
    const appWithPhone = await prisma.facilityApplication.create({
      data: {
        referenceNumber: 'APP-HOSP-COLL-PHONE',
        facilityType: 'HOSPITAL',
        name: 'Collision Hospital Phone',
        phone: '+919876550001',
        email: 'unique.hospital@example.com',
        address: 'Medical Way',
        city: 'Guntur',
        licenseNumber: 'HOSP-LIC-COLL-2',
        authorizedPersonName: 'Dr. Collide',
        authorizedPersonDesignation: 'CMO',
        authorizedPersonPhone: '+919876550004',
        authorizedPersonEmail: 'dr.collide2@example.com',
        status: ApplicationStatus.PENDING,
      },
    });

    const approvePhoneRes = await request
      .post(`/api/v1/facility-applications/${appWithPhone.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(approvePhoneRes.status).toBe(409);
    expect(approvePhoneRes.body.message).toContain('incompatible role');
  });

  // 19. Approval rejects email/phone collision with existing ADMIN account (409 Conflict)
  it('19. Approval rejects email/phone collision with existing ADMIN account (409 Conflict)', async () => {
    const { token: adminToken, user: adminUser } = await createTestAdmin();

    const app = await prisma.facilityApplication.create({
      data: {
        referenceNumber: 'APP-HOSP-COLL-ADMIN',
        facilityType: 'HOSPITAL',
        name: 'Admin Collision Hospital',
        phone: adminUser.phone,
        email: 'facility.admin.test@example.com',
        address: 'Secretariat Road',
        city: 'Guntur',
        licenseNumber: 'HOSP-LIC-COLL-ADMIN',
        authorizedPersonName: 'Dr. Admin Impersonator',
        authorizedPersonDesignation: 'Director',
        authorizedPersonPhone: '+919876550005',
        authorizedPersonEmail: 'dr.impersonator@example.com',
        status: ApplicationStatus.PENDING,
      },
    });

    const approveRes = await request
      .post(`/api/v1/facility-applications/${app.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(approveRes.status).toBe(409);
    expect(approveRes.body.message).toContain('incompatible role');
  });

  // 20. Approval rejects incorrect facility roles and ownership conflicts
  it('20. Approval rejects incorrect facility role mismatch (409 Conflict)', async () => {
    const { token: adminToken } = await createTestAdmin();
    // Existing user has BLOOD_BANK role
    await prisma.user.create({
      data: {
        name: 'Existing Blood Bank User',
        email: 'bb.mismatch@example.com',
        phone: '+919876550010',
        role: UserRole.BLOOD_BANK,
        status: UserStatus.ACTIVE,
      },
    });

    // Application is for HOSPITAL with same email
    const app = await prisma.facilityApplication.create({
      data: {
        referenceNumber: 'APP-HOSP-ROLE-MISMATCH',
        facilityType: 'HOSPITAL',
        name: 'Role Mismatch Hospital',
        phone: '+919876550011',
        email: 'bb.mismatch@example.com',
        address: 'Cross Road',
        city: 'Guntur',
        licenseNumber: 'HOSP-LIC-MISMATCH',
        authorizedPersonName: 'Dr. Mismatch',
        authorizedPersonDesignation: 'CMO',
        authorizedPersonPhone: '+919876550012',
        authorizedPersonEmail: 'mismatch@example.com',
        status: ApplicationStatus.PENDING,
      },
    });

    const approveRes = await request
      .post(`/api/v1/facility-applications/${app.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(approveRes.status).toBe(409);
    expect(approveRes.body.message).toContain('incompatible role');
  });

  // 21. Approval rejects facility profile ownership conflicts
  it('21. Approval rejects facility profile ownership conflicts (409 Conflict)', async () => {
    const { token: adminToken } = await createTestAdmin();
    const { hospital: existingHosp } = await createTestHospital();

    // Application with the same license number as existing hospital, but submitted by someone else
    const app = await prisma.facilityApplication.create({
      data: {
        referenceNumber: 'APP-HOSP-OWN-CONFLICT',
        facilityType: 'HOSPITAL',
        name: 'Duplicate License Hospital',
        phone: '+919876550020',
        email: 'conflict.owner@example.com',
        address: 'Conflict Rd',
        city: 'Guntur',
        licenseNumber: existingHosp.licenseNumber,
        authorizedPersonName: 'Dr. Squatter',
        authorizedPersonDesignation: 'Director',
        authorizedPersonPhone: '+919876550021',
        authorizedPersonEmail: 'squatter@example.com',
        status: ApplicationStatus.PENDING,
      },
    });

    const approveRes = await request
      .post(`/api/v1/facility-applications/${app.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(approveRes.status).toBe(409);
    expect(approveRes.body.message).toContain('belongs to a different user account');
  });

  // 22. Approval strictly does not create any inventory balances or fabricated stock
  it('22. Approval strictly does not create any inventory balances or fabricated stock', async () => {
    const { token: adminToken } = await createTestAdmin();

    const app = await prisma.facilityApplication.create({
      data: {
        referenceNumber: 'APP-BB-NO-INVENTORY',
        facilityType: 'BLOOD_BANK',
        name: 'Zero Stock Initial Blood Bank',
        phone: '+919876550030',
        email: 'zero.stock@bloodbank.org',
        address: 'Gandhi Road',
        city: 'Guntur',
        licenseNumber: 'BB-LIC-ZERO-STOCK',
        authorizedPersonName: 'Sunil Zero',
        authorizedPersonDesignation: 'Director',
        authorizedPersonPhone: '+919876550031',
        authorizedPersonEmail: 'zero.director@bloodbank.org',
        status: ApplicationStatus.PENDING,
      },
    });

    const approveRes = await request
      .post(`/api/v1/facility-applications/${app.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(approveRes.status).toBe(200);

    const bb = await prisma.bloodBank.findFirst({
      where: { email: 'zero.stock@bloodbank.org' },
      include: { inventoryBalances: true },
    });

    expect(bb).not.toBeNull();
    expect(bb?.isVerified).toBe(false);
    expect(bb?.status).toBe(VerificationStatus.PENDING_APPROVAL);
    expect(bb?.inventoryBalances).toHaveLength(0);
  });

  // 23. Facilities cannot operate before activation
  it('23. Facilities cannot operate before activation', async () => {
    const { token: adminToken } = await createTestAdmin();

    const app = await prisma.facilityApplication.create({
      data: {
        referenceNumber: 'APP-HOSP-NO-OP-PREACT',
        facilityType: 'HOSPITAL',
        name: 'Pre-Activation Hospital',
        phone: '+919876550040',
        email: 'noop@hospital.org',
        address: 'Station Road',
        city: 'Guntur',
        licenseNumber: 'HOSP-LIC-NOOP',
        authorizedPersonName: 'Dr. Noop',
        authorizedPersonDesignation: 'Chief',
        authorizedPersonPhone: '+919876550041',
        authorizedPersonEmail: 'noop@hospital.org',
        status: ApplicationStatus.PENDING,
      },
    });

    const approveRes = await request
      .post(`/api/v1/facility-applications/${app.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(approveRes.status).toBe(200);
    const userId = approveRes.body.data.user.id;

    // Generate token for this approved but unactivated user
    const preActivationToken = signAccessToken({
      userId,
      phone: '+919876550040',
      role: UserRole.HOSPITAL,
    });

    // Attempt operational action (creating blood request)
    const opRes = await request
      .post('/api/v1/blood-requests')
      .set('Authorization', `Bearer ${preActivationToken}`)
      .send({
        bloodGroup: 'A_POS',
        unitsRequired: 1,
        urgency: 'URGENT',
        patientName: 'Pre-Act Patient',
      });

    expect(opRes.status).toBe(403);
    expect(['ACCOUNT_PENDING_ACTIVATION', 'FACILITY_PENDING_APPROVAL']).toContain(opRes.body.code);
  });

  // 24. Activation verifies and activates only the exact linked account
  it('24. Activation verifies and activates only the exact linked account and profile', async () => {
    const { token: adminToken } = await createTestAdmin();

    // Create an unrelated user with similar name in database
    const unrelatedUser = await prisma.user.create({
      data: {
        name: 'Unrelated User',
        email: 'unrelated@example.com',
        phone: '+919876550050',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      },
    });

    const app = await prisma.facilityApplication.create({
      data: {
        referenceNumber: 'APP-HOSP-EXACT-ACT',
        facilityType: 'HOSPITAL',
        name: 'Exact Linked Hospital',
        phone: '+919876550051',
        email: 'exact.linked@hospital.org',
        address: 'Lodge Road',
        city: 'Guntur',
        licenseNumber: 'HOSP-LIC-EXACT',
        authorizedPersonName: 'Dr. Exact',
        authorizedPersonDesignation: 'Director',
        authorizedPersonPhone: '+919876550052',
        authorizedPersonEmail: 'exact@hospital.org',
        status: ApplicationStatus.PENDING,
      },
    });

    const approveRes = await request
      .post(`/api/v1/facility-applications/${app.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    const token = approveRes.body.data.activationToken;
    const linkedUserId = approveRes.body.data.user.id;

    // Complete activation
    const activateRes = await request
      .post(`/api/v1/facility-applications/activation/${token}`)
      .send({ password: 'ExactSecurePass123!' });

    expect(activateRes.status).toBe(200);

    // Verify linked user is now ACTIVE
    const linkedUserDb = await prisma.user.findUnique({ where: { id: linkedUserId } });
    expect(linkedUserDb?.status).toBe(UserStatus.ACTIVE);

    // Verify hospital is now VERIFIED
    const hospDb = await prisma.hospital.findFirst({ where: { userId: linkedUserId } });
    expect(hospDb?.isVerified).toBe(true);
    expect(hospDb?.status).toBe(VerificationStatus.VERIFIED);

    // Verify unrelated user is completely untouched
    const unrelatedDb = await prisma.user.findUnique({ where: { id: unrelatedUser.id } });
    expect(unrelatedDb?.role).toBe(UserRole.USER);
    expect(unrelatedDb?.status).toBe(UserStatus.ACTIVE);
  });
});
