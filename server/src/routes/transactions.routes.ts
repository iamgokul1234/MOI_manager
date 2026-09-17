import { Router } from 'express';
import {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  updateAttendance,
  deleteTransaction,
} from '../controllers/transactionsController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler<AuthRequest>(getTransactions));
router.get('/:id', asyncHandler<AuthRequest>(getTransactionById));
router.post('/', asyncHandler<AuthRequest>(createTransaction));
router.patch('/:id/attendance', asyncHandler<AuthRequest>(updateAttendance));
router.patch('/:id', asyncHandler<AuthRequest>(updateTransaction));
router.delete('/:id', asyncHandler<AuthRequest>(deleteTransaction));

export default router;
