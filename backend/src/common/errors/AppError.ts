export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: any;
  public readonly code?: string;

  constructor(message: string, statusCode = 500, errors?: any, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, errors?: any, code?: string) {
    return new AppError(message, 400, errors, code);
  }

  static unauthorized(message = 'Authentication required', code?: string) {
    return new AppError(message, 401, undefined, code);
  }

  static forbidden(message = 'Access forbidden: Insufficient permissions', code?: string) {
    return new AppError(message, 403, undefined, code);
  }

  static notFound(message = 'Resource not found', code?: string) {
    return new AppError(message, 404, undefined, code);
  }

  static conflict(message: string, code?: string) {
    return new AppError(message, 409, undefined, code);
  }

  static tooManyRequests(message = 'Rate limit exceeded. Please try again later.', code?: string) {
    return new AppError(message, 429, undefined, code);
  }

  static internal(message = 'Internal server error', code?: string) {
    return new AppError(message, 500, undefined, code);
  }
}
