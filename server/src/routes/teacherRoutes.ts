import { Router } from 'express';
import {
  getDashboard,
  getSubjects,
  getSubjectAnalytics,
  getSubjectComments,
  getSubjectTrends,
  exportSubjectReport,
  getAllFaculty,
  createFaculty,
  deleteFaculty,
} from '../controllers/teacherController.js';
import { requireAuth, authorizeRoles } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

// Admin-only Faculty Management Endpoints
router.get('/faculty', authorizeRoles('admin'), getAllFaculty);
router.post('/faculty', authorizeRoles('admin'), createFaculty);
router.delete('/faculty/:id', authorizeRoles('admin'), deleteFaculty);

// Teacher & Admin Portal Endpoints
router.use(authorizeRoles('teacher', 'admin'));
router.get('/dashboard', getDashboard);
router.get('/subjects', getSubjects);
router.get('/subjects/:subjectId/analytics', getSubjectAnalytics);
router.get('/subjects/:subjectId/comments', getSubjectComments);
router.get('/subjects/:subjectId/trends', getSubjectTrends);
router.get('/subjects/:subjectId/report', exportSubjectReport);

export default router;

