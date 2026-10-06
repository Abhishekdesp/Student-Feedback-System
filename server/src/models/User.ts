import { Schema, model, Document } from 'mongoose';

export interface IStudentDetails {
  academicYear: 'First' | 'Second' | 'Third';
  isImported: boolean;
}

export interface IUser extends Document {
  username: string;
  email?: string;
  passwordHash: string;
  role: 'admin' | 'teacher' | 'student';
  studentDetails?: IStudentDetails;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'teacher', 'student'],
      required: true,
    },
    studentDetails: {
      academicYear: {
        type: String,
        enum: ['First', 'Second', 'Third'],
      },
      isImported: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

export const User = model<IUser>('User', userSchema);
