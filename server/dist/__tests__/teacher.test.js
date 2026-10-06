import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../app.js';
import { User } from '../models/User.js';
import { Subject } from '../models/Subject.js';
import { Question } from '../models/Question.js';
import { Response } from '../models/Response.js';
describe('Teacher Portal & Authorization Integration Tests', () => {
    let mongoServer;
    let teacher1Cookie;
    let teacher2Cookie;
    let studentCookie;
    let teacher1SubjectId;
    let teacher2SubjectId;
    let testQuestionId;
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
        const passHash = await bcrypt.hash('teacher123', 10);
        // 1. Teacher 1 (Dr. Rajesh Sharma - AJP)
        await User.create({
            username: 'rajesh.sharma',
            email: 'rajesh.sharma@college.edu',
            passwordHash: passHash,
            role: 'teacher',
        });
        // 2. Teacher 2 (Prof. Anita Roy - WT)
        await User.create({
            username: 'anita.roy',
            email: 'anita.roy@college.edu',
            passwordHash: passHash,
            role: 'teacher',
        });
        // 3. Student
        const studentPassHash = await bcrypt.hash('student123', 10);
        const student = await User.create({
            username: 'student1',
            passwordHash: studentPassHash,
            role: 'student',
            studentDetails: { academicYear: 'Third', isImported: true },
        });
        // 4. Question
        const question = await Question.create({
            text: 'Clarity of explanation and domain expertise?',
            order: 1,
            isActive: true,
        });
        testQuestionId = question._id.toString();
        // 5. Subject 1 assigned to Teacher 1
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
        // 6. Subject 2 assigned to Teacher 2
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
        // 7. Seed feedback response for Subject 1
        await Response.create({
            studentId: student._id,
            subjectId: subject1._id,
            subjectCode: subject1.code,
            ratings: [{ questionId: question._id, rating: 5 }],
            userComment: 'Fantastic explanation of Java multithreading concepts!',
            sentiment: { label: 'Positive', score: 1.0, engine: 'Offline Lexicon' },
            submittedAt: new Date(),
        });
        // Obtain login cookies
        const login1 = await request(app)
            .post('/api/auth/login')
            .send({ username: 'rajesh.sharma', password: 'teacher123', role: 'teacher' });
        teacher1Cookie = login1.headers['set-cookie'];
        const login2 = await request(app)
            .post('/api/auth/login')
            .send({ username: 'anita.roy', password: 'teacher123', role: 'teacher' });
        teacher2Cookie = login2.headers['set-cookie'];
        const loginStudent = await request(app)
            .post('/api/auth/login')
            .send({ username: 'student1', password: 'student123', role: 'student' });
        studentCookie = loginStudent.headers['set-cookie'];
    });
    describe('Authorization & Data Isolation', () => {
        it('1. Teacher can access their own dashboard', async () => {
            const res = await request(app)
                .get('/api/teacher/dashboard')
                .set('Cookie', teacher1Cookie);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.stats.assignedSubjectsCount).toBeGreaterThan(0);
            expect(res.body.stats.overallRating).toBe(5);
        });
        it('2. Unauthenticated user gets 401 Unauthorized', async () => {
            const res = await request(app).get('/api/teacher/dashboard');
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
        it('3. Student cannot access teacher dashboard (403 Forbidden)', async () => {
            const res = await request(app)
                .get('/api/teacher/dashboard')
                .set('Cookie', studentCookie);
            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });
        it('4 & 11. Teacher cannot access another teacher subject analytics or report (403 Forbidden)', async () => {
            const resAnalytics = await request(app)
                .get(`/api/teacher/subjects/${teacher2SubjectId}/analytics`)
                .set('Cookie', teacher1Cookie);
            expect(resAnalytics.status).toBe(403);
            expect(resAnalytics.body.message).toContain('Access denied');
            const resReport = await request(app)
                .get(`/api/teacher/subjects/${teacher2SubjectId}/report`)
                .set('Cookie', teacher1Cookie);
            expect(resReport.status).toBe(403);
        });
        it('5. Teacher sees only assigned subjects in getSubjects', async () => {
            const res = await request(app)
                .get('/api/teacher/subjects')
                .set('Cookie', teacher1Cookie);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            const codes = res.body.subjects.map((s) => s.code);
            expect(codes).toContain('AJP');
            expect(codes).not.toContain('WT');
        });
        it('6. Anonymous comments do NOT expose student identity', async () => {
            const res = await request(app)
                .get(`/api/teacher/subjects/${teacher1SubjectId}/comments`)
                .set('Cookie', teacher1Cookie);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.comments.length).toBe(1);
            const comment = res.body.comments[0];
            expect(comment.userComment).toBe('Fantastic explanation of Java multithreading concepts!');
            expect(comment.sentiment.label).toBe('Positive');
            // Verify privacy requirement: studentId, student name, email are absent!
            expect(comment.studentId).toBeUndefined();
            expect(comment.studentName).toBeUndefined();
            expect(comment.studentEmail).toBeUndefined();
            expect(comment.username).toBeUndefined();
        });
        it('7. Analytics calculations are correct', async () => {
            const res = await request(app)
                .get(`/api/teacher/subjects/${teacher1SubjectId}/analytics`)
                .set('Cookie', teacher1Cookie);
            expect(res.status).toBe(200);
            expect(res.body.analytics.overallRating).toBe(5);
            expect(res.body.analytics.totalResponses).toBe(1);
            expect(res.body.analytics.ratingDistribution[0].stars).toBe(5);
            expect(res.body.analytics.ratingDistribution[0].count).toBe(1);
            expect(res.body.analytics.questionWise[0].avgRating).toBe(5);
        });
        it('8. Empty feedback is handled gracefully', async () => {
            const res = await request(app)
                .get(`/api/teacher/subjects/${teacher2SubjectId}/analytics`)
                .set('Cookie', teacher2Cookie);
            expect(res.status).toBe(200);
            expect(res.body.analytics.totalResponses).toBe(0);
            expect(res.body.analytics.overallRating).toBe(0);
        });
        it('9. Excel report endpoint generates valid spreadsheet', async () => {
            const res = await request(app)
                .get(`/api/teacher/subjects/${teacher1SubjectId}/report`)
                .set('Cookie', teacher1Cookie);
            expect(res.status).toBe(200);
            expect(res.headers['content-type']).toContain('spreadsheetml');
        });
        it('10. Invalid subject ID format returns 400 Bad Request', async () => {
            const res = await request(app)
                .get('/api/teacher/subjects/invalid-id-123/analytics')
                .set('Cookie', teacher1Cookie);
            expect(res.status).toBe(400);
            expect(res.body.message).toContain('Invalid subject ID format');
        });
    });
});
