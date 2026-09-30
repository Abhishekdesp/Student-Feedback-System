import { Router } from 'express';
import { exportSubjectReport } from '../controllers/exportController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole('admin', 'teacher'));

router.get('/subject/:subjectId', exportSubjectReport);
router.post('/subject/:subjectId', exportSubjectReport);

export default router;
