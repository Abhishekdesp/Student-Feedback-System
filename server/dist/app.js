import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redisClient } from './config/redis.js';
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
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        const allowedOrigins = [
            env.CLIENT_URL,
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'https://student-feedback-system-gold-phi.vercel.app',
        ];
        if (allowedOrigins.includes(origin) ||
            origin.endsWith('.vercel.app') ||
            origin.endsWith('.onrender.com') ||
            env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Disposition'],
    optionsSuccessStatus: 200,
};
// 1. CORS must run before helmet and other middleware to handle preflight OPTIONS
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
// 2. Helmet configured to allow cross-origin requests from Vercel
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize());
// Distributed Rate Limiter (Redis-backed in dev/prod with in-memory fallback)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    passOnStoreError: true,
    store: env.ENABLE_REDIS !== 'false' && env.NODE_ENV !== 'test'
        ? new RedisStore({
            sendCommand: (...args) => redisClient.call(...args),
            prefix: 'rl:',
        })
        : undefined,
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
    }
    catch (error) {
        next(error);
    }
});
// Central Error Handler
app.use(errorHandler);
export default app;
