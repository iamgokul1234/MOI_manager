import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthPayload, AuthRequest } from '../types';

/**
 * Reads the JWT from the HTTP-only cookie and attaches the payload to req.user.
 * Every protected route relies on req.user.userId to scope its queries.
 */
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
  const token = req.cookies?.token || bearerToken;

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as AuthPayload;
    if (!payload?.userId) throw new Error('Malformed token');
    req.user = { userId: payload.userId, email: payload.email };
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired session' });
  }
};
