import { Router } from 'express';
import { register, login, refresh, logout } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { registerSchema, loginSchema } from '../types/api.types.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

// POST /api/auth/register — Register new user
router.post(
    '/register',
    authRateLimiter,
    validate(registerSchema),
    register
);

// POST /api/auth/login — Login user
router.post(
    '/login',
    authRateLimiter,
    validate(loginSchema),
    login
);

// POST /api/auth/refresh — Refresh access token
router.post('/refresh', refresh);

// POST /api/auth/logout — Logout (requires auth)
router.post('/logout', authenticate, logout);

export default router;
