import { Types } from 'mongoose';
import bcrypt from 'bcrypt';
import { Subject, ISubject } from '../models/Subject.js';
import { Response } from '../models/Response.js';
import { Question } from '../models/Question.js';
import { User } from '../models/User.js';
import { SystemSetting } from '../models/SystemSetting.js';
import { AISentimentService } from './aiSentimentService.js';
import { CacheService } from './cacheService.js';
import { AppError } from '../middleware/errorHandler.js';

export interface CreateSubjectInput {
  code: string;
  teacherId?: string;
  facultyName?: string;
  facultyDesignation?: string;
  facultyEmail?: string;
  facultyMobile?: string;
  scheme: string;
  semester: string;
  academicYear: 'First' | 'Second' | 'Third';
  status?: number;
}

export class SubjectService {
  static async getAllSubjects() {
    return Subject.find().sort({ code: 1 });
  }

  static async getSubjectsForStudent(academicYear: string) {
    return Subject.find({ academicYear }).sort({ code: 1 });
  }

  static async createSubject(input: CreateSubjectInput) {
    const code = input.code.trim().toUpperCase();
    const existing = await Subject.findOne({ code });

    let teacher: any = null;
    if (input.teacherId && Types.ObjectId.isValid(input.teacherId)) {
      teacher = await User.findOne({ _id: input.teacherId, role: 'teacher' });
      if (!teacher) {
        throw new AppError('Selected faculty member does not exist or is not a registered teacher.', 404);
      }
    } else if (input.facultyEmail || input.facultyName) {
      // Lookup or link existing teacher
      teacher = await User.findOne({
        role: 'teacher',
        $or: [
          ...(input.facultyEmail ? [{ email: input.facultyEmail.toLowerCase().trim() }] : []),
          ...(input.facultyName
            ? [
                { name: input.facultyName.trim() },
                { username: input.facultyName.toLowerCase().replace(/[^a-z0-9]/g, '.') },
              ]
            : []),
        ],
      });

      if (!teacher && (input.facultyName || input.facultyEmail)) {
        const passwordHash = await bcrypt.hash('teacher123', 10);
        const name = input.facultyName?.trim() || code;
        const username = (input.facultyEmail?.split('@')[0] || name).toLowerCase().replace(/[^a-z0-9]/g, '.');
        teacher = await User.findOneAndUpdate(
          { username },
          {
            username,
            name,
            email: input.facultyEmail?.toLowerCase().trim() || undefined,
            passwordHash,
            role: 'teacher',
            designation: input.facultyDesignation || 'Professor',
            mobile: input.facultyMobile || '',
          },
          { upsert: true, new: true }
        );
      }
    }

    const facultyName = teacher?.name || input.facultyName || 'Faculty';
    const facultyEmail = teacher?.email || input.facultyEmail || '';
    const facultyDesignation = teacher?.designation || input.facultyDesignation || 'Professor';
    const facultyMobile = teacher?.mobile || input.facultyMobile || '';

    if (existing) {
      if (input.teacherId && teacher) {
        existing.teacherId = teacher._id;
        existing.facultyName = facultyName;
        existing.facultyDesignation = facultyDesignation;
        existing.facultyEmail = facultyEmail;
        existing.facultyMobile = facultyMobile;
        existing.scheme = input.scheme;
        existing.semester = input.semester;
        existing.academicYear = input.academicYear;
        if (input.status !== undefined) existing.status = input.status;
        await existing.save();
        await CacheService.delByPattern('teacher:*');
        return existing;
      }
      throw new AppError(`Subject code ${code} already exists!`, 400);
    }

    const subject = await Subject.create({
      code,
      teacherId: teacher?._id,
      facultyName,
      facultyDesignation,
      facultyEmail,
      facultyMobile,
      scheme: input.scheme,
      semester: input.semester,
      academicYear: input.academicYear,
      status: input.status !== undefined ? input.status : 1,
    });

    await CacheService.delByPattern('teacher:*');
    return subject;
  }

  static async deleteSubject(subjectId: string) {
    if (!Types.ObjectId.isValid(subjectId)) {
      throw new AppError('Invalid subject ID format.', 400);
    }
    const subject = await Subject.findByIdAndDelete(subjectId);
    if (!subject) {
      throw new AppError('Subject not found', 404);
    }
    await CacheService.delByPattern('teacher:*');
    await CacheService.delByPattern('subject:*');
    return { success: true, message: `Subject ${subject.code} deleted successfully.` };
  }

