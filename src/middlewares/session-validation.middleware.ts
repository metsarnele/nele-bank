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
        
        // Use a direct approach to set the status without the 'Error:' prefix
        // This bypasses Express's default behavior of adding 'Error:' to status messages
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        // Use the raw http.ServerResponse.writeHead method to set the status message directly
        (res as any).writeHead(400, 'Bad Request');
        res.write(JSON.stringify({
          status: 'error',
          message
        }));
        res.end();
      } else {
        next(error);
      }
    }
  };
};
