import { Schema, model, Document, Types } from 'mongoose';

export interface IRating {
  questionId: Types.ObjectId;
  rating: 1 | 2 | 3 | 4 | 5;
}

export interface ISentiment {
  label: 'Positive' | 'Neutral' | 'Constructive';
  score: number;
  engine: string;
}

export interface IResponse extends Document {
  subjectId: Types.ObjectId;
  subjectCode: string;
  studentId: Types.ObjectId;
  ratings: IRating[];
  userComment?: string;
  sentiment?: ISentiment;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const responseSchema = new Schema<IResponse>(
  {
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    subjectCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ratings: [
      {
        questionId: {
          type: Schema.Types.ObjectId,
          ref: 'Question',
          required: true,
        },
        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
      },
    ],
    userComment: {
      type: String,
      trim: true,
    },
    sentiment: {
      label: {
        type: String,
        enum: ['Positive', 'Neutral', 'Constructive'],
      },
      score: {
        type: Number,
      },
      engine: {
        type: String,
      },
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one submission per student per subject
responseSchema.index({ studentId: 1, subjectId: 1 }, { unique: true });
responseSchema.index({ subjectId: 1, submittedAt: -1 });

export const Response = model<IResponse>('Response', responseSchema);
