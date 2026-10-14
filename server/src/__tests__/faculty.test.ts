import { jest } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app.js';
import { User } from '../models/User.js';
import { Subject } from '../models/Subject.js';
import bcrypt from 'bcrypt';

jest.setTimeout(30000);

describe('Faculty & Subject Assignment Architecture', () => {
  let mongoServer: MongoMemoryServer;
  let adminCookie: string;
  let testTeacherId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    // 1. Setup Admin
    const adminHash = await bcrypt.hash('admin123', 10);
    await User.create({
      username: 'admin_faculty_test',
      email: 'admin_fac@test.com',
      passwordHash: adminHash,
      role: 'admin',
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin_faculty_test', password: 'admin123' });

    adminCookie = loginRes.headers['set-cookie'][0];
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('allows admin to register a new faculty member without assigning any subject', async () => {
    const res = await request(app)
      .post('/api/teacher/faculty')
      .set('Cookie', adminCookie)
      .send({
        name: 'Prof. Abhishek Deshpande',
        username: 'abhishek.faculty.test',
        email: 'abhishek.test@college.edu',
        password: 'teacher123',
        designation: 'Assistant Professor',
        mobile: '9876543210',
        department: 'Computer Engineering',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.faculty.name).toBe('Prof. Abhishek Deshpande');
    expect(res.body.faculty.username).toBe('abhishek.faculty.test');
    expect(res.body.faculty.role).toBe('teacher');

    testTeacherId = res.body.faculty._id;

    // Verify teacher exists in User table and can log in
    const teacherLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'abhishek.faculty.test', password: 'teacher123' });

    expect(teacherLogin.status).toBe(200);
    expect(teacherLogin.body.user.role).toBe('teacher');
  });

  it('allows admin to list all faculty members with assigned subjects count', async () => {
    const res = await request(app)
      .get('/api/teacher/faculty')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.faculty)).toBe(true);

    const teacher = res.body.faculty.find((f: any) => f.username === 'abhishek.faculty.test');
    expect(teacher).toBeDefined();
    expect(teacher.name).toBe('Prof. Abhishek Deshpande');
  });

  it('allows admin to assign a subject by selecting teacherId', async () => {
    const res = await request(app)
      .post('/api/subjects')
      .set('Cookie', adminCookie)
      .send({
        code: 'ML_TEST',
        teacherId: testTeacherId,
        scheme: 'K-Scheme',
        semester: '5',
        academicYear: 'Third',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.subject.code).toBe('ML_TEST');
    expect(res.body.subject.teacherId).toBe(testTeacherId);
    expect(res.body.subject.facultyName).toBe('Prof. Abhishek Deshpande');

    // Clean up created subject
    await Subject.deleteOne({ code: 'ML_TEST' });
    await User.deleteOne({ username: 'abhishek.faculty.test' });
    await User.deleteOne({ username: 'admin_faculty_test' });
  });
});
