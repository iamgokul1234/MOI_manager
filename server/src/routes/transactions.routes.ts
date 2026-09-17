import { Router } from 'express';
import {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../controllers/transactionsController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(getTransactions));
router.get('/:id', asyncHandler(getTransactionById));
router.post('/', asyncHandler(createTransaction));
router.patch('/:id', asyncHandler(updateTransaction));
router.delete('/:id', asyncHandler(deleteTransaction));

export default router;
