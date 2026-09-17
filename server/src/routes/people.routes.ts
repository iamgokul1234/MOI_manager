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

const router = Router();

router.use(authenticate);

router.get('/areas', asyncHandler(getAreas));
router.get('/check-duplicate', asyncHandler(checkDuplicate));
router.get('/', asyncHandler(getPeople));
router.get('/:id', asyncHandler(getPersonById));
router.post('/', asyncHandler(createPerson));
router.patch('/:id', asyncHandler(updatePerson));
router.delete('/:id', asyncHandler(deletePerson));

export default router;
