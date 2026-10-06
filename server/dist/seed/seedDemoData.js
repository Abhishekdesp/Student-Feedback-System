import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { Subject } from '../models/Subject.js';
import { Question } from '../models/Question.js';
import { Response } from '../models/Response.js';
import { SystemSetting } from '../models/SystemSetting.js';
import { AISentimentService } from '../services/aiSentimentService.js';
export async function seedDemoData() {
    console.log('🌱 Starting Demo Data Seeding...');
    // 1. Admin & Teacher Users
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    await User.findOneAndUpdate({ username: 'admin' }, { username: 'admin', email: 'admin@college.edu', passwordHash: adminPasswordHash, role: 'admin' }, { upsert: true, new: true });
    const teacherPasswordHash = await bcrypt.hash('teacher123', 10);
    const sampleTeachers = [
        { username: 'rajesh.sharma', email: 'rajesh.sharma@college.edu' },
        { username: 'anita.roy', email: 'anita.roy@college.edu' },
        { username: 'vikram.mehta', email: 'vikram.mehta@college.edu' },
        { username: 'neha.gupta', email: 'neha.gupta@college.edu' },
    ];
    for (const t of sampleTeachers) {
        await User.findOneAndUpdate({ username: t.username }, { username: t.username, email: t.email, passwordHash: teacherPasswordHash, role: 'teacher' }, { upsert: true, new: true });
    }
    // 2. Questions
    const sampleQuestions = [
        'Punctuality and regularity in taking lectures and practicals?',
        'Clarity of explanation and domain expertise?',
        'Accessibility and willingness to assist students outside class hours?',
        'Fairness and transparency in evaluation and internal assessments?',
        'Use of interactive teaching aids, slides, and real-world examples?',
    ];
    const createdQuestions = [];
    for (let i = 0; i < sampleQuestions.length; i++) {
        const qText = sampleQuestions[i];
        let q = await Question.findOne({ text: qText });
        if (!q) {
            q = await Question.create({ text: qText, order: i + 1, isActive: true });
        }
        createdQuestions.push(q);
    }
    // 3. Faculty / Subjects
    const sampleFaculty = [
        {
            code: 'AJP',
            facultyName: 'Dr. Rajesh Sharma',
            facultyDesignation: 'Professor & HOD',
            facultyEmail: 'rajesh.sharma@college.edu',
            facultyMobile: '9876543210',
            scheme: 'K-Scheme',
            semester: '5',
            academicYear: 'Third',
            status: 1,
        },
        {
            code: 'WT',
            facultyName: 'Prof. Anita Roy',
            facultyDesignation: 'Associate Professor',
            facultyEmail: 'anita.roy@college.edu',
            facultyMobile: '9876543211',
            scheme: 'K-Scheme',
            semester: '5',
            academicYear: 'Third',
            status: 1,
        },
        {
            code: 'DBMS',
            facultyName: 'Dr. Vikram Mehta',
            facultyDesignation: 'Assistant Professor',
            facultyEmail: 'vikram.mehta@college.edu',
            facultyMobile: '9876543212',
            scheme: 'I-Scheme',
            semester: '3',
            academicYear: 'Second',
            status: 1,
        },
        {
            code: 'OOP',
            facultyName: 'Prof. Neha Gupta',
            facultyDesignation: 'Assistant Professor',
            facultyEmail: 'neha.gupta@college.edu',
            facultyMobile: '9876543213',
            scheme: 'K-Scheme',
            semester: '1',
            academicYear: 'First',
            status: 1,
        },
    ];
    const createdSubjects = [];
    for (const f of sampleFaculty) {
        let s = await Subject.findOne({ code: f.code });
        if (!s) {
            s = await Subject.create(f);
        }
        else {
            Object.assign(s, f);
            await s.save();
        }
        createdSubjects.push(s);
    }
    // 4. Students
    const sampleStudents = [
        { username: 'Aarav', pass: '746Hb67V', year: 'Third' },
        { username: 'Ananya', pass: '4qRvyxj9', year: 'Second' },
        { username: 'Kabir', pass: 'cRkrlBZc', year: 'Third' },
        { username: 'Diya', pass: 'MseOVfS0', year: 'First' },
        { username: 'Rohan', pass: 'VbEa5Thi', year: 'Third' },
    ];
    const createdStudents = [];
    for (const st of sampleStudents) {
        const hash = await bcrypt.hash(st.pass, 10);
        let student = await User.findOne({ username: st.username });
        if (!student) {
            student = await User.create({
                username: st.username,
                passwordHash: hash,
                role: 'student',
                studentDetails: { academicYear: st.year, isImported: true },
            });
        }
        createdStudents.push(student);
    }
    // 5. Sample Feedback Comments & Responses
    const sampleComments = {
        AJP: [
            'Explains complex Java multithreading and AWT concepts with great real-world examples!',
            'Extremely punctual and always available to clarify lab doubts.',
            'Please share more solved practice code samples for university lab exams.',
        ],
        WT: [
            'Very engaging lectures on Web Development, HTML5, and JavaScript!',
            'Could explain CSS Flexbox and Grid layouts slightly slower.',
            'Interactive teaching style helps us understand web concepts clearly.',
        ],
        DBMS: [
            'Excellent SQL query demonstrations and ER diagram explanations.',
            'Superb guidance during database practical lab sessions!',
            'Great thorough explanations of relational algebra and normalization.',
        ],
        OOP: [
            'Clear explanation of C++ pointers and class inheritance.',
            'Please provide more practice assignment questions before midterm tests.',
            'Very supportive teacher who clarifies every doubt patiently.',
        ],
    };
    // Seed sample responses from students
    for (const subject of createdSubjects) {
        const relevantStudents = createdStudents.filter((st) => st.studentDetails?.academicYear === subject.academicYear || st.studentDetails?.academicYear === 'Third');
        const commentsList = sampleComments[subject.code] || [];
        for (let i = 0; i < relevantStudents.length; i++) {
            const student = relevantStudents[i];
            const commentText = commentsList[i % commentsList.length];
            const existingResponse = await Response.findOne({
                studentId: student._id,
                subjectId: subject._id,
            });
            if (!existingResponse) {
                const ratings = createdQuestions.map((q) => {
                    const ratingVal = ([5, 5, 4, 4, 3][Math.floor(Math.random() * 5)] || 5);
                    return { questionId: q._id, rating: ratingVal };
                });
                const sentiment = commentText ? AISentimentService.analyzeOffline(commentText) : undefined;
                await Response.create({
                    studentId: student._id,
                    subjectId: subject._id,
                    subjectCode: subject.code,
                    ratings,
                    userComment: commentText,
                    sentiment,
                    submittedAt: new Date(),
                });
            }
        }
    }
    // 6. Default Settings
    await SystemSetting.findOneAndUpdate({ key: 'use_external_ai' }, { key: 'use_external_ai', value: true }, { upsert: true, new: true });
    console.log('✅ Demo Data Seeding Completed Successfully!');
}
