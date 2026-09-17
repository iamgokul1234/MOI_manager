import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Response } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { AuthPayload } from '../types';

export const signToken = (payload: AuthPayload): string => {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);
};

export const getPaginationParams = (
  page?: string,
  limit?: string
): { skip: number; limit: number; page: number } => {
  const parsedPage = Math.max(1, parseInt(page || '1', 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));
  return { skip: (parsedPage - 1) * parsedLimit, limit: parsedLimit, page: parsedPage };
};

export const buildPaginationMeta = (total: number, page: number, limit: number) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

/** Escape user input before embedding it into a $regex. */
export const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const isObjectId = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-fA-F0-9]{24}$/.test(value);

export const toObjectId = (value: string): mongoose.Types.ObjectId =>
  new mongoose.Types.ObjectId(value);

export const sendValidationError = (res: Response, error: ZodError): void => {
  const first = error.errors[0];
  res.status(400).json({ success: false, message: first?.message || 'Invalid request' });
};

export const parseNumber = (value: unknown): number | undefined => {
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

export const parseDate = (value: unknown, endOfDay = false): Date | undefined => {
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const d = new Date(value);
  if (isNaN(d.getTime())) return undefined;
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    d.setUTCHours(23, 59, 59, 999);
  }
  return d;
};
