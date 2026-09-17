import { Router } from 'express';
import { exportPeople, exportTransactions, exportFunctions } from '../controllers/exportController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.use(authenticate);

router.get('/people.csv', asyncHandler(exportPeople));
router.get('/transactions.csv', asyncHandler(exportTransactions));
router.get('/functions.csv', asyncHandler(exportFunctions));

export default router;
