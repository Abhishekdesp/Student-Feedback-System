import { Question } from '../models/Question.js';
import { AppError } from '../middleware/errorHandler.js';
export class QuestionService {
    static async getAllQuestions() {
        return Question.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
    }
    static async createQuestion(text, order) {
        if (!text || text.trim().length === 0) {
            throw new AppError('Question text cannot be empty.', 400);
        }
        const count = await Question.countDocuments();
        const newOrder = order !== undefined ? order : count + 1;
        return Question.create({
            text: text.trim(),
            order: newOrder,
        });
    }
    static async deleteQuestion(id) {
        const deleted = await Question.findByIdAndDelete(id);
        if (!deleted) {
            throw new AppError('Question not found.', 404);
        }
        return deleted;
    }
}
