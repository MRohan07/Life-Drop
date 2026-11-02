import { PrismaClient } from '@prisma/client';
import { seedDemoAccountsIfMissing } from '../src/modules/seed/seed-demo-accounts.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting LifeDrop database seeding and demo accounts verification...');
  const result = await seedDemoAccountsIfMissing(prisma);
  console.log(`✅ ${result.message}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
