import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export class JWTService {
  private accessSecret: string;
  private refreshSecret: string;
  private accessExpiry: string;
  private refreshExpiry: string;

  constructor() {
    this.accessSecret = process.env.JWT_ACCESS_SECRET || 'access-secret';
    this.refreshSecret = process.env.JWT_REFRESH_SECRET || 'refresh-secret';
    this.accessExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
    this.refreshExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
  }

  generateAccessToken(user: IUser): string {
    const payload: JWTPayload = {
      userId: (user._id as any).toString(),
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, this.accessSecret, {
      expiresIn: this.accessExpiry,
      issuer: 'ApniDukaan'
    } as jwt.SignOptions);
  }

  generateRefreshToken(user: IUser): string {
    const payload = {
      userId: (user._id as any).toString()
    };

    return jwt.sign(payload, this.refreshSecret, {
      expiresIn: this.refreshExpiry,
      issuer: 'ApniDukaan'
    } as jwt.SignOptions);
  }

  verifyAccessToken(token: string): JWTPayload {
    return jwt.verify(token, this.accessSecret, {
      issuer: 'ApniDukaan'
    }) as JWTPayload;
  }

  verifyRefreshToken(token: string): any {
    return jwt.verify(token, this.refreshSecret, {
      issuer: 'ApniDukaan'
    });
  }
}

export const jwtService = new JWTService();
