import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);

// Health check endpoint
router.get('/health', (_req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString(),
    });
});

export default router;
