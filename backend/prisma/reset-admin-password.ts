import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import argon2 from 'argon2';

const TARGET_ADMIN = {
  id: 'LD-ADM-ROHAN',
  email: 'adminrohan@gmail.com',
};

/**
 * Hash password using the exact Argon2id configuration used by LifeDrop authentication
 * (matches src/common/utils/security.ts: argon2id, 64 MB memory cost, time cost 3, parallelism 1)
 */
async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3,
    parallelism: 1,
  });
}

async function main() {
  console.log('🔒 Starting LifeDrop Production Admin Password Reset...');

  // 1. Enforce production environment guard and explicit confirmation
  if (process.env.NODE_ENV !== 'production') {
    console.error(
      `❌ Password reset aborted: NODE_ENV must be set to 'production'. Current NODE_ENV: '${process.env.NODE_ENV || 'undefined'}'.`
    );
    process.exit(1);
  }

  if (process.env.CONFIRM_ADMIN_PASSWORD_RESET !== 'YES') {
    console.error(
      `❌ Password reset aborted: CONFIRM_ADMIN_PASSWORD_RESET must be explicitly set to 'YES' to confirm execution. Current value: '${process.env.CONFIRM_ADMIN_PASSWORD_RESET || 'undefined'}'.`
    );
    process.exit(1);
  }

  // 2. Read and validate required environment variables
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error('❌ Password reset aborted: Missing required environment variable: DATABASE_URL.');
    process.exit(1);
  }

  const newPassword = process.env.ADMIN_RESET_PASSWORD?.trim();
  if (!newPassword) {
    console.error(
      '❌ Password reset aborted: Missing required environment variable: ADMIN_RESET_PASSWORD.'
    );
    process.exit(1);
  }

  if (newPassword.length < 8) {
    console.error(
      '❌ Password reset aborted: ADMIN_RESET_PASSWORD must be at least 8 characters long.'
    );
    process.exit(1);
  }

  // Validate DATABASE_URL format
  try {
    const parsed = new URL(databaseUrl);
    if (parsed.protocol !== 'postgresql:' && parsed.protocol !== 'postgres:') {
      throw new Error(`Invalid protocol '${parsed.protocol}'. Must be postgresql: or postgres:`);
    }
  } catch (err: any) {
    console.error(`❌ Password reset aborted: Invalid DATABASE_URL: ${err.message}`);
    process.exit(1);
  }

  // 3. Initialize Prisma Client
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  try {
    // 4. Hash the new password using the exact Argon2id configuration (never logged or printed)
    const newPasswordHash = await hashPassword(newPassword);

    // 5. Execute password reset inside a Prisma transaction
    const result = await prisma.$transaction(async (tx) => {
      // Verify account exists
      const user = await tx.user.findUnique({
        where: { id: TARGET_ADMIN.id },
      });

      if (!user) {
        throw new Error(
          `Target administrator account with ID '${TARGET_ADMIN.id}' does not exist.`
        );
      }

      // Verify email matches
      if (user.email?.toLowerCase() !== TARGET_ADMIN.email.toLowerCase()) {
        throw new Error(
          `Administrator email mismatch: Account with ID '${TARGET_ADMIN.id}' has email '${user.email}', expected '${TARGET_ADMIN.email}'.`
        );
      }

      // Verify ADMIN role
      if (user.role !== UserRole.ADMIN) {
        throw new Error(
          `Security violation: Target account '${TARGET_ADMIN.id}' has role '${user.role}', expected 'ADMIN'. Password reset aborted.`
        );
      }

      // Verify status is ACTIVE
      if (user.status !== UserStatus.ACTIVE) {
        throw new Error(
          `Account status mismatch: Target account '${TARGET_ADMIN.id}' has status '${user.status}', expected 'ACTIVE'. Password reset aborted.`
        );
      }

      // Update ONLY the password hash of the existing user with ID LD-ADM-ROHAN
      // Do not change user's role, status, email, phone, name, PIN, profiles, or any other records
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash: newPasswordHash,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          updatedAt: true,
        },
      });

      // Record audit log for security accountability
      await tx.auditLog.create({
        data: {
          eventType: 'ADMIN_PASSWORD_RESET',
          description: `Production administrator password reset executed for ${updatedUser.name} (${updatedUser.email}).`,
          actorId: updatedUser.id,
          actorRole: 'ADMIN',
          targetId: updatedUser.id,
          targetType: 'USER',
          details: {
            userId: updatedUser.id,
            email: updatedUser.email,
            resetTimestamp: new Date().toISOString(),
          },
        },
      });

      return updatedUser;
    });

    // 6. Print success message ONLY after transaction commits (never print password or hash)
    console.log('✅ Administrator password reset successfully:');
    console.log(`   User ID:    ${result.id}`);
    console.log(`   Name:       ${result.name}`);
    console.log(`   Email:      ${result.email}`);
    console.log(`   Role:       ${result.role}`);
    console.log(`   Status:     ${result.status}`);
    console.log(`   Updated At: ${result.updatedAt.toISOString()}`);
    console.log('   Security:   Argon2id password hash updated successfully.');
  } catch (error: any) {
    console.error(`❌ Password reset failed: ${error.message}`);
    process.exit(1);
  } finally {
    // 7. Safely disconnect Prisma Client
    await prisma.$disconnect();
  }
}

main();

