import { Schema, model } from 'mongoose';
const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true,
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
}, {
    timestamps: true,
});
export const User = model('User', userSchema);
