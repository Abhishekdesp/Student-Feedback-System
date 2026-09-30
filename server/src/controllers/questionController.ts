import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { QuestionService } from '../services/questionService.js';

export const createQuestionSchema = z.object({
  body: z.object({
    text: z.string().min(1, 'Question text is required'),
    order: z.number().optional(),
  }),
});

export const getAllQuestions = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const questions = await QuestionService.getAllQuestions();
    res.status(200).json({ success: true, questions });
  } catch (error) {
    next(error);
  }
};

export const createQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { text, order } = req.body;
    const question = await QuestionService.createQuestion(text, order);
    res.status(201).json({ success: true, message: 'Question added successfully', question });
  } catch (error) {
    next(error);
  }
};

export const deleteQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    await QuestionService.deleteQuestion(id);
    res.status(200).json({ success: true, message: 'Question deleted successfully' });
  } catch (error) {
    next(error);
  }
};
