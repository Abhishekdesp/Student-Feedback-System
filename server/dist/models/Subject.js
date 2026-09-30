import { Schema, model } from 'mongoose';
const subjectSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        index: true,
        uppercase: true,
        trim: true,
    },
    facultyName: {
        type: String,
        required: true,
        trim: true,
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
}, {
    timestamps: true,
});
export const Subject = model('Subject', subjectSchema);
