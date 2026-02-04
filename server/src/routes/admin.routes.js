import express from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import User from '../models/User.js';
import { createErrorResponse, createSuccessResponse } from '../utils/errors.js';
import { log as auditLog, getRequestMeta } from '../utils/audit.js';
import { hasAdminPrivileges, ROLES, isAdminRole } from '../utils/roleMapper.js';

const router = express.Router();

// Only SUPER_ADMIN and ADMIN (BOSS maps to ADMIN) can access admin routes
router.use(requireAuth);
// router.use(requireRole('SUPER_ADMIN', 'ADMIN', 'BOSS')); // BOSS included for backward compatibility

const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MEMBER', 'GUEST', 'BOSS']).optional(), // BOSS for backward compatibility
  editor: z.boolean().optional(),
  status: z.enum(['active', 'disabled', 'pending']).optional()
});

const updateUserSchema = z.object({
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MEMBER', 'GUEST', 'BOSS']).optional(), // BOSS for backward compatibility
  editor: z.boolean().optional(),
  status: z.enum(['active', 'disabled', 'pending']).optional()
});

// Get users with filtering and pagination
router.get('/users', async (req, res, next) => {
  try {
    const {
      search = '',
      role = '',
      status = '',
      page = '1',
      limit = '10'
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    if (status) {
      query.status = status;
    }

    // Execute query
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query)
    ]);

    // Format users
    const formattedUsers = users.map(user => ({
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      editor: user.editor,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));

    res.json(createSuccessResponse({
      users: formattedUsers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    }));
  } catch (error) {
    next(error);
  }
});

// Create user (admin only)
router.post('/users', async (req, res, next) => {
  try {
    const validatedData = createUserSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: validatedData.email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json(createErrorResponse(
        'USER_EXISTS',
        'User with this email already exists',
        400
      ));
    }

    // Only SUPER_ADMIN can create SUPER_ADMIN
    if (validatedData.role === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json(createErrorResponse(
        'INSUFFICIENT_PERMISSIONS',
        'Only SUPER_ADMIN can create SUPER_ADMIN users',
        403
      ));
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12).toUpperCase() + '!1';
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const user = new User({
      email: validatedData.email.toLowerCase(),
      passwordHash,
      name: validatedData.name,
      role: validatedData.role || 'MEMBER',
      editor: validatedData.editor || false,
      status: validatedData.status || 'pending'
    });

    await user.save();

    // Audit log
    await auditLog(req, 'USER_CREATE', 'USER', user._id.toString(), {
      ...getRequestMeta(req),
      createdUser: {
        email: user.email,
        name: user.name,
        role: user.role,
        editor: user.editor,
        status: user.status
      }
    });

    // Return user summary and temporary password
    res.status(201).json(createSuccessResponse({
      user: user.toSummary(),
      tempPassword // Return temp password for v1 local use
    }, 'User created successfully'));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(createErrorResponse(
        'VALIDATION_ERROR',
        error.errors[0]?.message || 'Validation error',
        400
      ));
    }
    if (error.code === 11000) {
      return res.status(400).json(createErrorResponse(
        'USER_EXISTS',
        'User with this email already exists',
        400
      ));
    }
    next(error);
  }
});

// Update user (admin only)
router.put('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = updateUserSchema.parse(req.body);

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json(createErrorResponse(
        'USER_NOT_FOUND',
        'User not found',
        404
      ));
    }

    // Map BOSS → ADMIN for updates
    if (validatedData.role === 'BOSS') {
      validatedData.role = 'ADMIN';
    }
    
    // Only SUPER_ADMIN can update SUPER_ADMIN
    if (user.role === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json(createErrorResponse(
        'INSUFFICIENT_PERMISSIONS',
        'Cannot modify SUPER_ADMIN user',
        403
      ));
    }

    // Only SUPER_ADMIN can assign SUPER_ADMIN role
    if (validatedData.role === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json(createErrorResponse(
        'INSUFFICIENT_PERMISSIONS',
        'Only SUPER_ADMIN can assign SUPER_ADMIN role',
        403
      ));
    }
    
    // Only SUPER_ADMIN or ADMIN can assign ADMIN role
    if (validatedData.role === 'ADMIN' && 
        req.user.role !== 'SUPER_ADMIN' && 
        !isAdminRole(req.user.role)) {
      return res.status(403).json(createErrorResponse(
        'INSUFFICIENT_PERMISSIONS',
        'Only SUPER_ADMIN or ADMIN can assign ADMIN role',
        403
      ));
    }

    // Prevent self-disabling
    if (validatedData.status === 'disabled' && user._id.toString() === req.user._id.toString()) {
      return res.status(400).json(createErrorResponse(
        'CANNOT_DISABLE_SELF',
        'Cannot disable your own account',
        400
      ));
    }

    // Store old values for audit
    const oldValues = {
      role: user.role,
      status: user.status,
      editor: user.editor
    };

    // Update fields
    if (validatedData.role !== undefined) user.role = validatedData.role;
    if (validatedData.status !== undefined) user.status = validatedData.status;
    if (validatedData.editor !== undefined) user.editor = validatedData.editor;

    await user.save();

    // Audit log
    await auditLog(req, 'USER_UPDATE', 'USER', user._id.toString(), {
      ...getRequestMeta(req),
      oldValues,
      newValues: {
        role: user.role,
        status: user.status,
        editor: user.editor
      },
      updatedUser: {
        email: user.email,
        name: user.name
      }
    });

    res.json(createSuccessResponse({
      user: user.toSummary()
    }, 'User updated successfully'));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(createErrorResponse(
        'VALIDATION_ERROR',
        error.errors[0]?.message || 'Validation error',
        400
      ));
    }
    next(error);
  }
});

// Reset user password (admin only)
router.post('/users/:id/reset-password', async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json(createErrorResponse(
        'USER_NOT_FOUND',
        'User not found',
        404
      ));
    }

    // Only SUPER_ADMIN can reset SUPER_ADMIN password
    if (user.role === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json(createErrorResponse(
        'INSUFFICIENT_PERMISSIONS',
        'Cannot reset SUPER_ADMIN password',
        403
      ));
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12).toUpperCase() + '!1';
    user.passwordHash = await bcrypt.hash(tempPassword, 10);
    await user.save();

    // Audit log
    await auditLog(req, 'USER_RESET_PASSWORD', 'USER', user._id.toString(), {
      ...getRequestMeta(req),
      resetUser: {
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

    res.json(createSuccessResponse({
      tempPassword // Return temp password for v1 local use
    }, 'Password reset successfully'));
  } catch (error) {
    next(error);
  }
});

export default router;

