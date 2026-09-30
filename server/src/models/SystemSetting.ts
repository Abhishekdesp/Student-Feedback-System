import { Schema, model, Document } from 'mongoose';

export interface ISystemSetting extends Document {
  key: string;
  value: any;
  createdAt: Date;
  updatedAt: Date;
}

const systemSettingSchema = new Schema<ISystemSetting>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const SystemSetting = model<ISystemSetting>('SystemSetting', systemSettingSchema);
