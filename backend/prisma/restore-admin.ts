import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import argon2 from 'argon2';

const TARGET_ADMIN = {
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
  latitude: 16.3067,
  longitude: 80.4365,
};

/**
 * Validate that the DATABASE_URL points strictly to a Render PostgreSQL production host.
 * Strictly rejects localhost, 127.0.0.1, internal test databases, and all non-Render hosts.
 */
function validateRenderDatabaseUrl(rawUrl: string): string {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch (err: any) {
    throw new Error(`Invalid DATABASE_URL format: ${err.message}`);
  }

  if (parsedUrl.protocol !== 'postgresql:' && parsedUrl.protocol !== 'postgres:') {
    throw new Error(
      `Invalid protocol '${parsedUrl.protocol}' in DATABASE_URL. Must be 'postgresql:' or 'postgres:'.`
    );
  }

  const hostname = parsedUrl.hostname.toLowerCase().trim();

  // Strictly reject localhost, loopback, and local/LAN addresses
  if (
    !hostname ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '0.0.0.0' ||
    hostname.startsWith('127.') ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    throw new Error(
      `Restoration rejected: DATABASE_URL host '${hostname}' is a local or loopback address. Localhost, 127.0.0.1, and local networks are strictly prohibited.`
    );
  }

  // Validate Render PostgreSQL production host patterns:
  // 1. External / Full DNS: dpg-<id>-a.<region>-postgres.render.com or dpg-<id>.oregon-postgres.render.com
  // 2. Render Internal Private Network DNS: dpg-<id> or dpg-<id>-a
  const isRenderExternal =
    hostname.endsWith('.render.com') &&
    (hostname.startsWith('dpg-') || hostname.includes('postgres'));

  const isRenderInternal = /^dpg-[a-z0-9]+(-a)?$/i.test(hostname);

  if (!isRenderExternal && !isRenderInternal) {
    throw new Error(
      `Restoration rejected: DATABASE_URL host '${hostname}' is not a valid Render PostgreSQL production host. Only authentic Render PostgreSQL production hosts (e.g. dpg-*.oregon-postgres.render.com or internal dpg-*) are allowed.`
    );
  }

  return hostname;
}

