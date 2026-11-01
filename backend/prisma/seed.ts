import { PrismaClient, BloodGroup, UserRole, VerificationStatus, UserStatus } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();


async function main() {
  console.log('🌱 Starting LifeDrop database seeding...');

  // Seed credentials: development fallbacks are allowed only outside production.
  // Production seeding must use explicitly configured secrets.
  const isProduction = process.env.NODE_ENV === 'production';

  function getSeedSecret(name: string, developmentFallback: string): string {
    const value = process.env[name]?.trim();

    if (isProduction && !value) {
      throw new Error(
        `Missing required production environment variable: ${name}. Seeding has been stopped.`
      );
    }

    if (!isProduction && !value) {
      console.warn(
        `⚠️ ${name} is not set. Using the development-only fallback.`
      );
    }

    return value || developmentFallback;
  }

  const defaultPassword = getSeedSecret(
    'SEED_DEFAULT_PASSWORD',
    'LifeDrop@2026!'
  );
  const adminPassword = getSeedSecret(
    'SEED_ADMIN_PASSWORD',
    'Admin@123'
  );
  const adminPasskey = getSeedSecret(
    'ADMIN_PASSKEY_PIN',
    '222005'
  );

  const defaultPasswordHash = await argon2.hash(defaultPassword);
  const adminPasswordHash = await argon2.hash(adminPassword);
  const adminPasskeyHash = await argon2.hash(adminPasskey);

  // 1. Seed Admin Users & Profiles
  console.log('Creating Admin Users...');
  const adminAccounts = [
    {
      id: 'LD-ADM-ROHAN',
      name: 'Rohan (Administrator)',
      email: 'adminrohan@gmail.com',
      phone: '9848099001',
      passwordHash: adminPasswordHash,
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
      passwordHash: adminPasswordHash,
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
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      city: 'Guntur',
      location: 'State Transfusion HQ, Guntur',
      designation: 'Director of Clinical Operations & Network Oversight',
      department: 'State Blood Transfusion Council (SBTC), AP',
      employeeId: 'SBTC-AP-2026-08',
    },
  ];

  for (const adm of adminAccounts) {
    await prisma.user.upsert({
      where: { id: adm.id },
      update: {},
      create: {
        id: adm.id,
        name: adm.name,
        email: adm.email,
        phone: adm.phone,
        passwordHash: adm.passwordHash,
        role: adm.role,
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
            lastLogin: new Date(),
          },
        },
        notificationPreferences: {
          create: {
            inAppUrgent: true,
            inAppGeneral: true,
            smsEmergency: true,
            emailDigest: true,
          },
        },
      },
    });
  }

  // 2. Seed Donors / Regular Users
  console.log('Creating Donors...');
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
    await prisma.user.upsert({
      where: { id: d.id },
      update: {},
      create: {
        id: d.id,
        name: d.name,
        phone: d.phone,
        email: d.email,
        dob: d.dob,
        passwordHash: defaultPasswordHash,
        role: UserRole.USER,
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
          create: {
            inAppUrgent: true,
            inAppGeneral: true,
            smsEmergency: true,
            emailDigest: false,
          },
        },
      },
    });
  }

  // 3. Seed Hospitals
  console.log('Creating Hospitals...');
  const hospitalData = [
    {
      id: 'LD-HOSP-01',
      userId: 'USER-HOSP-01',
      name: '[DEMO - PENDING APPROVAL] Government General Hospital (GGH), Guntur',
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
      name: '[DEMO - PENDING APPROVAL] Ramesh Hospitals, Guntur',
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
      name: '[DEMO - PENDING APPROVAL] NRI General Hospital & Medical College',
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

  for (const h of hospitalData) {
    await prisma.user.upsert({
      where: { id: h.userId },
      update: {
        status: UserStatus.PENDING_ACTIVATION,
        hospital: {
          update: {
            isVerified: false,
            status: VerificationStatus.PENDING_APPROVAL,
          },
        },
      },
      create: {
        id: h.userId,
        name: h.name,
        phone: h.phone,
        email: h.email,
        passwordHash: defaultPasswordHash,
        role: UserRole.HOSPITAL,
        status: UserStatus.PENDING_ACTIVATION,
        city: h.city,
        location: h.address,
        latitude: h.latitude,
        longitude: h.longitude,
        hospital: {
          create: {
            id: h.id,
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
            // Hospital requires admin approval
            isVerified: false,
            status: VerificationStatus.PENDING_APPROVAL,
          },
        },
      },
    });
  }

  // These demo facilities are deliberately created as pending and have no inventory.
  // Do not add stock, requests, or campaigns until an administrator approves a facility.
  // 4. Seed Demo Blood Banks (Pending Approval)
  console.log('Creating Demo Blood Banks (Pending Approval)...');
  const bloodBankData = [
    {
      id: 'LD-BB-01',
      userId: 'USER-BB-01',
      name: '[DEMO - PENDING APPROVAL] Indian Red Cross Society Blood Bank, Guntur',
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
      longitude: 80.4418
    },
    {
      id: 'LD-BB-02',
      userId: 'USER-BB-02',
      name: '[DEMO - PENDING APPROVAL] Rotary Club of Guntur Blood Bank',
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
      longitude: 80.434
    },
  ];

  for (const bb of bloodBankData) {
    await prisma.user.upsert({
      where: { id: bb.userId },
      update: {
        status: UserStatus.PENDING_ACTIVATION,
        bloodBank: {
          update: {
            isVerified: false,
            status: VerificationStatus.PENDING_APPROVAL,
          },
        },
      },
      create: {
        id: bb.userId,
        name: bb.name,
        phone: bb.phone,
        email: bb.email,
        passwordHash: defaultPasswordHash,
        role: UserRole.BLOOD_BANK,
        status: UserStatus.PENDING_ACTIVATION,
        city: bb.city,
        location: bb.address,
        latitude: bb.latitude,
        longitude: bb.longitude,
        bloodBank: {
          create: {
            id: bb.id,
            name: bb.name,
            type: bb.type,
            registrationNumber: bb.registrationNumber,
            phone: bb.phone,
            email: bb.email,
            image: bb.image,
            address: bb.address,
            area: bb.area,
            city: bb.city,
            state: bb.state,
            pinCode: bb.pinCode,
            latitude: bb.latitude,
            longitude: bb.longitude,
            licenseNumber: bb.licenseNumber,
            isVerified: false,
            status: VerificationStatus.PENDING_APPROVAL,
          },
        },
      },
    });
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
