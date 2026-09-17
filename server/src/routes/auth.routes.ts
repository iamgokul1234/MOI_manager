import { Router } from 'express';
import { register, login, logout, getMe } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.post('/register', authRateLimiter, asyncHandler(register));
router.post('/login', authRateLimiter, asyncHandler(login));
router.post('/logout', logout);
router.get('/me', authenticate, asyncHandler(getMe));

export default router;
