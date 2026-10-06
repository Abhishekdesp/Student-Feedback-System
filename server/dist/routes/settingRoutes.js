import { Router } from 'express';
import { getAiSetting, updateAiSetting } from '../controllers/settingController.js';
import { requireAuth, authorizeRoles } from '../middleware/auth.js';
const router = Router();
router.use(requireAuth);
router.use(authorizeRoles('admin'));
router.get('/ai', getAiSetting);
router.post('/ai', updateAiSetting);
export default router;
