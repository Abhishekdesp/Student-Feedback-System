import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
export class AuthService {
    static async login(input) {
        const { username, password, role } = input;
        if (!username || !password) {
            throw new AppError('Please enter both username and password.', 400);
        }
        // Case-insensitive user lookup
        const user = await User.findOne({
            username: { $regex: new RegExp(`^${username.trim()}$`, 'i') },
        });
        if (!user) {
            throw new AppError('Invalid credentials! Please check your username and password.', 401);
        }
        // If role hint provided and not auto/any, verify user matches role (teacher & admin are treated as staff)
        if (role && role !== 'auto') {
            if (role === 'student' && user.role !== 'student') {
                throw new AppError('Invalid credentials for student login.', 401);
            }
            if ((role === 'teacher' || role === 'admin') && user.role !== 'teacher' && user.role !== 'admin') {
                throw new AppError('Invalid credentials for teacher/admin login.', 401);
            }
        }
        const isMatch = await bcrypt.compare(password.trim(), user.passwordHash);
        if (!isMatch) {
            throw new AppError('Invalid credentials! Please check your username and password.', 401);
        }
        const token = jwt.sign({
            userId: user._id.toString(),
            username: user.username,
            role: user.role,
        }, env.JWT_SECRET, { expiresIn: '1d' });
        return {
            token,
            user: {
                id: user._id.toString(),
                username: user.username,
                role: user.role,
                studentDetails: user.studentDetails,
            },
        };
    }
    static async getCurrentUser(userId) {
        const user = await User.findById(userId).select('-passwordHash');
        if (!user) {
            throw new AppError('User not found.', 444);
        }
        return {
            id: user._id.toString(),
            username: user.username,
            role: user.role,
            studentDetails: user.studentDetails,
        };
    }
}
