import express from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.middleware.js';
import User from '../models/User.js';
import { createErrorResponse, createSuccessResponse } from '../utils/errors.js';

const router = express.Router();

const updateMeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long')
});

// Get current user
router.get('/me', requireAuth, async (req, res) => {
  res.json(createSuccessResponse({
    user: req.user.toSummary()
  }));
});

// Update current user (name only)
router.put('/me', requireAuth, async (req, res, next) => {
  try {
    const validatedData = updateMeSchema.parse(req.body);
    
    req.user.name = validatedData.name;
    await req.user.save();
    
    res.json(createSuccessResponse({
      user: req.user.toSummary()
    }, 'Profile updated successfully'));
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

export default router;

