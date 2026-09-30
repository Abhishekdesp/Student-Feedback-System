import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../app.js';
import { User } from '../models/User.js';
import { Subject } from '../models/Subject.js';
import { Question } from '../models/Question.js';
import { Response } from '../models/Response.js';

describe('Feedback & Subject API Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let adminCookie: string[];
  let studentCookie: string[];
  let testSubjectId: string;
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

    // 1. Create Admin
    const adminPassHash = await bcrypt.hash('admin123', 10);
    await User.create({ username: 'admin', passwordHash: adminPassHash, role: 'admin' });

    // 2. Create Student
    const studentPassHash = await bcrypt.hash('pass123', 10);
    const student = await User.create({
      username: 'student1',
      passwordHash: studentPassHash,
      role: 'student',
      studentDetails: { academicYear: 'Third', isImported: true },
    });

    // 3. Create Question
    const question = await Question.create({
      text: 'Punctuality and regularity?',
      order: 1,
      isActive: true,
    });
    testQuestionId = question._id.toString();

    // 4. Create Subject
    const subject = await Subject.create({
      code: 'AJP',
      facultyName: 'Dr. Sharma',
      facultyDesignation: 'Professor',
      facultyEmail: 'sharma@college.edu',
      facultyMobile: '9876543210',
      scheme: 'K-Scheme',
      semester: '5',
      academicYear: 'Third',
      status: 1,
    });
    testSubjectId = subject._id.toString();

    // Obtain session cookies
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    adminCookie = adminLogin.headers['set-cookie'] as unknown as string[];

    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'student1', password: 'pass123' });
    studentCookie = studentLogin.headers['set-cookie'] as unknown as string[];
  });

  describe('Subject Management', () => {
    it('should allow admin to create a new subject', async () => {
      const res = await request(app)
        .post('/api/subjects')
        .set('Cookie', adminCookie)
        .send({
          code: 'WT',
          facultyName: 'Prof. Anita Roy',
          facultyDesignation: 'Associate Professor',
          facultyEmail: 'anita@college.edu',
          facultyMobile: '9876543211',
          scheme: 'K-Scheme',
          semester: '5',
          academicYear: 'Third',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.subject.code).toBe('WT');
    });

    it('should reject creating duplicate subject code', async () => {
      const res = await request(app)
        .post('/api/subjects')
        .set('Cookie', adminCookie)
        .send({
          code: 'AJP',
          facultyName: 'Another Faculty',
          facultyDesignation: 'Lecturer',
          facultyEmail: 'another@college.edu',
          facultyMobile: '9999999999',
          scheme: 'I-Scheme',
          semester: '5',
          academicYear: 'Third',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });
  });

  describe('Survey Submission & Compound Index Enforcement', () => {
    it('should submit feedback survey successfully', async () => {
      const res = await request(app)
        .post('/api/responses/submit')
        .set('Cookie', studentCookie)
        .send({
          subjectId: testSubjectId,
          ratings: [{ questionId: testQuestionId, rating: 5 }],
          userComment: 'Great teaching style and helpful lab demos!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.response.sentiment.label).toBe('Positive');
    });

    it('should prevent student from submitting feedback twice for the same subject', async () => {
      // First submission
      await request(app)
        .post('/api/responses/submit')
        .set('Cookie', studentCookie)
        .send({
          subjectId: testSubjectId,
          ratings: [{ questionId: testQuestionId, rating: 5 }],
        });

      // Second submission attempt
      const res = await request(app)
        .post('/api/responses/submit')
        .set('Cookie', studentCookie)
        .send({
          subjectId: testSubjectId,
          ratings: [{ questionId: testQuestionId, rating: 4 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already been submitted');
    });
  });

  describe('Report Export & Clear Data', () => {
    it('should generate Excel report for a subject', async () => {
      const res = await request(app)
        .get(`/api/export/subject/${testSubjectId}`)
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('spreadsheetml');
    });

    it('should allow admin to clear subject responses', async () => {
      // Submit a response first
      await request(app)
        .post('/api/responses/submit')
        .set('Cookie', studentCookie)
        .send({
          subjectId: testSubjectId,
          ratings: [{ questionId: testQuestionId, rating: 5 }],
        });

      // Clear responses
      const res = await request(app)
        .delete(`/api/responses/clear/${testSubjectId}`)
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const count = await Response.countDocuments({ subjectId: testSubjectId });
      expect(count).toBe(0);
    });
  });
});
