import { Response, IRating } from '../models/Response.js';
import { Subject } from '../models/Subject.js';
import { SystemSetting } from '../models/SystemSetting.js';
import { AISentimentService } from './aiSentimentService.js';
import { AppError } from '../middleware/errorHandler.js';

export interface SubmitResponseInput {
  studentId: string;
  subjectId: string;
  ratings: { questionId: string; rating: number }[];
  userComment?: string;
}

export class ResponseService {
  static async submitResponse(input: SubmitResponseInput) {
    const { studentId, subjectId, ratings, userComment } = input;

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      throw new AppError('Subject not found', 404);
    }

    if (subject.status !== 1) {
      throw new AppError('Feedback survey for this subject is currently closed.', 400);
    }

    // Check unique submission rule
    const existing = await Response.findOne({ studentId, subjectId });
    if (existing) {
      throw new AppError(`Feedback for ${subject.code} has already been submitted.`, 400);
    }

    // Process Sentiment if comment provided
    let sentimentResult;
    if (userComment && userComment.trim().length > 0) {
      const setting = await SystemSetting.findOne({ key: 'use_external_ai' });
      const useExternalAi = setting ? setting.value === true || setting.value === '1' : true;
      sentimentResult = await AISentimentService.analyzeSentiment(userComment.trim(), useExternalAi);
    }

    const formattedRatings: IRating[] = ratings.map((r) => ({
      questionId: r.questionId as any,
      rating: r.rating as 1 | 2 | 3 | 4 | 5,
    }));

    const newResponse = await Response.create({
      studentId,
      subjectId,
      subjectCode: subject.code,
      ratings: formattedRatings,
      userComment: userComment ? userComment.trim() : undefined,
      sentiment: sentimentResult,
      submittedAt: new Date(),
    });

    return newResponse;
  }

  static async isSubmitted(studentId: string, subjectId: string): Promise<boolean> {
    const existing = await Response.findOne({ studentId, subjectId });
    return !!existing;
  }

  static async clearSubjectData(subjectId: string) {
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      throw new AppError('Subject not found', 404);
    }

    const deleteResult = await Response.deleteMany({ subjectId });
    return {
      message: `Database cleared successfully for ${subject.code}.`,
      deletedCount: deleteResult.deletedCount,
    };
  }
}
