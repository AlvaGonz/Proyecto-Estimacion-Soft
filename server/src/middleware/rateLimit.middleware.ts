import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

export const authRateLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    message: {
        success: false,
        message: 'Demasiadas solicitudes desde esta IP, intente más tarde',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
