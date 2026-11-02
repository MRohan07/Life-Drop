import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient, ApplicationStatus, UserRole, UserStatus, VerificationStatus, FacilityType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- LifeDrop Facility Reconciliation Tool ---');
  console.log('Scanning database for approved facility applications...\n');

  const approvedApplications = await prisma.facilityApplication.findMany({
    where: {
      status: ApplicationStatus.APPROVED,
    },
    include: {
      createdUser: true,
      hospital: true,
      bloodBank: true,
    },
  });

  console.log(`Found ${approvedApplications.length} application(s) in APPROVED status.`);

  let reconciledCount = 0;
  let alreadyActiveCount = 0;
  let skippedSuspendedCount = 0;

  for (const app of approvedApplications) {
    if (app.status === ApplicationStatus.SUSPENDED || (app.createdUser && app.createdUser.status === UserStatus.SUSPENDED)) {
      console.log(`[SKIP SUSPENDED] Application ${app.referenceNumber} (${app.name}) is associated with a suspended account.`);
      skippedSuspendedCount++;
      continue;
    }

    const isUserActive = app.createdUser && app.createdUser.status === UserStatus.ACTIVE;
    const isHospitalVerified =
      app.facilityType === FacilityType.HOSPITAL &&
      app.hospital &&
      app.hospital.isVerified &&
      app.hospital.status === VerificationStatus.VERIFIED;
    const isBloodBankVerified =
      app.facilityType === FacilityType.BLOOD_BANK &&
      app.bloodBank &&
      app.bloodBank.isVerified &&
      app.bloodBank.status === VerificationStatus.VERIFIED;

    if (app.isActivated && isUserActive && (isHospitalVerified || isBloodBankVerified)) {
      console.log(`[OK ACTIVE] ${app.referenceNumber} (${app.name}) - Already active and verified.`);
      alreadyActiveCount++;
      continue;
    }

    console.log(`[RECONCILING] ${app.referenceNumber} (${app.name}) [${app.facilityType}] - Activating account and verifying profile...`);

    const expectedRole =
      app.facilityType === FacilityType.HOSPITAL ? UserRole.HOSPITAL : UserRole.BLOOD_BANK;

    await prisma.$transaction(async (tx) => {
      let user = app.createdUser;

      if (!user) {
        const existingUser = await tx.user.findFirst({
          where: {
            OR: [
              ...(app.createdUserId ? [{ id: app.createdUserId }] : []),
              { email: { equals: app.email, mode: 'insensitive' } },
              { phone: app.phone },
            ],
          },
        });

        if (existingUser) {
          if (existingUser.status === UserStatus.SUSPENDED) {
            console.log(`  -> Existing user account for ${app.email} is SUSPENDED. Skipping.`);
            return;
          }

          user = await tx.user.update({
            where: { id: existingUser.id },
            data: {
              role: expectedRole,
              status: UserStatus.ACTIVE,
              name: app.name,
              city: app.city,
              location: app.address,
              ...(app.passwordHash && !existingUser.passwordHash
                ? { passwordHash: app.passwordHash }
                : {}),
            },
          });
        } else {
          user = await tx.user.create({
            data: {
              name: app.name,
              email: app.email,
              phone: app.phone,
              passwordHash: app.passwordHash,
              role: expectedRole,
              status: UserStatus.ACTIVE,
              city: app.city,
              location: app.address,
              latitude: app.latitude || 16.3067,
              longitude: app.longitude || 80.4365,
              notificationPreferences: {
                create: { inAppUrgent: true, inAppGeneral: true, smsEmergency: true, emailDigest: true },
              },
            },
          });
        }
      } else {
        if (user.status !== UserStatus.ACTIVE || (!user.passwordHash && app.passwordHash)) {
          user = await tx.user.update({
            where: { id: user.id },
            data: {
              status: UserStatus.ACTIVE,
              ...(app.passwordHash && !user.passwordHash ? { passwordHash: app.passwordHash } : {}),
            },
          });
        }
      }

      if (app.facilityType === FacilityType.HOSPITAL) {
        let hospital = app.hospital;
        if (!hospital) {
          hospital = await tx.hospital.findFirst({
            where: {
              OR: [
                { userId: user.id },
                { facilityApplicationId: app.id },
                { licenseNumber: app.licenseNumber },
              ],
            },
          });
        }

        if (hospital) {
          await tx.hospital.update({
            where: { id: hospital.id },
            data: {
              userId: user.id,
              facilityApplicationId: app.id,
              name: app.name,
              isVerified: true,
              status: VerificationStatus.VERIFIED,
            },
          });
        } else {
          await tx.hospital.create({
            data: {
              userId: user.id,
              name: app.name,
              type: app.category || 'Private',
              registrationNumber:
                app.registrationNumber || `HOSP-REG-${Date.now().toString().slice(-6)}`,
              phone: app.phone,
              email: app.email,
              address: app.address,
              area: app.area || app.city,
              city: app.city,
              state: app.state || 'Andhra Pradesh',
              pinCode: app.pinCode || '522001',
              latitude: app.latitude || 16.3067,
              longitude: app.longitude || 80.4365,
              services: app.services || ['Emergency Transfusion & Critical Care'],
              licenseNumber: app.licenseNumber,
              issuingAuthority: app.issuingAuthority,
              licenseDocUrl: app.licenseDocUrl,
              registrationCertUrl: app.registrationCertUrl,
              authorizedPersonName: app.authorizedPersonName,
              authorizedPersonDesignation: app.authorizedPersonDesignation,
              authorizedPersonPhone: app.authorizedPersonPhone,
              authorizedPersonEmail: app.authorizedPersonEmail,
              emergencyContact: app.emergencyContact,
              isVerified: true,
              status: VerificationStatus.VERIFIED,
              facilityApplicationId: app.id,
            },
          });
        }
      } else {
        let bloodBank = app.bloodBank;
        if (!bloodBank) {
          bloodBank = await tx.bloodBank.findFirst({
            where: {
              OR: [
                { userId: user.id },
                { facilityApplicationId: app.id },
                { licenseNumber: app.licenseNumber },
              ],
            },
          });
        }

        if (bloodBank) {
          await tx.bloodBank.update({
            where: { id: bloodBank.id },
            data: {
              userId: user.id,
              facilityApplicationId: app.id,
              name: app.name,
              isVerified: true,
              status: VerificationStatus.VERIFIED,
            },
          });
        } else {
          await tx.bloodBank.create({
            data: {
              userId: user.id,
              name: app.name,
              type: app.category || 'Charitable',
              phone: app.phone,
              email: app.email,
              address: app.address,
              city: app.city,
              state: app.state || 'Andhra Pradesh',
              licenseNumber: app.licenseNumber,
              latitude: app.latitude || 16.3067,
              longitude: app.longitude || 80.4365,
              componentsAvailable:
                app.componentsAvailable || ['Red Blood Cells', 'Platelets', 'Plasma', 'Whole Blood'],
              authorizedPersonName: app.authorizedPersonName,
              authorizedPersonDesignation: app.authorizedPersonDesignation,
              authorizedPersonPhone: app.authorizedPersonPhone,
              authorizedPersonEmail: app.authorizedPersonEmail,
              isVerified: true,
              status: VerificationStatus.VERIFIED,
              facilityApplicationId: app.id,
            },
          });
        }
      }

      await tx.facilityApplication.update({
        where: { id: app.id },
        data: {
          createdUserId: user.id,
          isActivated: true,
          activatedAt: app.activatedAt || new Date(),
        },
      });

      console.log(`  -> Successfully reconciled ${app.referenceNumber} (${app.name}). User ID: ${user.id}`);
      reconciledCount++;
    });
  }

  console.log('\n--- Reconciliation Summary ---');
  console.log(`Total Approved Applications: ${approvedApplications.length}`);
  console.log(`Already Active & Verified:  ${alreadyActiveCount}`);
  console.log(`Skipped Suspended:          ${skippedSuspendedCount}`);
  console.log(`Newly Reconciled:           ${reconciledCount}`);
  console.log('Reconciliation complete.');
}

main()
  .catch((err) => {
    console.error('Fatal error during facility reconciliation:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

