import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { User } from '../models/user.model';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication token is missing'
      });
    }

    const token = authHeader.split(' ')[1];
    const authService = AuthService.getInstance();
    const decoded = await authService.verifyToken(token) as jwt.JwtPayload;

    if (!decoded.sub || typeof decoded.sub !== 'number') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token'
      });
    }

    const user = await User.findByPk(decoded.sub);
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not found'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid authentication token'
    });
  }
}

export function authorizeUser(userId: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user && req.user.id === userId) {
      next();
    } else {
      res.status(403).json({
        status: 'error',
        message: 'You are not authorized to access this resource'
      });
    }
  };
}
