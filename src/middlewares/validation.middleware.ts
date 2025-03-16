import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, ZodTypeAny, z } from 'zod';
import { ValidationError } from '../utils/errors';

type ValidateSchema = {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
};

export function validateSchema<T>(schema: ZodTypeAny, data: unknown): T {
  try {
    return schema.parse(data) as T;
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError('Invalid data', error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      })));
    }
    throw error;
  }
}

export const validateRequest = (schema: ValidateSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query);
      }
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Transform Zod validation errors into our custom format
        const details = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        next(new ValidationError('Invalid request data', details));
      } else {
        next(error);
      }
    }
  };
};
