import app from './app.js';
import { ENV } from './config/env.js';
import { logger } from './common/logging/logger.js';
import { prisma } from './config/database.js';

const PORT = Number(process.env.PORT) || ENV.PORT || 5001;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, async () => {
  try {
    await prisma.$connect();
    logger.info(`🩸 LifeDrop API Server listening on ${HOST}:${PORT} [${ENV.NODE_ENV}]`);
    logger.info(`📘 Swagger OpenAPI documentation available at /docs`);
    logger.info(`🩺 Health check ready at /health and /health/ready`);
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

