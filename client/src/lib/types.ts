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

export interface TeacherDashboardStats {
  overallRating: number;
  totalResponses: number;
  totalStudents: number;
  responseRate: number;
  assignedSubjectsCount: number;
  activeSurveysCount: number;
}

export interface TeacherSubjectItem {
  id: string;
  code: string;
  facultyName: string;
  facultyDesignation: string;
  facultyEmail: string;
  scheme: string;
  semester: string;
  academicYear: 'First' | 'Second' | 'Third';
  status: number;
  totalStudents: number;
  responseCount: number;
  responseRate: number;
  averageRating: number;
}

export interface TeacherQuestionRating {
  questionId: string;
  questionText: string;
  avgRating: number;
  responsesCount: number;
  distribution: { 5: number; 4: number; 3: number; 2: number; 1: number };
  isHighestRated?: boolean;
  isLowestRated?: boolean;
}

export interface TeacherSubjectAnalytics {
  subject: {
    id: string;
    code: string;
    facultyName: string;
    facultyDesignation: string;
    facultyEmail: string;
    scheme: string;
    semester: string;
    academicYear: string;
    status: number;
  };
  overallRating: number;
  totalResponses: number;
  totalStudents: number;
  responseRate: number;
  ratingDistribution: { stars: number; count: number; percentage: number }[];
  questionWise: TeacherQuestionRating[];
  highestRatedQuestion: TeacherQuestionRating | null;
  lowestRatedQuestion: TeacherQuestionRating | null;
  sentimentDistribution: {
    positiveCount: number;
    neutralCount: number;
    constructiveCount: number;
    positivePct: number;
    neutralPct: number;
    constructivePct: number;
  };
  aiInsights: {
    isAiGenerated: boolean;
    disclaimer: string;
    strengths: string[];
    areasForImprovement: string[];
  };
}

export interface TeacherAnonymousComment {
  id: string;
  userComment: string;
  sentiment: {
    label: 'Positive' | 'Neutral' | 'Constructive';
    score: number;
    engine: string;
  };
  submittedAt: string;
}

export interface TeacherTrendItem {
  subjectCode: string;
  academicYear: string;
  semester: string;
  periodLabel: string;
  avgRating: number;
  totalResponses: number;
  responseRate: number;
}
