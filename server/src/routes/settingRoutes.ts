import { Router } from 'express';
import { getAiSetting, updateAiSetting } from '../controllers/settingController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole('admin', 'teacher'));

router.get('/ai', getAiSetting);
router.post('/ai', updateAiSetting);

export default router;
