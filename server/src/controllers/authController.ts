import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { signToken } from '../utils';
import { AuthRequest } from '../types';
import { env } from '../config/env';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const register = async (req: Request, res: Response): Promise<void> => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, message: result.error.errors[0].message });
    return;
  }

  const { name, email, password } = result.data;

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(409).json({ success: false, message: 'An account with this email already exists' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash });

  const token = signToken({ userId: user._id.toString(), email: user.email });
  res.cookie('token', token, COOKIE_OPTIONS);

  res.status(201).json({
    success: true,
    data: { id: user._id, name: user.name, email: user.email },
    message: 'Account created successfully',
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, message: result.error.errors[0].message });
    return;
  }

  const { email, password } = result.data;

  const user = await User.findOne({ email });
  if (!user) {
    res.status(401).json({ success: false, message: 'Invalid email or password' });
    return;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    res.status(401).json({ success: false, message: 'Invalid email or password' });
    return;
  }

  const token = signToken({ userId: user._id.toString(), email: user.email });
  res.cookie('token', token, COOKIE_OPTIONS);

  res.json({
    success: true,
    data: { id: user._id, name: user.name, email: user.email },
    message: 'Logged in successfully',
  });
};

export const logout = (_req: Request, res: Response): void => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.user!.userId).select('-passwordHash');
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }
  res.json({ success: true, data: user });
};
