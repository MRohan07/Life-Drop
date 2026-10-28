import supertest from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/database.js';
import { signAccessToken } from '../src/common/utils/tokens.js';
import { hashPassword } from '../src/common/utils/security.js';
import { UserRole, BloodGroup } from '@prisma/client';

export const request = supertest(app);

export async function clearTestDatabase() {
  if (process.env.NODE_ENV !== 'test' || !process.env.DATABASE_URL?.includes('test')) {
    throw new Error('SAFETY CHECK FAILED: clearTestDatabase() can only execute when NODE_ENV=test and DATABASE_URL points to a test database!');
  }
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE 
      "AuditLog",
      "FeedbackSubmission",
      "UserReport",
      "NotificationPreference",
      "Notification",
      "FacilityApplicationDocument",
      "FacilityApplicationReview",
      "FacilityApplication",
      "CampaignRegistration",
      "Campaign",
      "DonationAppointment",
      "DonationRecord",
      "InventoryReservation",
      "BloodRequestResponse",
      "BloodRequest",
      "InventoryTransaction",
      "InventoryBalance",
      "InventoryLot",
      "BloodBank",
      "Hospital",
      "DonorConsent",
      "DonorAvailability",
      "DonorProfile",
      "OTPChallenge",
      "RefreshSession",
      "User"
    CASCADE;
  `);
}

export async function createTestAdmin() {
  const passwordHash = await hashPassword('AdminPass2026!');
  const user = await prisma.user.create({
    data: {
      name: 'System Administrator',
      phone: '+919999999999',
      email: 'admin@lifedrop.io',
      role: UserRole.ADMIN,
      passwordHash,
      status: 'ACTIVE',
    },
  });

  const token = signAccessToken({
    userId: user.id,
    phone: user.phone,
    role: user.role,
  });

  return { user, token };
}

export async function createTestDonor(phone?: string, bloodGroup = BloodGroup.O_POS) {
  const passwordHash = await hashPassword('DonorPass2026!');
  const rand = Math.floor(100000 + Math.random() * 900000);
  const phoneNum = phone || `+9198${rand}`;
  const user = await prisma.user.create({
    data: {
      name: 'Test Donor',
      phone: phoneNum,
      email: `donor_${rand}@example.com`,
      city: 'Guntur',
      role: UserRole.USER,
      passwordHash,
      status: 'ACTIVE',
      donorProfile: {
        create: {
          bloodGroup,
          totalDonations: 0,
          rank: 'Bronze',
          isEligible: true,
          availability: {
            create: {
              isAvailable: true,
              preferredRadiusKm: 25,
            },
          },
          consent: {
            create: {
              allowEmergencyRadar: true,
              sharePhoneWithHospitals: true,
            },
          },
        },
      },
    },
    include: {
      donorProfile: true,
    },
  });

  const token = signAccessToken({
    userId: user.id,
    phone: user.phone,
    role: user.role,
  });

  return { user, token };
}

export async function createTestHospital(phone?: string) {
  const passwordHash = await hashPassword('HospitalPass2026!');
  const rand = Math.floor(100000 + Math.random() * 900000);
  const phoneNum = phone || `+9197${rand}`;
  const user = await prisma.user.create({
    data: {
      name: 'City Care Hospital Staff',
      phone: phoneNum,
      email: `hospital_${rand}@example.com`,
      role: UserRole.HOSPITAL,
      passwordHash,
      status: 'ACTIVE',
      hospital: {
        create: {
          name: 'City Care Hospital',
          type: 'Government',
          registrationNumber: `HOSP-REG-${rand}`,
          phone: phoneNum,
          email: `hospital_${rand}@example.com`,
          licenseNumber: `LIC-HOSP-${rand}`,
          address: 'Main Road',
          city: 'Guntur',
          state: 'Andhra Pradesh',
          pinCode: '522001',
          latitude: 16.3067,
          longitude: 80.4365,
          isVerified: true,
          status: 'VERIFIED',
        },
      },
    },
    include: {
      hospital: true,
    },
  });

  const token = signAccessToken({
    userId: user.id,
    phone: user.phone,
    role: user.role,
  });

  return { user, hospital: user.hospital!, token };
}

export async function createTestBloodBank(phone?: string) {
  const passwordHash = await hashPassword('BloodBankPass2026!');
  const rand = Math.floor(100000 + Math.random() * 900000);
  const phoneNum = phone || `+9196${rand}`;
  const user = await prisma.user.create({
    data: {
      name: 'LifeSave Blood Bank Staff',
      phone: phoneNum,
      email: `bloodbank_${rand}@example.com`,
      role: UserRole.BLOOD_BANK,
      passwordHash,
      status: 'ACTIVE',
      bloodBank: {
        create: {
          name: 'LifeSave Central Blood Bank',
          type: 'Charitable',
          registrationNumber: `BB-REG-${rand}`,
          phone: phoneNum,
          email: `bloodbank_${rand}@example.com`,
          licenseNumber: `LIC-BB-${rand}`,
          address: 'Red Cross Rd',
          city: 'Guntur',
          state: 'Andhra Pradesh',
          pinCode: '522002',
          latitude: 16.307,
          longitude: 80.437,
          isVerified: true,
          status: 'VERIFIED',
        },
      },
    },
    include: {
      bloodBank: true,
    },
  });

  const token = signAccessToken({
    userId: user.id,
    phone: user.phone,
    role: user.role,
  });

  return { user, bloodBank: user.bloodBank!, token };
}
