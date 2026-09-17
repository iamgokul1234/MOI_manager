import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthPayload } from '../types';

export const signToken = (payload: AuthPayload): string => {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);
};

export const getPaginationParams = (
  page?: string,
  limit?: string
): { skip: number; limit: number; page: number } => {
  const parsedPage = Math.max(1, parseInt(page || '1', 10));
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit || '20', 10)));
  return { skip: (parsedPage - 1) * parsedLimit, limit: parsedLimit, page: parsedPage };
};

export const buildPaginationMeta = (total: number, page: number, limit: number) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});
