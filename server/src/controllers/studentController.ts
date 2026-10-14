import { Request, Response, NextFunction } from 'express';
import { StudentService } from '../services/studentService.js';
import { dispatchStudentImportJob } from '../queues/importQueue.js';

export const importStudentsCSV = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const csvContent = req.body?.csvText || ((req as any).file ? (req as any).file.buffer.toString('utf-8') : '');
    const academicYear = req.body?.year || 'Third';

    if (!csvContent || csvContent.trim().length === 0) {
      res.status(400).json({ success: false, message: 'CSV content or file is required.' });
      return;
    }

    if (req.query.async === 'true') {
      const queueResult = await dispatchStudentImportJob(csvContent, academicYear);
      if (queueResult.isQueued) {
        res.status(202).json({
          success: true,
          message: 'Student import job enqueued for background processing.',
          jobId: queueResult.jobId,
          queued: true,
        });
        return;
      }
    }

    const { importedCount } = await StudentService.importStudentsFromCSV(csvContent, academicYear);
    res.status(200).json({
      success: true,
      message: `Successfully imported ${importedCount} students!`,
      importedCount,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllStudents = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const students = await StudentService.getAllStudents();
    res.status(200).json({ success: true, students });
  } catch (error) {
    next(error);
  }
};
