import { Router } from 'express';
import { getDashboard } from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

const router = Router();
router.use(authenticate);
router.get('/', asyncHandler<AuthRequest>(getDashboard));

export default router;
