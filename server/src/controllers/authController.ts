import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { AuthService } from '../services/authService.js';
import { CacheService } from '../services/cacheService.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { env } from '../config/env.js';

export const loginSchema = z.object({
  body: z.object({
    username: z.string({ required_error: 'Username is required' }).min(1, 'Username cannot be empty'),
    password: z.string({ required_error: 'Password is required' }).min(1, 'Password cannot be empty'),
    role: z.enum(['student', 'teacher', 'admin', 'auto']).optional(),
  }),
});

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, password, role } = req.body;
    const { token, user } = await AuthService.login({ username, password, role });

    res.cookie('token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.decode(token) as { exp?: number } | null;
        if (decoded?.exp) {
          const nowSeconds = Math.floor(Date.now() / 1000);
          const remainingSeconds = decoded.exp - nowSeconds;
          if (remainingSeconds > 0) {
            await CacheService.blacklistToken(token, remainingSeconds);
          }
        }
      } catch {
        // Non-fatal if token cannot be decoded
      }
    }
  } catch (error) {
    // Non-fatal if Redis blacklist fails
  }

  res.clearCookie('token', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
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
  } catch (error) {
    next(error);
  }
};
