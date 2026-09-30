import { Router } from 'express';
import { getAllQuestions, createQuestion, deleteQuestion, createQuestionSchema, } from '../controllers/questionController.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
const router = Router();
router.use(requireAuth);
router.get('/', getAllQuestions); // Accessible by student (during survey) and admin
router.post('/', requireRole('admin', 'teacher'), validate(createQuestionSchema), createQuestion);
router.delete('/:id', requireRole('admin', 'teacher'), deleteQuestion);
export default router;
