import { Router } from 'express';
import { getAllStudents, importStudentsCSV } from '../controllers/studentController.js';
import { requireAuth, authorizeRoles } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.use(authorizeRoles('admin'));

router.get('/', getAllStudents);
router.post('/import', importStudentsCSV);

export default router;
