import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SubjectService } from '../services/subjectService.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const createSubjectSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Subject code is required'),
    facultyName: z.string().min(1, 'Faculty name is required'),
    facultyDesignation: z.string().min(1, 'Faculty designation is required'),
    facultyEmail: z.string().email('Invalid email address'),
    facultyMobile: z.string().min(1, 'Mobile number is required'),
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

export const getAllSubjects = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const subjects = await SubjectService.getAllSubjects();
    res.status(200).json({ success: true, subjects });
  } catch (error) {
    next(error);
  }
};

export const getStudentSubjects = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const year = req.user?.role === 'student' ? req.query.year as string || 'Third' : req.query.year as string || 'Third';
    const subjects = await SubjectService.getSubjectsForStudent(year);
    res.status(200).json({ success: true, subjects });
  } catch (error) {
    next(error);
  }
};

export const createSubject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const subject = await SubjectService.createSubject(req.body);
    res.status(201).json({ success: true, message: 'Subject created successfully', subject });
  } catch (error) {
    next(error);
  }
};

export const toggleStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    const subject = await SubjectService.toggleStatus(id, status);
    res.status(200).json({ success: true, message: 'Status updated successfully', subject });
  } catch (error) {
    next(error);
  }
};

export const getSubjectSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const summary = await SubjectService.getSubjectFeedbackSummary(id);
    res.status(200).json({ success: true, summary });
  } catch (error) {
    next(error);
  }
};
