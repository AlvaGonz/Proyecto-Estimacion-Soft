import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

export const authRateLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.NODE_ENV === 'test' ? 1000 : env.RATE_LIMIT_MAX_REQUESTS,
    skip: () => env.NODE_ENV === 'test' || process.env.SKIP_RATE_LIMIT === 'true',
    message: {
        success: false,
        message: 'Demasiadas solicitudes desde esta IP, intente más tarde',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
