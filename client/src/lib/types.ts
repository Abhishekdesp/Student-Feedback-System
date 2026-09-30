export interface User {
  id: string;
  username: string;
  role: 'admin' | 'teacher' | 'student';
  studentDetails?: {
    academicYear: 'First' | 'Second' | 'Third';
    isImported: boolean;
  };
}

export interface Subject {
  _id: string;
  code: string;
  facultyName: string;
  facultyDesignation: string;
  facultyEmail: string;
  facultyMobile: string;
  scheme: string;
  semester: string;
  academicYear: 'First' | 'Second' | 'Third';
  status: number;
}

export interface Question {
  _id: string;
  text: string;
  order: number;
  isActive: boolean;
}

export interface QuestionRatingData {
  questionId: string;
  questionText: string;
  excellent: number;
  veryGood: number;
  good: number;
  poor: number;
  bad: number;
}

export interface SubjectSummary {
  subject: {
    id: string;
    code: string;
    facultyName: string;
    facultyDesignation: string;
    academicYear: string;
    status: number;
  };
  metrics: {
    totalSubmissions: number;
    totalEx: number;
    totalVg: number;
    totalG: number;
    totalP: number;
    totalB: number;
    avgRating: number;
  };
  questionsData: QuestionRatingData[];
  aiSummary: {
    totalComments: number;
    posPct: number;
    neuPct: number;
    conPct: number;
    strengths: string[];
    growths: string[];
    comments: {
      id: string;
      comment: string;
      sentiment: 'Positive' | 'Neutral' | 'Constructive';
      score: number;
      createdAt: string;
    }[];
  };
}

export interface SubmitFeedbackPayload {
  subjectId: string;
  ratings: {
    questionId: string;
    rating: number;
  }[];
  userComment?: string;
}
