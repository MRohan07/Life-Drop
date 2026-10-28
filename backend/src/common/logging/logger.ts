import pino from 'pino';
import { ENV } from '../../config/env.js';

export const logger = pino({
  level: ENV.LOG_LEVEL,
  transport:
    ENV.NODE_ENV === 'development'
      ? {
          target: 'pino/file',
          options: { destination: 1 }, // stdout
        }
      : undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
});

export default logger;
