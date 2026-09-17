import { Router } from 'express';
import { exportPeople, exportTransactions, exportFunctions } from '../controllers/exportController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

const router = Router();

router.use(authenticate);

router.get('/people.csv', asyncHandler<AuthRequest>(exportPeople));
router.get('/transactions.csv', asyncHandler<AuthRequest>(exportTransactions));
router.get('/functions.csv', asyncHandler<AuthRequest>(exportFunctions));

export default router;
