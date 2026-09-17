import { Router } from 'express';
import {
  getFunctions,
  getFunctionById,
  createFunction,
  updateFunction,
  deleteFunction,
} from '../controllers/functionsController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(getFunctions));
router.get('/:id', asyncHandler(getFunctionById));
router.post('/', asyncHandler(createFunction));
router.patch('/:id', asyncHandler(updateFunction));
router.delete('/:id', asyncHandler(deleteFunction));

export default router;
