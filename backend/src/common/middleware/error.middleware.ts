import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { logger } from '../logging/logger.js';
import { Prisma } from '@prisma/client';
import { ENV } from '../../config/env.js';

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Operational AppError
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, path: req.path }, err.message);
    }
    return res.status(err.statusCode).json({
      status: 'error',
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors,
    });
  }

  // Prisma Known Request Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[]) || [];
      return res.status(409).json({
        status: 'error',
        statusCode: 409,
        message: `Unique constraint conflict on field(s): ${target.join(', ')}`,
      });
    }

    if (err.code === 'P2025') {
      return res.status(404).json({
        status: 'error',
        statusCode: 404,
        message: 'The requested record could not be found',
      });
    }
  }

  // Unhandled / Internal Server Error
  logger.error({ err, path: req.path, method: req.method }, 'Unhandled Exception');

  return res.status(500).json({
    status: 'error',
    statusCode: 500,
    message: ENV.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
  });
}
