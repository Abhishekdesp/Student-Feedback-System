import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import { User } from '../models/User.js';
import { Subject } from '../models/Subject.js';
import { Question } from '../models/Question.js';
import { Response } from '../models/Response.js';
import { env } from '../config/env.js';

describe('Comprehensive RBAC (Role-Based Access Control) Integration Tests', () => {
  let mongoServer: MongoMemoryServer;

  let adminCookie: string[];
  let teacher1Cookie: string[];
  let teacher2Cookie: string[];
  let student1Cookie: string[];
  let student2Cookie: string[];

  let teacher1SubjectId: string;
  let teacher2SubjectId: string;
  let testQuestionId: string;

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
    await Subject.deleteMany({});
    await Question.deleteMany({});
    await Response.deleteMany({});

    const passHash = await bcrypt.hash('password123', 10);

    // 1. Admin
    await User.create({
      username: 'admin',
      passwordHash: passHash,
      role: 'admin',
    });

    // 2. Teacher 1 (Dr. Rajesh Sharma)
    await User.create({
      username: 'rajesh.sharma',
      email: 'rajesh.sharma@college.edu',
      passwordHash: passHash,
      role: 'teacher',
    });

    // 3. Teacher 2 (Prof. Anita Roy)
    await User.create({
      username: 'anita.roy',
      email: 'anita.roy@college.edu',
      passwordHash: passHash,
      role: 'teacher',
    });

    // 4. Student 1
    const student1 = await User.create({
      username: 'student1',
      passwordHash: passHash,
      role: 'student',
      studentDetails: { academicYear: 'Third', isImported: true },
    });

    // 5. Student 2
    const student2 = await User.create({
      username: 'student2',
      passwordHash: passHash,
      role: 'student',
      studentDetails: { academicYear: 'First', isImported: true },
    });

    // 6. Question
    const question = await Question.create({
      text: 'Clarity of explanation and domain expertise?',
      order: 1,
      isActive: true,
    });
    testQuestionId = question._id.toString();

    // 7. Subject 1 assigned to Teacher 1
    const subject1 = await Subject.create({
      code: 'AJP',
      facultyName: 'Dr. Rajesh Sharma',
      facultyDesignation: 'Professor',
      facultyEmail: 'rajesh.sharma@college.edu',
      facultyMobile: '9876543210',
      scheme: 'K-Scheme',
      semester: '5',
      academicYear: 'Third',
      status: 1,
    });
    teacher1SubjectId = subject1._id.toString();

    // 8. Subject 2 assigned to Teacher 2
    const subject2 = await Subject.create({
      code: 'WT',
      facultyName: 'Prof. Anita Roy',
      facultyDesignation: 'Associate Professor',
      facultyEmail: 'anita.roy@college.edu',
      facultyMobile: '9876543211',
      scheme: 'K-Scheme',
      semester: '5',
      academicYear: 'Third',
      status: 1,
    });
    teacher2SubjectId = subject2._id.toString();

    // Logins
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'password123', role: 'admin' });
    adminCookie = adminLogin.headers['set-cookie'] as unknown as string[];

    const t1Login = await request(app)
      .post('/api/auth/login')
      .send({ username: 'rajesh.sharma', password: 'password123', role: 'teacher' });
    teacher1Cookie = t1Login.headers['set-cookie'] as unknown as string[];

    const t2Login = await request(app)
      .post('/api/auth/login')
      .send({ username: 'anita.roy', password: 'password123', role: 'teacher' });
    teacher2Cookie = t2Login.headers['set-cookie'] as unknown as string[];

    const s1Login = await request(app)
      .post('/api/auth/login')
      .send({ username: 'student1', password: 'password123', role: 'student' });
    student1Cookie = s1Login.headers['set-cookie'] as unknown as string[];

    const s2Login = await request(app)
      .post('/api/auth/login')
      .send({ username: 'student2', password: 'password123', role: 'student' });
    student2Cookie = s2Login.headers['set-cookie'] as unknown as string[];
  });

  // 1. Authentication Tests
  describe('1. Authentication Verification', () => {
    it('1. Returns 401 when no JWT token is provided', async () => {
      const res = await request(app).get('/api/teacher/dashboard');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Authentication required');
    });

    it('2. Returns 401 when invalid JWT token is provided', async () => {
      const res = await request(app)
        .get('/api/teacher/dashboard')
        .set('Cookie', ['token=invalid_jwt_token_123']);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('3. Returns 401 when expired JWT token is provided', async () => {
      const expiredToken = jwt.sign(
        { userId: '123', username: 'test', role: 'student' },
        env.JWT_SECRET,
        { expiresIn: '-1s' }
      );
      const res = await request(app)
        .get('/api/teacher/dashboard')
        .set('Cookie', [`token=${expiredToken}`]);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // 2. Role Authorization Tests
  describe('2. Role Authorization Checks', () => {
    it('4. Student accessing student-allowed endpoint returns 200 OK', async () => {
      const res = await request(app)
        .get('/api/subjects/student')
        .set('Cookie', student1Cookie);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('5. Teacher accessing student-only submit endpoint returns 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/responses/submit')
        .set('Cookie', teacher1Cookie)
        .send({
          subjectId: teacher1SubjectId,
          ratings: [{ questionId: testQuestionId, rating: 5 }],
        });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('You do not have permission');
    });

    it('6. Student accessing teacher endpoint returns 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/teacher/dashboard')
        .set('Cookie', student1Cookie);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('7. Teacher accessing teacher endpoint returns 200 OK', async () => {
      const res = await request(app)
        .get('/api/teacher/dashboard')
        .set('Cookie', teacher1Cookie);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('8. Student accessing admin endpoint returns 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/students')
        .set('Cookie', student1Cookie);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('9. Teacher accessing admin-only endpoint returns 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/students')
        .set('Cookie', teacher1Cookie);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('10. Admin accessing admin endpoint returns 200 OK', async () => {
      const res = await request(app)
        .get('/api/students')
        .set('Cookie', adminCookie);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // 3. Data Isolation Tests
  describe('3. Data Isolation & Ownership Validation', () => {
    it("11. Teacher A cannot access Teacher B's subject analytics (403 Forbidden)", async () => {
      const res = await request(app)
        .get(`/api/teacher/subjects/${teacher2SubjectId}/analytics`)
        .set('Cookie', teacher1Cookie);
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access denied');
    });

    it("12. Teacher A cannot access Teacher B's comments or report (403 Forbidden)", async () => {
      const resComments = await request(app)
        .get(`/api/teacher/subjects/${teacher2SubjectId}/comments`)
        .set('Cookie', teacher1Cookie);
      expect(resComments.status).toBe(403);

      const resReport = await request(app)
        .get(`/api/teacher/subjects/${teacher2SubjectId}/report`)
        .set('Cookie', teacher1Cookie);
      expect(resReport.status).toBe(403);
    });

    it("13. Student profile identity is derived strictly from JWT", async () => {
      const res1 = await request(app)
        .get('/api/auth/me')
        .set('Cookie', student1Cookie);
      expect(res1.status).toBe(200);
      expect(res1.body.user.username).toBe('student1');

      const res2 = await request(app)
        .get('/api/auth/me')
        .set('Cookie', student2Cookie);
      expect(res2.status).toBe(200);
      expect(res2.body.user.username).toBe('student2');
    });
  });

  // 4. Existing Functionality Preservation Tests
  describe('4. Existing API Functionality', () => {
    it('17. Student survey submission works seamlessly', async () => {
      const res = await request(app)
        .post('/api/responses/submit')
        .set('Cookie', student1Cookie)
        .send({
          subjectId: teacher1SubjectId,
          ratings: [{ questionId: testQuestionId, rating: 5 }],
          userComment: 'Excellent lecture clarity!',
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('18. Teacher assigned subjects query works', async () => {
      const res = await request(app)
        .get('/api/teacher/subjects')
        .set('Cookie', teacher1Cookie);
      expect(res.status).toBe(200);
      expect(res.body.subjects.length).toBeGreaterThan(0);
      expect(res.body.subjects[0].code).toBe('AJP');
    });

    it('19. Admin subject management works', async () => {
      const res = await request(app)
        .get('/api/subjects')
        .set('Cookie', adminCookie);
      expect(res.status).toBe(200);
      expect(res.body.subjects).toBeDefined();
    });
  });
});
