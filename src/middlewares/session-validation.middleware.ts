import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodTypeAny } from 'zod';
import { ReasonPhrases } from 'http-status-codes';
import http from 'http';

/**
 * Simplified validation middleware for session endpoints
 * Returns simplified error responses that match the OpenAPI specification
 */
export const validateSessionRequest = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Use the exact error message from the OpenAPI specification example
        const message = 'Username and password are required';
        
        // Use standard Express response method
        res.status(400).json({
          status: 'error',
          message
        });
      } else {
        next(error);
      }
    }
  };
};