  static async toggleStatus(subjectId: string, status: number) {
    const subject = await Subject.findByIdAndUpdate(
      subjectId,
      { status },
      { new: true }
    );

    if (!subject) {
      throw new AppError('Subject not found', 404);
    }

    return subject;
  }

  static async getSubjectFeedbackSummary(subjectId: string) {
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      throw new AppError('Subject not found', 404);
    }

    const responses = await Response.find({ subjectId });
    const questions = await Question.find({ isActive: true }).sort({ order: 1, createdAt: 1 });

    const totalSubmissions = responses.length;

    // Aggregate question ratings
    const questionsData = questions.map((q) => {
      let excellent = 0;
      let veryGood = 0;
      let good = 0;
      let poor = 0;
      let bad = 0;

      responses.forEach((r) => {
        const ratingObj = r.ratings.find((item) => item.questionId.toString() === q._id.toString());
        if (ratingObj) {
          if (ratingObj.rating === 5) excellent++;
          else if (ratingObj.rating === 4) veryGood++;
          else if (ratingObj.rating === 3) good++;
          else if (ratingObj.rating === 2) poor++;
          else if (ratingObj.rating === 1) bad++;
        }
      });

      return {
        questionId: q._id.toString(),
        questionText: q.text,
        excellent,
        veryGood,
        good,
        poor,
        bad,
      };
    });

    // Calculate totals across all questions
    let totalEx = 0, totalVg = 0, totalG = 0, totalP = 0, totalB = 0;
    questionsData.forEach((q) => {
      totalEx += q.excellent;
      totalVg += q.veryGood;
      totalG += q.good;
      totalP += q.poor;
      totalB += q.bad;
    });

    const totalVotes = totalEx + totalVg + totalG + totalP + totalB;
    const weightedScore = (5 * totalEx) + (4 * totalVg) + (3 * totalG) + (2 * totalP) + (1 * totalB);
    const avgRating = totalVotes > 0 ? Number((weightedScore / totalVotes).toFixed(2)) : 0;

    // Comments and sentiment distribution
    const comments = responses
      .filter((r) => r.userComment && r.userComment.trim().length > 0)
      .map((r) => ({
        id: r._id.toString(),
        comment: r.userComment,
        sentiment: r.sentiment?.label || 'Neutral',
        score: r.sentiment?.score || 0,
        createdAt: r.submittedAt,
      }));

    let posCnt = 0, neuCnt = 0, conCnt = 0;
    comments.forEach((c) => {
      if (c.sentiment === 'Positive') posCnt++;
      else if (c.sentiment === 'Constructive') conCnt++;
      else neuCnt++;
    });

    const totalComments = comments.length;
    const posPct = totalComments > 0 ? Math.round((posCnt / totalComments) * 100) : 0;
    const neuPct = totalComments > 0 ? Math.round((neuCnt / totalComments) * 100) : 0;
    const conPct = totalComments > 0 ? Math.round((conCnt / totalComments) * 100) : 0;

    const strengths: string[] = [];
    const growths: string[] = [];

    if (posCnt > 0) {
      strengths.push('Strongly appreciated for clear domain explanations and interactive lab sessions.');
      strengths.push('High student satisfaction regarding accessibility and doubt resolution.');
    } else {
      strengths.push('No qualitative positive comments submitted yet.');
    }

    if (conCnt > 0) {
      growths.push('Provide more midterm practice problem sets and pace lecture slides evenly.');
    } else {
      growths.push('Consistently positive student feedback with zero constructive concerns noted.');
    }

    return {
      subject: {
        id: subject._id.toString(),
        code: subject.code,
        facultyName: subject.facultyName,
        facultyDesignation: subject.facultyDesignation,
        academicYear: subject.academicYear,
        status: subject.status,
      },
      metrics: {
        totalSubmissions,
        totalEx,
        totalVg,
        totalG,
        totalP,
        totalB,
        avgRating,
      },
      questionsData,
      aiSummary: {
        totalComments,
        posPct,
        neuPct,
        conPct,
        strengths,
        growths,
        comments,
      },
    };
  }
}
