import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

interface ErrorResponse {
  status: string;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

const isProduction = process.env.NODE_ENV === 'production';

const logError = (err: Error, req: Request): void => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip;
  const userAgent = req.get('user-agent');

  console.error(JSON.stringify({
    timestamp,
    type: 'error',
    method,
    url,
    ip,
    userAgent,
    error: {
      name: err.name,
      message: err.message,
      stack: isProduction ? undefined : err.stack,
      ...(err instanceof AppError && {
        code: err.code,
        details: err.details
      })
    }
  }));
};

const formatError = (err: Error | AppError): ErrorResponse => {
  if (err instanceof AppError) {
    return {
      status: 'error',
      error: {
        code: err.code || 'UNKNOWN_ERROR',
        message: err.message,
        ...(err.details && { details: err.details })
      }
    };
  }

  // Handle unexpected errors
  const status = 'error';
  const code = 'INTERNAL_SERVER_ERROR';
  const message = isProduction
    ? 'An unexpected error occurred'
    : err.message || 'Internal Server Error';

  return {
    status,
    error: {
      code,
      message
    }
  };
};

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the error
  logError(err, req);

  // Determine HTTP status code
  const statusCode = err instanceof AppError ? err.status : 500;

  // Format the error response
  const errorResponse = formatError(err);

  // Send response
  res.status(statusCode).json(errorResponse);
};
