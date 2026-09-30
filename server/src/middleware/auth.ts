import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface JwtPayload {
  userId: string;
  username: string;
  role: 'admin' | 'teacher' | 'student';
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
      return;
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
    return;
  }
};

export const requireRole = (...allowedRoles: Array<'admin' | 'teacher' | 'student'>) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    // Role mapping: 'teacher' and 'admin' are equivalent in legacy functionality for admin pages, but check explicit role
    const userRole = req.user.role;
    const hasRole = allowedRoles.includes(userRole);

    if (!hasRole) {
      res.status(403).json({ success: false, message: `Access denied for role: ${userRole}` });
      return;
    }

    next();
  };
};
