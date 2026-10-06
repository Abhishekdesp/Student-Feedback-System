import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
export const requireAuth = (req, res, next) => {
    try {
        let token = req.cookies?.token;
        if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
            return;
        }
        const decoded = jwt.verify(token, env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
        return;
    }
};
export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
            return;
        }
        const userRole = req.user.role;
        const hasRole = allowedRoles.includes(userRole);
        if (!hasRole) {
            res.status(403).json({ success: false, message: `You do not have permission to access this resource` });
            return;
        }
        next();
    };
};
export const requireRole = authorizeRoles;
