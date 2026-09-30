import { Schema, model, Document } from 'mongoose';

export interface IQuestion extends Document {
  text: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Question = model<IQuestion>('Question', questionSchema);
