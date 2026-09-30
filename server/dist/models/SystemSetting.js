import { Schema, model } from 'mongoose';
const systemSettingSchema = new Schema({
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
}, {
    timestamps: true,
});
export const SystemSetting = model('SystemSetting', systemSettingSchema);
