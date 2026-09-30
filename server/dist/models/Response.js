import { Schema, model } from 'mongoose';
const responseSchema = new Schema({
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
}, {
    timestamps: true,
});
// Compound index to ensure one submission per student per subject
responseSchema.index({ studentId: 1, subjectId: 1 }, { unique: true });
export const Response = model('Response', responseSchema);
