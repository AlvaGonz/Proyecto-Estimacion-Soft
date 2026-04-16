import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { env } from './config/env.js';
import routes from './modules/index.js';
import { errorHandler } from './middleware/error.middleware.js';

const app: Application = express();

// 1. (SC001): Explicit security headers via Helmet
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"], // Add needed external CDNs here
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.groq.com"]
        }
    },
    xContentTypeOptions: true, // (nosniff)
    referrerPolicy: { policy: 'same-origin' }
}));

// 2. (B-011): Precise CORS — allow cookies cross-origin but only for known domains
app.use(cors({
    origin: (origin, callback) => {
        // If origin matches one in env list, allow it
        if (!origin || env.ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`[CORS] Blocked request from: ${origin}`);
            callback(null, false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Cookie parser — required for httpOnly refresh token cookies
app.use(cookieParser());

// 4. Body parsing with size limits to prevent JSON bomb attacks
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

// 5. Static files (uploads folder)
const uploadDir = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadDir));

// 6. API routes
app.use('/api', routes);

// 6. 404 handler for unmatched routes
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
    });
});

// 7. Global error handler — MUST be registered last
app.use(errorHandler);

export default app;
