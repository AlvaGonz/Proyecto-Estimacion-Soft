import { Router } from 'express';
import { register, login, refresh, logout, getMe } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { registerSchema, loginSchema } from '../types/api.types.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

// POST /api/auth/register — Register new user (rate limited + validated)
router.post(
    '/register',
    authRateLimiter,
    validate(registerSchema),
    register
);

// POST /api/auth/login — Login user (rate limited + validated)
router.post(
    '/login',
    authRateLimiter,
    validate(loginSchema),
    login
);

// POST /api/auth/refresh — Refresh access token (uses httpOnly cookie, no rate limit)
router.post('/refresh', refresh);

// POST /api/auth/logout — Logout (requires clear regardless of auth status)
router.post('/logout', logout);

// GET /api/auth/me — Get current authenticated user
router.get('/me', authenticate, getMe);

export default router;
