import { z } from 'zod';
import { AuthService } from '../services/authService.js';
import { env } from '../config/env.js';
export const loginSchema = z.object({
    body: z.object({
        username: z.string({ required_error: 'Username is required' }).min(1, 'Username cannot be empty'),
        password: z.string({ required_error: 'Password is required' }).min(1, 'Password cannot be empty'),
        role: z.enum(['student', 'teacher', 'admin', 'auto']).optional(),
    }),
});
export const login = async (req, res, next) => {
    try {
        const { username, password, role } = req.body;
        const { token, user } = await AuthService.login({ username, password, role });
        res.cookie('token', token, {
            httpOnly: true,
            secure: env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        });
        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user,
        });
    }
    catch (error) {
        next(error);
    }
};
export const logout = async (_req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
    });
    res.status(200).json({
        success: true,
        message: 'Logged out successfully',
    });
};
export const getMe = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }
        const user = await AuthService.getCurrentUser(req.user.userId);
        res.status(200).json({
            success: true,
            user,
        });
    }
    catch (error) {
        next(error);
    }
};
