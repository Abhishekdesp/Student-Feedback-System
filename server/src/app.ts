import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import responseRoutes from './routes/responseRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import exportRoutes from './routes/exportRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import { seedDemoData } from './seed/seedDemoData.js';
import { requireAuth, requireRole } from './middleware/auth.js';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize());

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Health Check Endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/teacher', teacherRoutes);

// Seed Endpoint (Admin only)
app.post('/api/seed', requireAuth, requireRole('admin', 'teacher'), async (_req, res, next) => {
  try {
    await seedDemoData();
    res.status(200).json({ success: true, message: 'Demo data successfully seeded!' });
  } catch (error) {
    next(error);
  }
});

// Central Error Handler
app.use(errorHandler);

export default app;
