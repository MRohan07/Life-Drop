export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: any;

  constructor(message: string, statusCode = 500, errors?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, errors?: any) {
    return new AppError(message, 400, errors);
  }

  static unauthorized(message = 'Authentication required') {
    return new AppError(message, 401);
  }

  static forbidden(message = 'Access forbidden: Insufficient permissions') {
    return new AppError(message, 403);
  }

  static notFound(message = 'Resource not found') {
    return new AppError(message, 404);
  }

  static conflict(message: string) {
    return new AppError(message, 409);
  }

  static tooManyRequests(message = 'Rate limit exceeded. Please try again later.') {
    return new AppError(message, 429);
  }

  static internal(message = 'Internal server error') {
    return new AppError(message, 500);
  }
}