async function main() {
  console.log('🛡️ Starting LifeDrop Production Admin Restoration...');

  // 1. Enforce production environment and explicit confirmation before doing anything
  if (process.env.NODE_ENV !== 'production') {
    console.error(
      `❌ Restoration aborted: NODE_ENV must be set to 'production'. Current NODE_ENV: '${process.env.NODE_ENV || 'undefined'}'.`
    );
    process.exit(1);
  }

  if (process.env.CONFIRM_ADMIN_RESTORATION !== 'YES') {
    console.error(
      `❌ Restoration aborted: CONFIRM_ADMIN_RESTORATION must be explicitly set to 'YES' to confirm execution. Current value: '${process.env.CONFIRM_ADMIN_RESTORATION || 'undefined'}'.`
    );
    process.exit(1);
  }

  // 2. Read and validate required environment variables
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD?.trim();
  const adminPasskeyPin = process.env.ADMIN_PASSKEY_PIN?.trim();

  const missingEnvVars: string[] = [];
  if (!databaseUrl) missingEnvVars.push('DATABASE_URL');
  if (!adminPassword) missingEnvVars.push('SEED_ADMIN_PASSWORD');
  if (!adminPasskeyPin) missingEnvVars.push('ADMIN_PASSKEY_PIN');

  if (missingEnvVars.length > 0) {
    console.error(
      `❌ Restoration aborted: Missing required environment variable(s): ${missingEnvVars.join(', ')}.`
    );
    process.exit(1);
  }

  // 3. Validate DATABASE_URL: strictly allow only Render PostgreSQL production hostnames
  let verifiedHost: string;
  try {
    verifiedHost = validateRenderDatabaseUrl(databaseUrl);
  } catch (err: any) {
    console.error(`❌ Restoration aborted: ${err.message}`);
    process.exit(1);
  }

  console.log(`🔒 Target production database host verified: ${verifiedHost}`);

  // 4. Initialize Prisma Client ONLY after all pre-conditions and hostname validations succeed
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  try {
    // 5. Hash admin password and passkey using Argon2 (same implementation as seed)
    const passwordHash = await argon2.hash(adminPassword);
    const passkeyHash = await argon2.hash(adminPasskeyPin);

    // 6. Execute restoration inside a Prisma transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check for conflicting email, phone, or ID records
      const conflictingUser = await tx.user.findFirst({
        where: {
          OR: [
            { id: TARGET_ADMIN.id },
            { email: { equals: TARGET_ADMIN.email, mode: 'insensitive' } },
            { phone: TARGET_ADMIN.phone },
          ],
        },
      });

      if (conflictingUser) {
        const conflicts: string[] = [];
        if (conflictingUser.id === TARGET_ADMIN.id) {
          conflicts.push(`ID '${TARGET_ADMIN.id}'`);
        }
        if (conflictingUser.email?.toLowerCase() === TARGET_ADMIN.email.toLowerCase()) {
          conflicts.push(`email '${TARGET_ADMIN.email}'`);
        }
        if (conflictingUser.phone === TARGET_ADMIN.phone) {
          conflicts.push(`phone '${TARGET_ADMIN.phone}'`);
        }

        throw new Error(
          `Conflict detected: A user account matching ${conflicts.join(
            ', '
          )} already exists (Existing User ID: ${conflictingUser.id}, Name: "${conflictingUser.name}", Role: ${conflictingUser.role}). Restoration stopped without modifying any existing accounts.`
        );
      }

      // Check for conflicting AdminProfile by employeeId
      const conflictingProfile = await tx.adminProfile.findFirst({
        where: { employeeId: TARGET_ADMIN.employeeId },
      });

      if (conflictingProfile) {
        throw new Error(
          `Conflict detected: An AdminProfile with Employee ID '${TARGET_ADMIN.employeeId}' already exists (Profile ID: ${conflictingProfile.id}, User ID: ${conflictingProfile.userId}). Restoration stopped without modifying any existing accounts.`
        );
      }

      // Create exactly one administrator with related AdminProfile and NotificationPreferences
      // Never update or delete existing records
      const createdAdmin = await tx.user.create({
        data: {
          id: TARGET_ADMIN.id,
          name: TARGET_ADMIN.name,
          email: TARGET_ADMIN.email,
          phone: TARGET_ADMIN.phone,
          passwordHash,
          role: TARGET_ADMIN.role,
          status: UserStatus.ACTIVE,
          city: TARGET_ADMIN.city,
          location: TARGET_ADMIN.location,
          latitude: TARGET_ADMIN.latitude,
          longitude: TARGET_ADMIN.longitude,
          adminProfile: {
            create: {
              designation: TARGET_ADMIN.designation,
              department: TARGET_ADMIN.department,
              employeeId: TARGET_ADMIN.employeeId,
              passkeyHash,
              twoFactorEnabled: true,
              lastLogin: null,
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
        include: {
          adminProfile: true,
          notificationPreferences: true,
        },
      });

      return createdAdmin;
    });

    // 7. Print success message ONLY after the transaction commits
    console.log('✅ Administrator account restored successfully:');
    console.log(`   ID:          ${result.id}`);
    console.log(`   Name:        ${result.name}`);
    console.log(`   Email:       ${result.email}`);
    console.log(`   Phone:       ${result.phone}`);
    console.log(`   Role:        ${result.role}`);
    console.log(`   Status:      ${result.status}`);
    console.log(`   City:        ${result.city}`);
    console.log(`   Location:    ${result.location}`);
    console.log(`   Designation: ${result.adminProfile?.designation}`);
    console.log(`   Department:  ${result.adminProfile?.department}`);
    console.log(`   Employee ID: ${result.adminProfile?.employeeId}`);
    console.log(`   Last Login:  ${result.adminProfile?.lastLogin}`);
    console.log(`   Passkey:     Configured via Argon2 hash`);
    console.log(`   Preferences: Notifications initialized`);
  } catch (error: any) {
    console.error(`❌ Restoration failed: ${error.message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
