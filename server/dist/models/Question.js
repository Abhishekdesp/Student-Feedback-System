import { Schema, model } from 'mongoose';
const questionSchema = new Schema({
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
}, {
    timestamps: true,
});
export const Question = model('Question', questionSchema);
