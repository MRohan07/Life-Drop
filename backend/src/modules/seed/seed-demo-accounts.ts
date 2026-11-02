import {
  PrismaClient,
  BloodGroup,
  UserRole,
  VerificationStatus,
  UserStatus,
  FacilityType,
  ApplicationStatus,
  ComponentType,
} from '@prisma/client';
import argon2 from 'argon2';
import { prisma } from '../../config/database.js';
import { logger } from '../../common/logging/logger.js';

const ALL_BLOOD_GROUPS: BloodGroup[] = [
  BloodGroup.O_POS,
  BloodGroup.O_NEG,
  BloodGroup.A_POS,
  BloodGroup.A_NEG,
  BloodGroup.B_POS,
  BloodGroup.B_NEG,
  BloodGroup.AB_POS,
  BloodGroup.AB_NEG,
];

export async function seedDemoAccountsIfMissing(client: PrismaClient = prisma) {
  try {
    const defaultPassword = process.env.SEED_DEFAULT_PASSWORD?.trim() || 'LifeDrop@2026!';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD?.trim() || 'Admin@123';
    const adminPasskey = process.env.ADMIN_PASSKEY_PIN?.trim() || '222005';

    const defaultPasswordHash = await argon2.hash(defaultPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const adminPasswordHash = await argon2.hash(adminPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const adminPasskeyHash = await argon2.hash(adminPasskey, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    // -------------------------------------------------------------
    // 1. ADMIN USERS & PROFILES
    // -------------------------------------------------------------
    const adminAccounts = [
      {
        id: 'LD-ADM-ROHAN',
        name: 'Rohan (Administrator)',
        email: 'adminrohan@gmail.com',
        phone: '9848099001',
        role: UserRole.ADMIN,
        city: 'Guntur',
        location: 'State Transfusion HQ, Guntur',
        designation: 'Principal System Administrator',
        department: 'Central Blood Transfusion Council',
        employeeId: 'SBTC-AP-2026-01',
      },
      {
        id: 'LD-ADM-HANITHA',
        name: 'Hanitha (Administrator)',
        email: 'adminhanitha@gmail.com',
        phone: '9848099002',
        role: UserRole.ADMIN,
        city: 'Guntur',
        location: 'State Transfusion HQ, Guntur',
        designation: 'Clinical Operations Director & System Administrator',
        department: 'Central Blood Transfusion Council',
        employeeId: 'SBTC-AP-2026-02',
      },
      {
        id: 'LD-ADM-001',
        name: 'Dr. Rajesh Varma',
        email: 'admin.rajesh@lifedrop.io',
        phone: '9848011223',
        role: UserRole.ADMIN,
        city: 'Guntur',
        location: 'State Transfusion HQ, Guntur',
        designation: 'Director of Clinical Operations & Network Oversight',
        department: 'State Blood Transfusion Council (SBTC), AP',
        employeeId: 'SBTC-AP-2026-08',
      },
    ];

    for (const adm of adminAccounts) {
      const existing = await client.user.findFirst({
        where: {
          OR: [
            { id: adm.id },
            { email: { equals: adm.email, mode: 'insensitive' } },
            { phone: adm.phone },
          ],
        },
      });

      if (!existing) {
        await client.user.create({
          data: {
            id: adm.id,
            name: adm.name,
            email: adm.email,
            phone: adm.phone,
            passwordHash: adminPasswordHash,
            role: adm.role,
            status: UserStatus.ACTIVE,
            city: adm.city,
            location: adm.location,
            latitude: 16.3067,
            longitude: 80.4365,
            adminProfile: {
              create: {
                designation: adm.designation,
                department: adm.department,
                employeeId: adm.employeeId,
                passkeyHash: adminPasskeyHash,
                twoFactorEnabled: true,
              },
            },
            notificationPreferences: {
              create: { inAppUrgent: true, inAppGeneral: true, smsEmergency: true, emailDigest: true },
            },
          },
        });
      } else {
        // Ensure AdminProfile exists without modifying existing password
        const adminProfile = await client.adminProfile.findUnique({ where: { userId: existing.id } });
        if (!adminProfile) {
          await client.adminProfile.create({
            data: {
              userId: existing.id,
              designation: adm.designation,
              department: adm.department,
              employeeId: adm.employeeId,
              passkeyHash: adminPasskeyHash,
              twoFactorEnabled: true,
            },
          });
        }
      }
    }

    // -------------------------------------------------------------
    // 2. DONORS & REGULAR USER DEMO ACCOUNTS
    // -------------------------------------------------------------
    const donorData = [
      {
        id: 'LD-DON-1045',
        name: 'Hemendra Das',
        phone: '9848012345',
        email: 'hemendra.das@lifedrop.io',
        dob: new Date('1998-05-15'),
        bloodGroup: BloodGroup.O_POS,
        city: 'Guntur',
        location: 'Brodipet, Guntur',
        latitude: 16.3067,
        longitude: 80.4365,
        lastDonationDate: new Date('2026-04-10'),
        nextEligibleDate: new Date('2026-07-09'),
        totalDonations: 4,
        rank: 'Gold' as const,
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      },
      {
        id: 'LD-DON-1046',
        name: 'Pranaya',
        phone: '9848056789',
        email: 'pranaya@lifedrop.io',
        dob: new Date('2000-08-22'),
        bloodGroup: BloodGroup.A_POS,
        city: 'Guntur',
        location: 'Arundelpet, Guntur',
        latitude: 16.3025,
        longitude: 80.4412,
        lastDonationDate: new Date('2026-03-15'),
        nextEligibleDate: new Date('2026-06-13'),
        totalDonations: 2,
        rank: 'Silver' as const,
        avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      },
      {
        id: 'LD-DON-1047',
        name: 'Sahith Ram',
        phone: '9848099887',
        email: 'sahith.ram@lifedrop.io',
        dob: new Date('1996-11-10'),
        bloodGroup: BloodGroup.B_POS,
        city: 'Guntur',
        location: 'Nagarampalem, Guntur',
        latitude: 16.3112,
        longitude: 80.432,
        lastDonationDate: new Date('2026-02-20'),
        nextEligibleDate: new Date('2026-05-21'),
        totalDonations: 7,
        rank: 'Platinum' as const,
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      },
    ];

    for (const d of donorData) {
      const existing = await client.user.findFirst({
        where: {
          OR: [
            { id: d.id },
            { email: { equals: d.email, mode: 'insensitive' } },
            { phone: d.phone },
          ],
        },
        include: { donorProfile: true },
      });

      if (!existing) {
        await client.user.create({
          data: {
            id: d.id,
            name: d.name,
            phone: d.phone,
            email: d.email,
            dob: d.dob,
            passwordHash: defaultPasswordHash,
            role: UserRole.USER,
            status: UserStatus.ACTIVE,
            city: d.city,
            location: d.location,
            latitude: d.latitude,
            longitude: d.longitude,
            avatarUrl: d.avatarUrl,
            donorProfile: {
              create: {
                bloodGroup: d.bloodGroup,
                isEligible: true,
                lastDonationDate: d.lastDonationDate,
                nextEligibleDate: d.nextEligibleDate,
                totalDonations: d.totalDonations,
                rank: d.rank,
                availability: {
                  create: {
                    isAvailable: true,
                    availableDays: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
                    preferredRadiusKm: 25.0,
                    emergencyOnly: false,
                  },
                },
                consent: {
                  create: {
                    sharePhoneWithHospitals: true,
                    allowEmergencyRadar: true,
                    allowSmsNotifications: true,
                    allowEmailNotifications: true,
                  },
                },
              },
            },
            notificationPreferences: {
              create: { inAppUrgent: true, inAppGeneral: true, smsEmergency: true, emailDigest: false },
            },
          },
        });
      } else {
        // If user exists but is missing donor profile, attach it
        if (!existing.donorProfile) {
          await client.donorProfile.create({
            data: {
              userId: existing.id,
              bloodGroup: d.bloodGroup,
              isEligible: true,
              lastDonationDate: d.lastDonationDate,
              nextEligibleDate: d.nextEligibleDate,
              totalDonations: d.totalDonations,
              rank: d.rank,
              availability: {
                create: {
                  isAvailable: true,
                  availableDays: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
                  preferredRadiusKm: 25.0,
                  emergencyOnly: false,
                },
              },
              consent: {
                create: {
                  sharePhoneWithHospitals: true,
                  allowEmergencyRadar: true,
                  allowSmsNotifications: true,
                  allowEmailNotifications: true,
                },
              },
            },
          });
        }
      }
    }

    // -------------------------------------------------------------
    // 3. APPROVED DEMO HOSPITALS (Displayed in Hospitals & Clinics)
    // -------------------------------------------------------------
    const approvedHospitalData = [
      {
        id: 'LD-HOSP-01',
        userId: 'USER-HOSP-01',
        appId: 'APP-HOSP-DEMO-01',
        refNum: 'APP-HOSP-2026-DEMO1',
        name: 'Government General Hospital (GGH), Guntur',
        type: 'Government',
        registrationNumber: 'HOSP-AP-GGH-001',
        address: 'Kanna Vari Thota, Opposite Guntur Medical College',
        area: 'Kanna Vari Thota',
        city: 'Guntur',
        state: 'Andhra Pradesh',
        pinCode: '522004',
        phone: '08632224095',
        email: 'superintendent@gghguntur.gov.in',
        website: 'https://gghguntur.andhra.gov.in',
        image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&auto=format&fit=crop&q=80',
        licenseNumber: 'HOSP-AP-2024-8891',
        latitude: 16.2995,
        longitude: 80.443,
        services: [
          '24/7 Level 1 Emergency & Trauma Care',
          'Blood Transfusion Wing',
          'Cardiothoracic ICU',
          'Pediatric Surgery',
          'Dialysis Center',
        ],
      },
      {
        id: 'LD-HOSP-02',
        userId: 'USER-HOSP-02',
        appId: 'APP-HOSP-DEMO-02',
        refNum: 'APP-HOSP-2026-DEMO2',
        name: 'Ramesh Hospitals, Guntur',
        type: 'Private',
        registrationNumber: 'HOSP-AP-RMH-104',
        address: 'Near Collector Office, Ring Road, Nagarampalem',
        area: 'Nagarampalem',
        city: 'Guntur',
        state: 'Andhra Pradesh',
        pinCode: '522004',
        phone: '08632377777',
        email: 'info@rameshhospitals.com',
        website: 'https://www.rameshhospitals.com',
        image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80',
        licenseNumber: 'HOSP-AP-2023-4120',
        latitude: 16.3082,
        longitude: 80.4358,
        services: [
          '24/7 Cardiac Emergency',
          'Critical Care & Neuro Trauma',
          'Oncology Care',
          'Hemophilia & Blood Bank Wing',
        ],
      },
      {
        id: 'LD-HOSP-03',
        userId: 'USER-HOSP-03',
        appId: 'APP-HOSP-DEMO-03',
        refNum: 'APP-HOSP-2026-DEMO3',
        name: 'NRI General Hospital & Medical College',
        type: 'Trust / NGO',
        registrationNumber: 'HOSP-AP-NRI-208',
        address: 'National Highway 16, Mangalagiri Road, Chinakakani',
        area: 'Chinakakani',
        city: 'Guntur',
        state: 'Andhra Pradesh',
        pinCode: '522503',
        phone: '08645230101',
        email: 'emergency@nrihospitals.com',
        website: 'https://www.nrias.net',
        image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&auto=format&fit=crop&q=80',
        licenseNumber: 'HOSP-AP-2025-9011',
        latitude: 16.425,
        longitude: 80.563,
        services: [
          'Multi-Speciality Trauma Center',
          'Organ Transplant Unit',
          'Neonatal ICU',
          'Advanced Blood Bank',
        ],
      },
    ];

    for (const h of approvedHospitalData) {
      // 1. Ensure User account exists in ACTIVE status
      let user = await client.user.findFirst({
        where: {
          OR: [
            { id: h.userId },
            { email: { equals: h.email, mode: 'insensitive' } },
            { phone: h.phone },
          ],
        },
      });

      if (!user) {
        user = await client.user.create({
          data: {
            id: h.userId,
            name: h.name,
            phone: h.phone,
            email: h.email,
            passwordHash: defaultPasswordHash,
            role: UserRole.HOSPITAL,
            status: UserStatus.ACTIVE,
            city: h.city,
            location: h.address,
            latitude: h.latitude,
            longitude: h.longitude,
            notificationPreferences: {
              create: { inAppUrgent: true, inAppGeneral: true, smsEmergency: true, emailDigest: true },
            },
          },
        });
      } else {
        if (user.status !== UserStatus.ACTIVE || user.name.includes('[DEMO - PENDING APPROVAL]')) {
          user = await client.user.update({
            where: { id: user.id },
            data: {
              name: h.name,
              status: UserStatus.ACTIVE,
              role: UserRole.HOSPITAL,
            },
          });
        }
      }

      // 2. Ensure FacilityApplication exists and is APPROVED + activated
      let app = await client.facilityApplication.findFirst({
        where: {
          OR: [
            { id: h.appId },
            { referenceNumber: h.refNum },
            { email: { equals: h.email, mode: 'insensitive' } },
            { licenseNumber: h.licenseNumber },
          ],
        },
      });

      if (!app) {
        app = await client.facilityApplication.create({
          data: {
            id: h.appId,
            referenceNumber: h.refNum,
            facilityType: FacilityType.HOSPITAL,
            name: h.name,
            category: h.type,
            phone: h.phone,
            email: h.email,
            address: h.address,
            area: h.area,
            city: h.city,
            state: h.state,
            pinCode: h.pinCode,
            latitude: h.latitude,
            longitude: h.longitude,
            licenseNumber: h.licenseNumber,
            registrationNumber: h.registrationNumber,
            authorizedPersonName: 'Medical Superintendent',
            authorizedPersonDesignation: 'Director of Healthcare Services',
            authorizedPersonPhone: h.phone,
            authorizedPersonEmail: h.email,
            services: h.services,
            status: ApplicationStatus.APPROVED,
            isActivated: true,
            activatedAt: new Date(),
            approvedAt: new Date(),
            createdUserId: user.id,
            passwordHash: defaultPasswordHash,
          },
        });
      } else {
        if (app.status !== ApplicationStatus.APPROVED || !app.isActivated || app.name.includes('[DEMO - PENDING APPROVAL]')) {
          app = await client.facilityApplication.update({
            where: { id: app.id },
            data: {
              name: h.name,
              status: ApplicationStatus.APPROVED,
              isActivated: true,
              activatedAt: app.activatedAt || new Date(),
              createdUserId: user.id,
            },
          });
        }
      }

      // 3. Ensure Hospital profile is VERIFIED
      let hospital = await client.hospital.findFirst({
        where: {
          OR: [
            { id: h.id },
            { userId: user.id },
            { licenseNumber: h.licenseNumber },
            { facilityApplicationId: app.id },
          ],
        },
      });

      if (!hospital) {
        await client.hospital.create({
          data: {
            id: h.id,
            userId: user.id,
            name: h.name,
            type: h.type,
            registrationNumber: h.registrationNumber,
            phone: h.phone,
            email: h.email,
            website: h.website,
            image: h.image,
            address: h.address,
            area: h.area,
            city: h.city,
            state: h.state,
            pinCode: h.pinCode,
            latitude: h.latitude,
            longitude: h.longitude,
            services: h.services,
            licenseNumber: h.licenseNumber,
            isVerified: true,
            status: VerificationStatus.VERIFIED,
            facilityApplicationId: app.id,
          },
        });
      } else {
        if (!hospital.isVerified || hospital.status !== VerificationStatus.VERIFIED || hospital.name.includes('[DEMO - PENDING APPROVAL]')) {
          await client.hospital.update({
            where: { id: hospital.id },
            data: {
              userId: user.id,
              name: h.name,
              isVerified: true,
              status: VerificationStatus.VERIFIED,
              facilityApplicationId: app.id,
            },
          });
        }
      }
    }

    // -------------------------------------------------------------
    // 4. APPROVED DEMO BLOOD BANKS (Displayed in Blood Banks)
    // -------------------------------------------------------------
    const approvedBloodBankData = [
      {
        id: 'LD-BB-01',
        userId: 'USER-BB-01',
        appId: 'APP-BB-DEMO-01',
        refNum: 'APP-BB-2026-DEMO1',
        name: 'Indian Red Cross Society Blood Bank, Guntur',
        type: 'NGO / Trust',
        registrationNumber: 'BB-AP-GNT-101',
        address: 'Collectorate Compound, Kanna Vari Thota',
        area: 'Collectorate Compound',
        city: 'Guntur',
        state: 'Andhra Pradesh',
        pinCode: '522004',
        phone: '08632234050',
        email: 'redcross.guntur@redcross.org.in',
        image: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=600&auto=format&fit=crop&q=80',
        licenseNumber: 'BB-AP-GNT-2023-1029',
        latitude: 16.301,
        longitude: 80.4418,
        inventory: {
          [BloodGroup.O_POS]: { available: 14, reserved: 2, supplied: 85 },
          [BloodGroup.O_NEG]: { available: 4, reserved: 0, supplied: 38 },
          [BloodGroup.A_POS]: { available: 16, reserved: 1, supplied: 92 },
          [BloodGroup.A_NEG]: { available: 5, reserved: 0, supplied: 28 },
          [BloodGroup.B_POS]: { available: 18, reserved: 1, supplied: 79 },
          [BloodGroup.B_NEG]: { available: 4, reserved: 0, supplied: 24 },
          [BloodGroup.AB_POS]: { available: 8, reserved: 0, supplied: 35 },
          [BloodGroup.AB_NEG]: { available: 2, reserved: 0, supplied: 14 },
        },
      },
      {
        id: 'LD-BB-02',
        userId: 'USER-BB-02',
        appId: 'APP-BB-DEMO-02',
        refNum: 'APP-BB-2026-DEMO2',
        name: 'Rotary Club of Guntur Blood Bank',
        type: 'NGO / Trust',
        registrationNumber: 'BB-AP-GNT-202',
        address: '4th Lane, Main Road, Brodipet',
        area: 'Brodipet',
        city: 'Guntur',
        state: 'Andhra Pradesh',
        pinCode: '522002',
        phone: '08632235555',
        email: 'rotarybloodbank.guntur@gmail.com',
        image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80',
        licenseNumber: 'BB-AP-GNT-2024-5501',
        latitude: 16.3075,
        longitude: 80.434,
        inventory: {
          [BloodGroup.O_POS]: { available: 18, reserved: 0, supplied: 110 },
          [BloodGroup.O_NEG]: { available: 3, reserved: 0, supplied: 42 },
          [BloodGroup.A_POS]: { available: 15, reserved: 0, supplied: 80 },
          [BloodGroup.A_NEG]: { available: 3, reserved: 0, supplied: 22 },
          [BloodGroup.B_POS]: { available: 12, reserved: 0, supplied: 65 },
          [BloodGroup.B_NEG]: { available: 3, reserved: 0, supplied: 18 },
          [BloodGroup.AB_POS]: { available: 6, reserved: 0, supplied: 30 },
          [BloodGroup.AB_NEG]: { available: 1, reserved: 0, supplied: 10 },
        },
      },
    ];

    for (const b of approvedBloodBankData) {
      // 1. Ensure User account exists in ACTIVE status
      let user = await client.user.findFirst({
        where: {
          OR: [
            { id: b.userId },
            { email: { equals: b.email, mode: 'insensitive' } },
            { phone: b.phone },
          ],
        },
      });

      if (!user) {
        user = await client.user.create({
          data: {
            id: b.userId,
            name: b.name,
            phone: b.phone,
            email: b.email,
            passwordHash: defaultPasswordHash,
            role: UserRole.BLOOD_BANK,
            status: UserStatus.ACTIVE,
            city: b.city,
            location: b.address,
            latitude: b.latitude,
            longitude: b.longitude,
            notificationPreferences: {
              create: { inAppUrgent: true, inAppGeneral: true, smsEmergency: true, emailDigest: true },
            },
          },
        });
      } else {
        if (user.status !== UserStatus.ACTIVE || user.name.includes('[DEMO - PENDING APPROVAL]')) {
          user = await client.user.update({
            where: { id: user.id },
            data: {
              name: b.name,
              status: UserStatus.ACTIVE,
              role: UserRole.BLOOD_BANK,
            },
          });
        }
      }

      // 2. Ensure FacilityApplication exists and is APPROVED + activated
      let app = await client.facilityApplication.findFirst({
        where: {
          OR: [
            { id: b.appId },
            { referenceNumber: b.refNum },
            { email: { equals: b.email, mode: 'insensitive' } },
            { licenseNumber: b.licenseNumber },
          ],
        },
      });

      if (!app) {
        app = await client.facilityApplication.create({
          data: {
            id: b.appId,
            referenceNumber: b.refNum,
            facilityType: FacilityType.BLOOD_BANK,
            name: b.name,
            category: b.type,
            phone: b.phone,
            email: b.email,
            address: b.address,
            area: b.area,
            city: b.city,
            state: b.state,
            pinCode: b.pinCode,
            latitude: b.latitude,
            longitude: b.longitude,
            licenseNumber: b.licenseNumber,
            registrationNumber: b.registrationNumber,
            authorizedPersonName: 'Chief Blood Transfusion Officer',
            authorizedPersonDesignation: 'Director of Blood Services',
            authorizedPersonPhone: b.phone,
            authorizedPersonEmail: b.email,
            componentsAvailable: ['Whole Blood', 'Packed Red Blood Cells', 'Plasma', 'Platelets'],
            status: ApplicationStatus.APPROVED,
            isActivated: true,
            activatedAt: new Date(),
            approvedAt: new Date(),
            createdUserId: user.id,
            passwordHash: defaultPasswordHash,
          },
        });
      } else {
        if (app.status !== ApplicationStatus.APPROVED || !app.isActivated || app.name.includes('[DEMO - PENDING APPROVAL]')) {
          app = await client.facilityApplication.update({
            where: { id: app.id },
            data: {
              name: b.name,
              status: ApplicationStatus.APPROVED,
              isActivated: true,
              activatedAt: app.activatedAt || new Date(),
              createdUserId: user.id,
            },
          });
        }
      }

      // 3. Ensure BloodBank profile is VERIFIED
      let bloodBank = await client.bloodBank.findFirst({
        where: {
          OR: [
            { id: b.id },
            { userId: user.id },
            { licenseNumber: b.licenseNumber },
            { facilityApplicationId: app.id },
          ],
        },
      });

      if (!bloodBank) {
        bloodBank = await client.bloodBank.create({
          data: {
            id: b.id,
            userId: user.id,
            name: b.name,
            type: b.type,
            registrationNumber: b.registrationNumber,
            phone: b.phone,
            email: b.email,
            image: b.image,
            address: b.address,
            area: b.area,
            city: b.city,
            state: b.state,
            pinCode: b.pinCode,
            latitude: b.latitude,
            longitude: b.longitude,
            licenseNumber: b.licenseNumber,
            isVerified: true,
            status: VerificationStatus.VERIFIED,
            facilityApplicationId: app.id,
          },
        });
      } else {
        if (!bloodBank.isVerified || bloodBank.status !== VerificationStatus.VERIFIED || bloodBank.name.includes('[DEMO - PENDING APPROVAL]')) {
          bloodBank = await client.bloodBank.update({
            where: { id: bloodBank.id },
            data: {
              userId: user.id,
              name: b.name,
              isVerified: true,
              status: VerificationStatus.VERIFIED,
              facilityApplicationId: app.id,
            },
          });
        }
      }

      // 4. Seed initial stock balance if none exists
      for (const group of ALL_BLOOD_GROUPS) {
        const stockData = (b.inventory as any)?.[group] || { available: 5, reserved: 0, supplied: 10 };
        const existingBal = await client.inventoryBalance.findUnique({
          where: {
            bloodBankId_bloodGroup_componentType: {
              bloodBankId: bloodBank.id,
              bloodGroup: group,
              componentType: ComponentType.RED_BLOOD_CELLS,
            },
          },
        });

        if (!existingBal) {
          await client.inventoryBalance.create({
            data: {
              bloodBankId: bloodBank.id,
              bloodGroup: group,
              componentType: ComponentType.RED_BLOOD_CELLS,
              availableUnits: stockData.available,
              reservedUnits: stockData.reserved,
              suppliedUnits: stockData.supplied,
            },
          });
        }
      }
    }

    // -------------------------------------------------------------
    // 5. PENDING DEMO FACILITY APPLICATIONS (Displayed in Facility Applications)
    // -------------------------------------------------------------
    const pendingApplications = [
      {
        id: 'APP-HOSP-DEMO-04',
        referenceNumber: 'APP-HOSP-2026-DEMO4',
        facilityType: FacilityType.HOSPITAL,
        name: 'Apollo Specialty Hospitals, Guntur',
        category: 'Private Tertiary Care',
        phone: '9848077111',
        email: 'apollodemo@gunturhealth.org',
        address: 'Nagarampalem Main Road, Opp Municipal Stadium',
        area: 'Nagarampalem',
        city: 'Guntur',
        state: 'Andhra Pradesh',
        pinCode: '522004',
        latitude: 16.309,
        longitude: 80.437,
        licenseNumber: 'HOSP-LIC-APOLLO-DEMO',
        registrationNumber: 'HOSP-REG-AP-2026-8812',
        authorizedPersonName: 'Dr. S. K. Murthy',
        authorizedPersonDesignation: 'Medical Superintendent & Trauma Head',
        authorizedPersonPhone: '9848077111',
        authorizedPersonEmail: 'apollodemo@gunturhealth.org',
        services: ['24/7 Level 1 Trauma Care', 'Oncology Center', 'Advanced Transfusion Unit'],
        status: ApplicationStatus.PENDING,
        isActivated: false,
        passwordHash: defaultPasswordHash,
        documents: [
          {
            documentType: 'LICENSE',
            fileName: 'apollo_clinical_establishment_license.pdf',
            fileUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
          },
          {
            documentType: 'REGISTRATION_CERT',
            fileName: 'ap_state_health_registry_cert.pdf',
            fileUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
          },
        ],
      },
      {
        id: 'APP-HOSP-DEMO-05',
        referenceNumber: 'APP-HOSP-2026-DEMO5',
        facilityType: FacilityType.HOSPITAL,
        name: 'St. Jude Emergency Care Center',
        category: 'Charitable Trust Hospital',
        phone: '9848077222',
        email: 'stjudedemo@emergency.org',
        address: 'Brodipet 5th Lane, Medical Hub',
        area: 'Brodipet',
        city: 'Guntur',
        state: 'Andhra Pradesh',
        pinCode: '522002',
        latitude: 16.305,
        longitude: 80.438,
        licenseNumber: 'HOSP-LIC-STJUDE-DEMO',
        registrationNumber: 'HOSP-REG-AP-2026-9934',
        authorizedPersonName: 'Dr. Sister Mary Thomas',
        authorizedPersonDesignation: 'Hospital Administrator',
        authorizedPersonPhone: '9848077222',
        authorizedPersonEmail: 'stjudedemo@emergency.org',
        services: ['Emergency & Acute Medical Response', 'Pediatric ICU'],
        status: ApplicationStatus.UNDER_REVIEW,
        isActivated: false,
        passwordHash: defaultPasswordHash,
        documents: [
          {
            documentType: 'LICENSE',
            fileName: 'st_jude_establishment_permit.pdf',
            fileUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
          },
        ],
      },
      {
        id: 'APP-BB-DEMO-03',
        referenceNumber: 'APP-BB-2026-DEMO3',
        facilityType: FacilityType.BLOOD_BANK,
        name: 'Sanjeevani Voluntary Blood Bank',
        category: 'Charitable Society',
        phone: '9848088111',
        email: 'sanjeevanidemo@bloodbank.org',
        address: 'Old Club Road, Kothapet',
        area: 'Kothapet',
        city: 'Guntur',
        state: 'Andhra Pradesh',
        pinCode: '522001',
        latitude: 16.302,
        longitude: 80.444,
        licenseNumber: 'BB-LIC-SANJEEVANI-DEMO',
        registrationNumber: 'BB-REG-AP-2026-5510',
        authorizedPersonName: 'K. Venkatesh Rao',
        authorizedPersonDesignation: 'Chief Technical Officer',
        authorizedPersonPhone: '9848088111',
        authorizedPersonEmail: 'sanjeevanidemo@bloodbank.org',
        componentsAvailable: ['Whole Blood', 'Packed Red Blood Cells', 'Fresh Frozen Plasma'],
        status: ApplicationStatus.PENDING,
        isActivated: false,
        passwordHash: defaultPasswordHash,
        documents: [
          {
            documentType: 'LICENSE',
            fileName: 'form_28c_blood_bank_license.pdf',
            fileUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
          },
        ],
      },
      {
        id: 'APP-BB-DEMO-04',
        referenceNumber: 'APP-BB-2026-DEMO4',
        facilityType: FacilityType.BLOOD_BANK,
        name: 'Suraksha Regional Blood Center',
        category: 'Private Blood Center',
        phone: '9848088222',
        email: 'surakshademo@bloodcenter.org',
        address: 'Station Road, Guntur Junction Area',
        area: 'Station Road',
        city: 'Guntur',
        state: 'Andhra Pradesh',
        pinCode: '522001',
        latitude: 16.308,
        longitude: 80.446,
        licenseNumber: 'BB-LIC-SURAKSHA-DEMO',
        registrationNumber: 'BB-REG-AP-2026-7721',
        authorizedPersonName: 'Dr. C. Madhava Reddy',
        authorizedPersonDesignation: 'Medical Director',
        authorizedPersonPhone: '9848088222',
        authorizedPersonEmail: 'surakshademo@bloodcenter.org',
        componentsAvailable: ['Packed Red Cells', 'Platelet Concentrates', 'Cryoprecipitate'],
        status: ApplicationStatus.UNDER_REVIEW,
        isActivated: false,
        passwordHash: defaultPasswordHash,
        documents: [
          {
            documentType: 'LICENSE',
            fileName: 'form_28c_renewal_application.pdf',
            fileUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
          },
        ],
      },
    ];

    for (const appData of pendingApplications) {
      const existing = await client.facilityApplication.findFirst({
        where: {
          OR: [
            { id: appData.id },
            { referenceNumber: appData.referenceNumber },
            { email: { equals: appData.email, mode: 'insensitive' } },
            { licenseNumber: appData.licenseNumber },
          ],
        },
      });

      if (!existing) {
        await client.facilityApplication.create({
          data: {
            id: appData.id,
            referenceNumber: appData.referenceNumber,
            facilityType: appData.facilityType,
            name: appData.name,
            category: appData.category,
            phone: appData.phone,
            email: appData.email,
            address: appData.address,
            area: appData.area,
            city: appData.city,
            state: appData.state,
            pinCode: appData.pinCode,
            latitude: appData.latitude,
            longitude: appData.longitude,
            licenseNumber: appData.licenseNumber,
            registrationNumber: appData.registrationNumber,
            authorizedPersonName: appData.authorizedPersonName,
            authorizedPersonDesignation: appData.authorizedPersonDesignation,
            authorizedPersonPhone: appData.authorizedPersonPhone,
            authorizedPersonEmail: appData.authorizedPersonEmail,
            services: appData.services || [],
            componentsAvailable: appData.componentsAvailable || [],
            status: appData.status,
            isActivated: false,
            passwordHash: appData.passwordHash,
            documents: {
              create: appData.documents.map((doc) => ({
                documentType: doc.documentType,
                fileName: doc.fileName,
                fileUrl: doc.fileUrl,
              })),
            },
          },
        });
      }
    }

    logger.info('LifeDrop demo accounts verified and seeded successfully in database.');
    return { success: true, message: 'Demo accounts verified and seeded successfully.' };
  } catch (err: any) {
    logger.error({ err }, 'Error during demo account seeding');
    throw err;
  }
}
