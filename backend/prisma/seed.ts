import { PrismaClient, BloodGroup, UserRole, EmergencyLevel, RequestStatus, DonorResponseStatus, BloodBankResponseStatus, VerificationStatus, ComponentType } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

const bloodGroupMap: Record<string, BloodGroup> = {
  'A+': BloodGroup.A_POS,
  'A-': BloodGroup.A_NEG,
  'B+': BloodGroup.B_POS,
  'B-': BloodGroup.B_NEG,
  'AB+': BloodGroup.AB_POS,
  'AB-': BloodGroup.AB_NEG,
  'O+': BloodGroup.O_POS,
  'O-': BloodGroup.O_NEG,
};

async function main() {
  console.log('🌱 Starting LifeDrop database seeding...');

  // Common hashed password for all initial demo accounts
  const defaultPasswordHash = await argon2.hash('LifeDrop@2026!');
  const adminPasswordHash = await argon2.hash('Admin@123');
  const adminPasskeyHash = await argon2.hash('901234');

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
      passwordHash: defaultPasswordHash,
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
      update: {
        email: adm.email,
        passwordHash: adm.passwordHash,
        role: adm.role,
        name: adm.name,
      },
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
      services: ['24/7 Level 1 Emergency & Trauma Care', 'Blood Transfusion Wing', 'Cardiothoracic ICU', 'Pediatric Surgery', 'Dialysis Center'],
    },
    {
      id: 'LD-HOSP-02',
      userId: 'USER-HOSP-02',
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
      services: ['24/7 Cardiac Emergency', 'Critical Care & Neuro Trauma', 'Oncology Care', 'Hemophilia & Blood Bank Wing'],
    },
    {
      id: 'LD-HOSP-03',
      userId: 'USER-HOSP-03',
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
      services: ['Multi-Speciality Trauma Center', 'Organ Transplant Unit', 'Neonatal ICU', 'Advanced Blood Bank'],
    },
  ];

  for (const h of hospitalData) {
    await prisma.user.upsert({
      where: { id: h.userId },
      update: {},
      create: {
        id: h.userId,
        name: h.name,
        phone: h.phone,
        email: h.email,
        passwordHash: defaultPasswordHash,
        role: UserRole.HOSPITAL,
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
            isVerified: true,
            status: VerificationStatus.VERIFIED,
          },
        },
      },
    });
  }

  // 4. Seed Blood Banks & Component Inventories
  console.log('Creating Blood Banks & Inventories...');
  const bloodBankData = [
    {
      id: 'LD-BB-01',
      userId: 'USER-BB-01',
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
      stock: [
        { group: BloodGroup.O_POS, available: 14, reserved: 2, supplied: 85 },
        { group: BloodGroup.O_NEG, available: 4, reserved: 0, supplied: 38 },
        { group: BloodGroup.A_POS, available: 16, reserved: 1, supplied: 92 },
        { group: BloodGroup.A_NEG, available: 5, reserved: 0, supplied: 28 },
        { group: BloodGroup.B_POS, available: 18, reserved: 1, supplied: 79 },
        { group: BloodGroup.B_NEG, available: 4, reserved: 0, supplied: 24 },
        { group: BloodGroup.AB_POS, available: 8, reserved: 0, supplied: 35 },
        { group: BloodGroup.AB_NEG, available: 2, reserved: 0, supplied: 14 },
      ],
    },
    {
      id: 'LD-BB-02',
      userId: 'USER-BB-02',
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
      stock: [
        { group: BloodGroup.O_POS, available: 18, reserved: 0, supplied: 110 },
        { group: BloodGroup.O_NEG, available: 3, reserved: 0, supplied: 42 },
        { group: BloodGroup.A_POS, available: 15, reserved: 0, supplied: 80 },
        { group: BloodGroup.A_NEG, available: 3, reserved: 0, supplied: 22 },
        { group: BloodGroup.B_POS, available: 12, reserved: 0, supplied: 65 },
        { group: BloodGroup.B_NEG, available: 3, reserved: 0, supplied: 18 },
        { group: BloodGroup.AB_POS, available: 6, reserved: 0, supplied: 30 },
        { group: BloodGroup.AB_NEG, available: 1, reserved: 0, supplied: 10 },
      ],
    },
  ];

  for (const bb of bloodBankData) {
    const user = await prisma.user.upsert({
      where: { id: bb.userId },
      update: {},
      create: {
        id: bb.userId,
        name: bb.name,
        phone: bb.phone,
        email: bb.email,
        passwordHash: defaultPasswordHash,
        role: UserRole.BLOOD_BANK,
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
            isVerified: true,
            status: VerificationStatus.VERIFIED,
          },
        },
      },
    });

    // Populate lots and maintained balance per blood group
    for (const item of bb.stock) {
      await prisma.inventoryBalance.upsert({
        where: {
          bloodBankId_bloodGroup_componentType: {
            bloodBankId: bb.id,
            bloodGroup: item.group,
            componentType: ComponentType.RED_BLOOD_CELLS,
          },
        },
        update: {},
        create: {
          bloodBankId: bb.id,
          bloodGroup: item.group,
          componentType: ComponentType.RED_BLOOD_CELLS,
          availableUnits: item.available,
          reservedUnits: item.reserved,
          suppliedUnits: item.supplied,
        },
      });

      // Create an active lot for this stock
      await prisma.inventoryLot.create({
        data: {
          bloodBankId: bb.id,
          bloodGroup: item.group,
          componentType: ComponentType.RED_BLOOD_CELLS,
          batchNumber: `LOT-2026-${bb.id}-${item.group}`,
          initialUnits: item.available + item.reserved,
          availableUnits: item.available,
          reservedUnits: item.reserved,
          suppliedUnits: item.supplied,
          collectionDate: new Date('2026-08-01'),
          expiryDate: new Date('2026-09-12'), // 42-day RBC viability
          status: 'AVAILABLE',
        },
      });
    }
  }

  // 5. Seed Blood Requests
  console.log('Creating Blood Requests...');
  const req1 = await prisma.bloodRequest.upsert({
    where: { id: 'LD1025' },
    update: {},
    create: {
      id: 'LD1025',
      hospitalId: 'LD-HOSP-01',
      patientName: 'Ravi Teja (Trauma Ward, Bed 12)',
      bloodGroup: BloodGroup.O_POS,
      componentType: ComponentType.RED_BLOOD_CELLS,
      requiredUnits: 2,
      allocatedUnits: 0,
      confirmedUnits: 0,
      remainingUnits: 2,
      emergencyLevel: EmergencyLevel.CRITICAL,
      requiredDateTime: new Date('2026-08-26T21:00:00Z'),
      contactNumber: '9848011299',
      notes: 'Emergency surgery scheduled for road traffic accident trauma.',
      status: RequestStatus.SEARCHING,
      timeline: [
        {
          title: 'Emergency Request Created',
          timestamp: '2026-08-26 17:30',
          description: 'GGH Guntur initiated emergency request for 2 units of O+ blood.',
          type: 'creation',
        },
        {
          title: 'Radar Broadcast Initiated',
          timestamp: '2026-08-26 17:30',
          description: 'Searching compatible nearby donors and registered blood banks in Guntur region.',
          type: 'match',
        },
      ],
    },
  });

  const req2 = await prisma.bloodRequest.upsert({
    where: { id: 'LD1026' },
    update: {},
    create: {
      id: 'LD1026',
      hospitalId: 'LD-HOSP-02',
      patientName: 'Sita Ramam (ICU Bed 4)',
      bloodGroup: BloodGroup.B_POS,
      componentType: ComponentType.RED_BLOOD_CELLS,
      requiredUnits: 3,
      allocatedUnits: 1,
      confirmedUnits: 1,
      remainingUnits: 1,
      emergencyLevel: EmergencyLevel.URGENT,
      requiredDateTime: new Date('2026-08-27T10:00:00Z'),
      contactNumber: '9848022444',
      notes: 'Severe cardiac post-operative recovery. Transfusion required.',
      status: RequestStatus.PARTIALLY_FULFILLED,
      timeline: [
        {
          title: 'Request Created',
          timestamp: '2026-08-26 15:00',
          description: 'Ramesh Hospitals requested 3 units of B+ blood.',
          type: 'creation',
        },
        {
          title: 'Donor Sahith Ram Donated 1 Unit',
          timestamp: '2026-08-26 16:45',
          description: 'Hospital verified and confirmed 1 unit from donor Sahith Ram.',
          type: 'fulfilment',
        },
      ],
      donorContributions: {
        create: {
          donorProfile: {
            connect: { userId: 'LD-DON-1047' },
          },
          status: DonorResponseStatus.COMPLETED,
          units: 1,
          acceptedAt: new Date('2026-08-26T15:20:00Z'),
          confirmedAt: new Date('2026-08-26T16:45:00Z'),
        },
      },
      bloodBankContributions: {
        create: {
          bloodBankId: 'LD-BB-01',
          bloodGroup: BloodGroup.B_POS,
          offeredUnits: 1,
          allocatedUnits: 1,
          status: BloodBankResponseStatus.RESERVED,
        },
      },
    },
  });

  // 6. Seed Campaigns
  console.log('Creating Campaigns...');
  await prisma.campaign.upsert({
    where: { id: 'CAMP-01' },
    update: {},
    create: {
      id: 'CAMP-01',
      name: 'Guntur Mega Blood Donation Drive 2026',
      bloodBankId: 'LD-BB-01',
      image: 'https://images.unsplash.com/photo-1536856136534-bb679c52a9aa?w=600&auto=format&fit=crop&q=80',
      date: new Date('2026-09-05'),
      timeSlot: '09:00 AM - 05:00 PM',
      location: 'Guntur Municipal Corporation Hall, Brodipet',
      city: 'Guntur',
      latitude: 16.305,
      longitude: 80.437,
      description: 'Join hundreds of donors for our Guntur community life-saving camp. Free health check-up, donor kit, and refreshments provided.',
      googleFormUrl: 'https://forms.google.com/example-lifedrop-camp-01',
      targetUnits: 100,
    },
  });

  await prisma.campaign.upsert({
    where: { id: 'CAMP-02' },
    update: {},
    create: {
      id: 'CAMP-02',
      name: 'Rotary Youth Blood Donation Camp',
      bloodBankId: 'LD-BB-02',
      image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600&auto=format&fit=crop&q=80',
      date: new Date('2026-09-12'),
      timeSlot: '10:00 AM - 04:00 PM',
      location: 'Rotary Community Center, Arundelpet, Guntur',
      city: 'Guntur',
      latitude: 16.302,
      longitude: 80.441,
      description: 'Special youth-led donor awareness drive in partnership with local collegiate volunteers.',
      googleFormUrl: 'https://forms.google.com/example-lifedrop-camp-02',
      targetUnits: 80,
    },
  });

  // 7. Seed Feedback & Testimonials
  console.log('Creating Feedback Submissions...');
  await prisma.feedbackSubmission.create({
    data: {
      userId: 'LD-DON-1045',
      rating: 5,
      comments: 'The radar emergency alert notified me within seconds. Hospital staff verified my donor badge promptly and the whole donation was smooth and painless.',
      status: 'RESOLVED',
      adminReplyMessage: 'We have solved the issue: Priority donor reception protocols were verified at GGH, and your next-eligibility certificate has been synchronized with your profile.',
      adminReplyStatus: 'RESOLVED',
      adminRepliedAt: new Date(),
      adminRepliedBy: 'Dr. Rajesh Varma',
    },
  });

  // 8. Seed Audit Logs
  console.log('Creating Audit Logs...');
  await prisma.auditLog.createMany({
    data: [
      {
        eventType: 'HOSPITAL_VERIFY',
        description: 'Government General Hospital (GGH), Guntur license compliance verified by State Administrator.',
        actorId: 'LD-ADM-001',
        actorRole: 'ADMIN',
        targetId: 'LD-HOSP-01',
        targetType: 'HOSPITAL',
        details: { note: 'License compliance verified by State Administrator.' },
      },
      {
        eventType: 'REQUEST_CREATE',
        description: 'Emergency blood request #LD1025 created for patient Ravi Teja by GGH Guntur.',
        actorId: 'USER-HOSP-01',
        actorRole: 'HOSPITAL',
        targetId: 'LD1025',
        targetType: 'BLOOD_REQUEST',
        details: { patient: 'Ravi Teja' },
      },
    ],
  });

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
