import { StudentService } from '../services/studentService.js';
export const importStudentsCSV = async (req, res, next) => {
    try {
        const csvContent = req.body?.csvText || (req.file ? req.file.buffer.toString('utf-8') : '');
        const academicYear = req.body?.year || 'Third';
        if (!csvContent || csvContent.trim().length === 0) {
            res.status(400).json({ success: false, message: 'CSV content or file is required.' });
            return;
        }
        const { importedCount } = await StudentService.importStudentsFromCSV(csvContent, academicYear);
        res.status(200).json({
            success: true,
            message: `Successfully imported ${importedCount} students!`,
            importedCount,
        });
    }
    catch (error) {
        next(error);
    }
};
export const getAllStudents = async (_req, res, next) => {
    try {
        const students = await StudentService.getAllStudents();
        res.status(200).json({ success: true, students });
    }
    catch (error) {
        next(error);
    }
};
