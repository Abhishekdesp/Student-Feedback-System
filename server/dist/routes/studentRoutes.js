import { Router } from 'express';
import { getAllStudents, importStudentsCSV } from '../controllers/studentController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
const router = Router();
router.use(requireAuth);
router.use(requireRole('admin', 'teacher'));
router.get('/', getAllStudents);
router.post('/import', importStudentsCSV);
export default router;
