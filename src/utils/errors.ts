export class AppError extends Error {
  constructor(
    public message: string,
    public status: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND_ERROR');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, details?: any) {
    super(
      `Error communicating with ${service}`,
      503,
      'EXTERNAL_SERVICE_ERROR',
      details
    );
  }
}

export class InsufficientFundsError extends AppError {
  constructor(message: string = 'Insufficient funds for this transaction') {
    super(message, 400, 'INSUFFICIENT_FUNDS_ERROR');
  }
}

export class InvalidSignatureError extends AppError {
  constructor(message: string = 'Invalid transaction signature') {
    super(message, 401, 'INVALID_SIGNATURE_ERROR');
  }
}

export class TransactionError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'TRANSACTION_ERROR', details);
  }
}
