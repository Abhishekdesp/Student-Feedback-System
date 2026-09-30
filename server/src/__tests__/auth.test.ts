import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../app.js';
import { User } from '../models/User.js';

describe('Auth API & Middleware Integration Tests', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});

    // Seed test users
    const adminPassHash = await bcrypt.hash('admin123', 10);
    await User.create({
      username: 'admin',
      passwordHash: adminPassHash,
      role: 'admin',
    });

    const studentPassHash = await bcrypt.hash('password123', 10);
    await User.create({
      username: 'aarav',
      passwordHash: studentPassHash,
      role: 'student',
      studentDetails: {
        academicYear: 'Third',
        isImported: true,
      },
    });
  });

  describe('POST /api/auth/login', () => {
    it('should log in student successfully with valid credentials and return JWT cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'aarav',
          password: 'password123',
          role: 'student',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.username).toBe('aarav');
      expect(res.body.user.role).toBe('student');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should log in admin successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123',
          role: 'teacher',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.username).toBe('admin');
      expect(res.body.user.role).toBe('admin');
    });

    it('should fail login when wrong password is provided', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'wrongpassword',
          role: 'teacher',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid credentials');
    });

    it('should fail login when user does not exist', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistentuser',
          password: 'password123',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Unique Username Enforcement', () => {
    it('should enforce unique index on username', async () => {
      const passHash = await bcrypt.hash('pass123', 10);
      
      let errorEncountered = false;
      try {
        await User.create({
          username: 'admin',
          passwordHash: passHash,
          role: 'student',
        });
      } catch (err: any) {
        errorEncountered = true;
        expect(err.code).toBe(11000);
      }

      expect(errorEncountered).toBe(true);
    });
  });

  describe('Role Middleware & Access Control', () => {
    it('should block student from accessing admin-only route with 403 Forbidden', async () => {
      // 1. Login as student to get cookie
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'aarav',
          password: 'password123',
        });

      const cookies = loginRes.headers['set-cookie'];

      // 2. Attempt to access admin-only student list endpoint
      const res = await request(app)
        .get('/api/students')
        .set('Cookie', cookies);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Access denied for role: student');
    });

    it('should allow admin to access admin routes', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123',
        });

      const cookies = loginRes.headers['set-cookie'];

      const res = await request(app)
        .get('/api/students')
        .set('Cookie', cookies);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.students).toBeDefined();
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current authenticated user profile', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'aarav',
          password: 'password123',
        });

      const cookies = loginRes.headers['set-cookie'];

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', cookies);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.username).toBe('aarav');
      expect(res.body.user.role).toBe('student');
    });
  });
});
