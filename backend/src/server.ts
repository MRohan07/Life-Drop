import app from './app.js';
import { ENV } from './config/env.js';
import { logger } from './common/logging/logger.js';
import { prisma } from './config/database.js';
import { facilityApplicationsService } from './modules/facility-applications/facility-applications.service.js';
import { seedDemoAccountsIfMissing } from './modules/seed/seed-demo-accounts.js';

const PORT = Number(process.env.PORT) || ENV.PORT || 5001;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, async () => {
  try {
    await prisma.$connect();
    logger.info(`🩸 LifeDrop API Server listening on ${HOST}:${PORT} [${ENV.NODE_ENV}]`);
    logger.info(`📘 Swagger OpenAPI documentation available at /docs`);
    logger.info(`🩺 Health check ready at /health and /health/ready`);

    try {
      const reconcileResult = await facilityApplicationsService.reconcileApprovedFacilityApplications();
      if (reconcileResult.reconciledCount > 0) {
        logger.info(`Automated startup reconciliation: activated ${reconcileResult.reconciledCount} approved facility account(s).`);
      }
    } catch (reconcileErr) {
      logger.warn({ err: reconcileErr }, 'Startup reconciliation of approved facilities completed with warnings.');
    }

    try {
      await seedDemoAccountsIfMissing(prisma);
      logger.info('Demo accounts and approved facilities verified.');
    } catch (seedErr) {
      logger.warn({ err: seedErr }, 'Demo accounts verification completed with warnings.');
    }
  } catch (err) {
    logger.error({ err }, 'Failed to connect to PostgreSQL database on startup');
    process.exit(1);
  }
});

const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Gracefully shutting down LifeDrop API...`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
      logger.info('Database disconnected and server closed successfully.');
    } catch (err) {
      logger.error({ err }, 'Error disconnecting database during shutdown');
    }
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

