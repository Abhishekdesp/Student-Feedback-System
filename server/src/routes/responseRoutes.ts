import { Router } from 'express';
import {
  submitResponse,
  checkSubmissionStatus,
  clearSubjectData,
  submitResponseSchema,
} from '../controllers/responseController.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.post('/submit', requireRole('student'), validate(submitResponseSchema), submitResponse);
router.get('/status/:subjectId', requireRole('student', 'admin', 'teacher'), checkSubmissionStatus);
router.delete('/clear/:subjectId', requireRole('admin', 'teacher'), clearSubjectData);

export default router;
