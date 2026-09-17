import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { env } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: number | string;
  type?: string;
}

export const createError = (message: string, statusCode: number): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

/** Map well-known library errors to friendly HTTP responses. */
const normalise = (err: AppError): { statusCode: number; message: string } => {
  if (err instanceof mongoose.Error.CastError) {
    return { statusCode: 400, message: `Invalid value for ${err.path}` };
  }
  if (err instanceof mongoose.Error.ValidationError) {
    const first = Object.values(err.errors)[0];
    return { statusCode: 400, message: first?.message || 'Validation failed' };
  }
  if (err.code === 11000) {
    return { statusCode: 409, message: 'A record with the same value already exists' };
  }
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return { statusCode: 401, message: 'Invalid or expired session' };
  }
  if (err.type === 'entity.parse.failed') {
    return { statusCode: 400, message: 'Request body is not valid JSON' };
  }
  return { statusCode: err.statusCode || 500, message: err.message || 'Internal Server Error' };
};

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const { statusCode, message } = normalise(err);

  if (statusCode >= 500) {
    console.error('[error]', err);
  }

  const response: Record<string, unknown> = {
    success: false,
    // Never leak internal error details in production.
    message: env.isProduction && statusCode >= 500 ? 'Internal Server Error' : message,
  };

  if (!env.isProduction && statusCode >= 500) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export const asyncHandler =
  <R extends Request = Request>(fn: (req: R, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req as R, res, next)).catch(next);
  };
