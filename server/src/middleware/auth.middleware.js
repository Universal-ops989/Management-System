import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { createErrorResponse } from '../utils/errors.js';
import { hasAnyRole } from '../utils/roleMapper.js';

dotenv.config();

export const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json(createErrorResponse(
        'AUTH_REQUIRED',
        'Authentication required'
      ));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Fetch user from database to ensure they still exist and are active
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json(createErrorResponse(
        'USER_NOT_FOUND',
        'User not found'
      ));
    }
    
    if (user.status === 'disabled') {
      return res.status(403).json(createErrorResponse(
        'ACCOUNT_DISABLED',
        'Account is disabled'
      ));
    }
    
    // Attach full user object to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json(createErrorResponse(
        'INVALID_TOKEN',
        'Invalid token'
      ));
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json(createErrorResponse(
        'TOKEN_EXPIRED',
        'Token has expired'
      ));
    }
    return res.status(401).json(createErrorResponse(
      'AUTH_ERROR',
      'Authentication error'
    ));
  }
};

// Alias for backward compatibility
export const authenticate = requireAuth;

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(createErrorResponse(
        'AUTH_REQUIRED',
        'Authentication required'
      ));
    }
    
    // SUPER_ADMIN bypasses all role checks
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }
    
    // Use role mapper to check if user has any of the required roles
    // This automatically handles BOSS → ADMIN mapping
    if (!hasAnyRole(req.user, roles)) {
      // Also check direct role match for backward compatibility
      if (!roles.includes(req.user.role)) {
        return res.status(403).json(createErrorResponse(
          'INSUFFICIENT_PERMISSIONS',
          'Insufficient permissions'
        ));
      }
    }
    
    next();
  };
};

