import { Request, Response, NextFunction } from 'express';
import { SubjectService } from '../services/subjectService.js';
import { ExcelService } from '../services/excelService.js';
import { AppError } from '../middleware/errorHandler.js';

export const exportSubjectReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const subjectId = req.params.subjectId as string;
    const summary = await SubjectService.getSubjectFeedbackSummary(subjectId);
    const subject = await SubjectService.getAllSubjects().then(list => list.find(s => s._id.toString() === subjectId));

    if (!subject) {
      throw new AppError('Subject not found', 404);
    }

    const uploadedBuffer = (req as any).file ? (req as any).file.buffer : undefined;

    const reportBuffer = await ExcelService.generateReport(
      {
        facultyName: subject.facultyName,
        subjectCode: subject.code,
        semester: subject.semester,
        scheme: subject.scheme,
        submissionCount: summary.metrics.totalSubmissions,
        avgRating: summary.metrics.avgRating,
        questionsData: summary.questionsData.map((q) => ({
          questionText: q.questionText,
          excellent: q.excellent,
          veryGood: q.veryGood,
          good: q.good,
          poor: q.poor,
          bad: q.bad,
        })),
        aiSummary: summary.aiSummary,
      },
      uploadedBuffer
    );

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${subject.code}.xlsx"`);
    res.status(200).send(reportBuffer);
  } catch (error) {
    next(error);
  }
};
