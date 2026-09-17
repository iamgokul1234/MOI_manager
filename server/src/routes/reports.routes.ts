import { Router } from 'express';
import { getSummary, getFunctionReport, getAreaReport, getYearlyReport } from '../controllers/reportsController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.use(authenticate);

router.get('/summary', asyncHandler(getSummary));
router.get('/functions', asyncHandler(getFunctionReport));
router.get('/areas', asyncHandler(getAreaReport));
router.get('/yearly', asyncHandler(getYearlyReport));

export default router;
