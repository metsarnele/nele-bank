import { Request, Response, NextFunction } from 'express';

/**
 * Simple middleware that doesn't modify Express's default behavior
 * This allows the default error names to be shown (e.g., "Error: Bad Request")
 */
export const customResponseMiddleware = (_req: Request, _res: Response, next: NextFunction) => {
  // Just pass through without modifying anything
  next();
};
