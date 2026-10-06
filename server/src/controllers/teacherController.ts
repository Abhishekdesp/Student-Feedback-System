import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { TeacherService } from '../services/teacherService.js';
import { AppError } from '../middleware/errorHandler.js';

export async function getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required.', 401);
    const stats = await TeacherService.getDashboardStats(req.user);
    res.status(200).json({ success: true, stats });
  } catch (error) {
    next(error);
  }
}

export async function getSubjects(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required.', 401);
    const subjects = await TeacherService.getTeacherSubjects(req.user);
    res.status(200).json({ success: true, subjects });
  } catch (error) {
    next(error);
  }
}

export async function getSubjectAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required.', 401);
    const subjectId = req.params.subjectId as string;
    const analytics = await TeacherService.getSubjectAnalytics(req.user, subjectId);
    res.status(200).json({ success: true, analytics });
  } catch (error) {
    next(error);
  }
}

export async function getSubjectComments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required.', 401);
    const subjectId = req.params.subjectId as string;
    const comments = await TeacherService.getSubjectComments(req.user, subjectId);
    res.status(200).json({ success: true, comments });
  } catch (error) {
    next(error);
  }
}

export async function getSubjectTrends(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required.', 401);
    const subjectId = req.params.subjectId as string;
    const trends = await TeacherService.getSubjectTrends(req.user, subjectId);
    res.status(200).json({ success: true, trends });
  } catch (error) {
    next(error);
  }
}

export async function exportSubjectReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required.', 401);
    const subjectId = req.params.subjectId as string;
    const buffer = await TeacherService.generateReport(req.user, subjectId);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename=Teacher_Feedback_Report.xlsx`);
    res.status(200).send(buffer);
  } catch (error) {
    next(error);
  }
}
