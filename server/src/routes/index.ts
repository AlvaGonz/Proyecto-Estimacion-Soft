import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import projectRoutes from './project.routes.js';
import roundRoutes, { nestedRoundRoutes } from './round.routes.js';
import estimationRoutes, { nestedEstimationRoutes } from './estimation.routes.js';
import { nestedDiscussionRoutes } from './discussion.routes.js';

const router = Router();

// Base routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/rounds', roundRoutes);
router.use('/estimations', estimationRoutes);

// Nested routes
projectRoutes.use('/:pid/rounds', nestedRoundRoutes);
roundRoutes.use('/:id/estimations', nestedEstimationRoutes);
roundRoutes.use('/:id/comments', nestedDiscussionRoutes);

// Health check endpoint
router.get('/health', (_req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString(),
    });
});

export default router;
