import { Request, Response, CookieOptions } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { sendValidationError, signToken } from '../utils';
import { AuthRequest } from '../types';
import { env } from '../config/env';

const COOKIE_NAME = 'token';

const cookieOptions = (): CookieOptions => ({
  httpOnly: true,
  // SameSite=None requires Secure; otherwise only send Secure in production.
  secure: env.cookieSameSite === 'none' ? true : env.isProduction,
  sameSite: env.cookieSameSite,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
});

const publicUser = (user: { _id: unknown; name: string; email: string; createdAt?: Date }) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
});

export const register = async (req: Request, res: Response): Promise<void> => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) return sendValidationError(res, result.error);

  const { name, email, password } = result.data;
  const normalisedEmail = email.toLowerCase().trim();

  const existing = await User.findOne({ email: normalisedEmail });
  if (existing) {
    res.status(409).json({ success: false, message: 'An account with this email already exists' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name: name.trim(), email: normalisedEmail, passwordHash });

  const token = signToken({ userId: user._id.toString(), email: user.email });
  res.cookie(COOKIE_NAME, token, cookieOptions());

  res.status(201).json({
    success: true,
    data: { ...publicUser(user), token },
    message: 'Account created successfully',
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) return sendValidationError(res, result.error);

  const { email, password } = result.data;

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  const isValid = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !isValid) {
    res.status(401).json({ success: false, message: 'Invalid email or password' });
    return;
  }

  const token = signToken({ userId: user._id.toString(), email: user.email });
  res.cookie(COOKIE_NAME, token, cookieOptions());

  res.json({
    success: true,
    data: { ...publicUser(user), token },
    message: 'Logged in successfully',
  });
};

export const logout = (_req: Request, res: Response): void => {
  const { maxAge: _maxAge, ...opts } = cookieOptions();
  res.clearCookie(COOKIE_NAME, opts);
  res.json({ success: true, message: 'Logged out successfully' });
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.user!.userId).select('-passwordHash');
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }
  res.json({ success: true, data: publicUser(user) });
};
