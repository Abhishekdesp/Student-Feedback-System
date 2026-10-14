import { Schema, model, Document, Types } from 'mongoose';

export interface ISubject extends Document {
  code: string;
  facultyName: string;
  facultyDesignation: string;
  facultyEmail: string;
  facultyMobile: string;
  teacherId?: Types.ObjectId;
  scheme: string;
  semester: string;
  academicYear: 'First' | 'Second' | 'Third';
  status: number; // 1 = Active / Survey Open, 0 = Inactive
  createdAt: Date;
  updatedAt: Date;
}

const subjectSchema = new Schema<ISubject>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      trim: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    facultyName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    facultyDesignation: {
      type: String,
      required: true,
      trim: true,
    },
    facultyEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    facultyMobile: {
      type: String,
      required: true,
      trim: true,
    },
    scheme: {
      type: String,
      required: true,
      trim: true,
    },
    semester: {
      type: String,
      required: true,
      trim: true,
    },
    academicYear: {
      type: String,
      enum: ['First', 'Second', 'Third'],
      required: true,
    },
    status: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

export const Subject = model<ISubject>('Subject', subjectSchema);
