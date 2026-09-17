import { Router } from 'express';
import {
  getPeople,
  getPersonById,
  createPerson,
  updatePerson,
  deletePerson,
  checkDuplicate,
  getAreas,
} from '../controllers/peopleController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

const router = Router();

router.use(authenticate);

router.get('/areas', asyncHandler<AuthRequest>(getAreas));
router.get('/check-duplicate', asyncHandler<AuthRequest>(checkDuplicate));
router.get('/', asyncHandler<AuthRequest>(getPeople));
router.get('/:id', asyncHandler<AuthRequest>(getPersonById));
router.post('/', asyncHandler<AuthRequest>(createPerson));
router.patch('/:id', asyncHandler<AuthRequest>(updatePerson));
router.delete('/:id', asyncHandler<AuthRequest>(deletePerson));

export default router;
