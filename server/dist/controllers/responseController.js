import { z } from 'zod';
import { ResponseService } from '../services/responseService.js';
export const submitResponseSchema = z.object({
    body: z.object({
        subjectId: z.string().min(1, 'Subject ID is required'),
        ratings: z.array(z.object({
            questionId: z.string().min(1),
            rating: z.number().min(1).max(5),
        })).min(1, 'Ratings are required'),
        userComment: z.string().optional(),
    }),
});
export const submitResponse = async (req, res, next) => {
    try {
        const studentId = req.user?.userId;
        if (!studentId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const { subjectId, ratings, userComment } = req.body;
        const response = await ResponseService.submitResponse({
            studentId,
            subjectId,
            ratings,
            userComment,
        });
        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            response,
        });
    }
    catch (error) {
        next(error);
    }
};
export const checkSubmissionStatus = async (req, res, next) => {
    try {
        const studentId = req.user?.userId;
        const subjectId = req.params.subjectId;
        if (!studentId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const isSubmitted = await ResponseService.isSubmitted(studentId, subjectId);
        res.status(200).json({ success: true, isSubmitted });
    }
    catch (error) {
        next(error);
    }
};
export const clearSubjectData = async (req, res, next) => {
    try {
        const subjectId = req.params.subjectId;
        const result = await ResponseService.clearSubjectData(subjectId);
        res.status(200).json({ success: true, message: result.message, deletedCount: result.deletedCount });
    }
    catch (error) {
        next(error);
    }
};
