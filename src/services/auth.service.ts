import jwt from 'jsonwebtoken';
import { config } from '../config';
import { IUser } from '../interfaces/user.interface';

export class AuthService {
  private static instance: AuthService;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public generateAccessToken(user: IUser): string {
    const payload = {
      sub: user.id,
      username: user.username,
      type: 'access'
    };

    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: '1h'
    });
  }

  public generateRefreshToken(user: IUser): string {
    const payload = {
      sub: user.id,
      type: 'refresh'
    };

    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: '7d'
    });
  }

  public verifyToken(token: string): jwt.JwtPayload | string {
    try {
      return jwt.verify(token, config.jwtSecret) as jwt.JwtPayload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}
