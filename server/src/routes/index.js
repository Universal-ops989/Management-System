import express from 'express';
import rateLimit from 'express-rate-limit';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import adminRoutes from './admin.routes.js';
import databaseRoutes from './database.routes.js';
import auditRoutes from './audit.routes.js';
import fileRoutes from './file.routes.js';
import jobProfileRoutes from './jobProfileRoutes.js';
import freelancerRoutes from './freelancerRoutes.js';
import personalProfileRoutes from './personalProfileRoutes.js';
import jobTicketRoutes from './jobTicket.routes.js';
import calendarRoutes from './calendar.routes.js';
import interviewBoardRoutes from './interviewBoardRoutes.js';
import interviewStageRoutes from './interviewStageRoutes.js';
// import interviewTicketRoutes from './interviewTicket.routes.js';
import interviewTicketRoutes from './interviewTicketRoutes.js';
import assignmentRoutes from './assignmentRoutes.js';
import financeRoutes from './finance.routes.js';
import projectRoutes from './project.routes.js';
import taskRoutes from './task.routes.js';
import uploadRoutes from './upload.routes.js';

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 55, // limit each IP to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      ok: false,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later.'
    });
  }
});

// API Routes
router.use('/auth', authLimiter, authRoutes);
router.use('/', userRoutes); // /me routes
router.use('/admin', adminRoutes); // Admin routes
router.use('/admin/database', databaseRoutes); // Database backup/restore routes
router.use('/', auditRoutes); // Audit logs routes
router.use('/files', fileRoutes); // File upload/download routes
router.use('/job-profiles', jobProfileRoutes); // Job profile routes
router.use('/freelancer-profiles', freelancerRoutes); // Freelancer account routes
router.use('/personal-profiles', personalProfileRoutes); // Personal profile routes (self-only)
router.use('/job-tickets', jobTicketRoutes); // Job ticket routes
// router.use('/interviews', interviewRoutes); // Interview routes
router.use('/calendar', calendarRoutes); // Calendar routes (/calendar/interviews)
// Interview Routine System (PRD v3.0) - Kanban boards
router.use('/interview-boards', interviewBoardRoutes);
router.use('/assignments', assignmentRoutes); // Assignment routes
router.use('/interview-boards/:boardId/stages', interviewStageRoutes);
router.use('/interview-boards/:boardId/tickets', interviewTicketRoutes);
router.use('/finance', financeRoutes); // Finance routes
router.use('/projects', projectRoutes); // Project routes
router.use('/projects', taskRoutes); // Task routes (nested under /projects/:projectId/tasks)
router.use('/upload', uploadRoutes); // Legacy upload routes (kept for backward compatibility)

export default router;

