import { Router } from 'express';
import { login, logout, getMe, loginSchema } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);
export default router;
