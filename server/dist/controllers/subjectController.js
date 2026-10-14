import { z } from 'zod';
import { SubjectService } from '../services/subjectService.js';
export const createSubjectSchema = z.object({
    body: z.object({
        code: z.string().min(1, 'Subject code is required'),
        teacherId: z.string().optional(),
        facultyName: z.string().optional(),
        facultyDesignation: z.string().optional(),
        facultyEmail: z.string().optional(),
        facultyMobile: z.string().optional(),
        scheme: z.string().min(1, 'Scheme is required'),
        semester: z.string().min(1, 'Semester is required'),
        academicYear: z.enum(['First', 'Second', 'Third']),
        status: z.number().optional(),
    }),
});
export const toggleStatusSchema = z.object({
    params: z.object({
        id: z.string().min(1),
    }),
    body: z.object({
        status: z.number().min(0).max(1),
    }),
});
export const getAllSubjects = async (_req, res, next) => {
    try {
        const subjects = await SubjectService.getAllSubjects();
        res.status(200).json({ success: true, subjects });
    }
    catch (error) {
        next(error);
    }
};
export const getStudentSubjects = async (req, res, next) => {
    try {
        const year = req.user?.role === 'student' ? req.query.year || 'Third' : req.query.year || 'Third';
        const subjects = await SubjectService.getSubjectsForStudent(year);
        res.status(200).json({ success: true, subjects });
    }
    catch (error) {
        next(error);
    }
};
export const createSubject = async (req, res, next) => {
    try {
        const subject = await SubjectService.createSubject(req.body);
        res.status(201).json({ success: true, message: 'Subject created successfully', subject });
    }
    catch (error) {
        next(error);
    }
};
export const toggleStatus = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { status } = req.body;
        const subject = await SubjectService.toggleStatus(id, status);
        res.status(200).json({ success: true, message: 'Status updated successfully', subject });
    }
    catch (error) {
        next(error);
    }
};
export const getSubjectSummary = async (req, res, next) => {
    try {
        const id = req.params.id;
        const summary = await SubjectService.getSubjectFeedbackSummary(id);
        res.status(200).json({ success: true, summary });
    }
    catch (error) {
        next(error);
    }
};
export const deleteSubject = async (req, res, next) => {
    try {
        const id = req.params.id;
        const result = await SubjectService.deleteSubject(id);
        res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
};
