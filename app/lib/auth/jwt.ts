import jwt from 'jsonwebtoken';
import { IUser } from '@/app/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';

export interface JWTPayload {
  id: string;
  email: string;
  role: string;
}

export const generateTokens = (user: IUser) => {
  const payload: JWTPayload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: '15m',
  });

  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });

  return {
    accessToken,
    refreshToken,
  };
};

export const verifyAccessToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
};