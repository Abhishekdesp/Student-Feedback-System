import { z } from 'zod';
import { QuestionService } from '../services/questionService.js';
export const createQuestionSchema = z.object({
    body: z.object({
        text: z.string().min(1, 'Question text is required'),
        order: z.number().optional(),
    }),
});
export const getAllQuestions = async (_req, res, next) => {
    try {
        const questions = await QuestionService.getAllQuestions();
        res.status(200).json({ success: true, questions });
    }
    catch (error) {
        next(error);
    }
};
export const createQuestion = async (req, res, next) => {
    try {
        const { text, order } = req.body;
        const question = await QuestionService.createQuestion(text, order);
        res.status(201).json({ success: true, message: 'Question added successfully', question });
    }
    catch (error) {
        next(error);
    }
};
export const deleteQuestion = async (req, res, next) => {
    try {
        const id = req.params.id;
        await QuestionService.deleteQuestion(id);
        res.status(200).json({ success: true, message: 'Question deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
