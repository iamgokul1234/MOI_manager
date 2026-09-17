import { Router } from 'express';
import {
  getSummary,
  getFunctionReport,
  getAreaReport,
  getYearlyReport,
  getReportYears,
} from '../controllers/reportsController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

const router = Router();

router.use(authenticate);

router.get('/summary', asyncHandler<AuthRequest>(getSummary));
router.get('/functions', asyncHandler<AuthRequest>(getFunctionReport));
router.get('/areas', asyncHandler<AuthRequest>(getAreaReport));
router.get('/yearly', asyncHandler<AuthRequest>(getYearlyReport));
router.get('/years', asyncHandler<AuthRequest>(getReportYears));

export default router;
