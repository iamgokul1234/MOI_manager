import { Router } from 'express';
import {
  getFunctions,
  getFunctionById,
  getFunctionPeople,
  createFunction,
  updateFunction,
  deleteFunction,
} from '../controllers/functionsController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler<AuthRequest>(getFunctions));
router.get('/:id', asyncHandler<AuthRequest>(getFunctionById));
router.get('/:id/people', asyncHandler<AuthRequest>(getFunctionPeople));
router.post('/', asyncHandler<AuthRequest>(createFunction));
router.patch('/:id', asyncHandler<AuthRequest>(updateFunction));
router.delete('/:id', asyncHandler<AuthRequest>(deleteFunction));

export default router;
