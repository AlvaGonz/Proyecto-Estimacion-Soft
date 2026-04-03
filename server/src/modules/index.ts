import { Router, Request, Response } from 'express';
import authRoutes from './auth/auth.routes.js';
import userRoutes from './users/user.routes.js';
import projectRoutes from './projects/project.routes.js';
import roundRoutes from './rounds/round.routes.js';
import estimationRoutes from './estimations/estimation.routes.js';
import { nestedRoundRoutes } from './rounds/round.routes.js';
import { nestedEstimationRoutes } from './estimations/estimation.routes.js';
import { nestedDiscussionRoutes } from './discussion/discussion.routes.js';
import { getUsers, createUser, updateUser, deactivateUser } from './users/user.controller.js';
import { getProjects, restoreProject } from './projects/project.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole, requirePermission } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createUserByAdminSchema, updateUserByAdminSchema } from '../types/api.types.js';
import { ROLES, PERMISSIONS } from '../config/constants.js';

const router = Router();

// ─── ADMIN ROUTES (compatibility mapping) ───────────────────────────
const adminRouter = Router();
adminRouter.use(authenticate, requireRole(ROLES.ADMIN));

// Admin User Management
adminRouter.get('/users', requirePermission(PERMISSIONS.MANAGE_USERS), getUsers);
adminRouter.post('/users', requirePermission(PERMISSIONS.MANAGE_USERS), validate(createUserByAdminSchema), createUser);
adminRouter.patch('/users/:id', requirePermission(PERMISSIONS.MANAGE_USERS), validate(updateUserByAdminSchema), updateUser);
adminRouter.patch('/users/:id/deactivate', requirePermission(PERMISSIONS.MANAGE_USERS), deactivateUser);

// Admin Project Management
adminRouter.get('/projects', getProjects);
adminRouter.patch('/projects/:id/restore', restoreProject);

// ─── MODULAR ROUTES ────────────────────────────────────────────────
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/rounds', roundRoutes);
router.use('/estimations', estimationRoutes);
router.use('/admin', adminRouter); // Map backward-compatible admin routes

// Nested routes (maintaining API consistency)
projectRoutes.use('/:pid/rounds', nestedRoundRoutes);
roundRoutes.use('/:id/estimations', nestedEstimationRoutes);
roundRoutes.use('/:id/comments', nestedDiscussionRoutes);

// ─── UTILS ───────────────────────────────────────────────────────
router.get('/health', (_req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'EstimaPro API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});

export default router;
