import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';

const app: Application = express();

// 1. Security headers
app.use(helmet());

// 2. CORS — allow cookies cross-origin
app.use(cors({
    origin: env.ALLOWED_ORIGINS,
    credentials: true,
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
