import { Router } from 'express';
import {
  getDashboard,
  getSubjects,
  getSubjectAnalytics,
  getSubjectComments,
  getSubjectTrends,
  exportSubjectReport,
} from '../controllers/teacherController.js';
import { requireAuth, authorizeRoles } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.use(authorizeRoles('teacher', 'admin'));

router.get('/dashboard', getDashboard);
router.get('/subjects', getSubjects);
router.get('/subjects/:subjectId/analytics', getSubjectAnalytics);
router.get('/subjects/:subjectId/comments', getSubjectComments);
router.get('/subjects/:subjectId/trends', getSubjectTrends);
router.get('/subjects/:subjectId/report', exportSubjectReport);

export default router;
