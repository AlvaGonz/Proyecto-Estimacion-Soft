import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    let error = err;

    if (!(error instanceof ApiError)) {
        const statusCode = 500;
        const message = error.message || 'Error interno del servidor';
        // (B-010): Pass original stack to avoid losing trace
        error = new ApiError(statusCode, message, false, err.stack);
    }

    const apiError = error as ApiError;

    const response: Record<string, unknown> = {
        success: false,
        message: apiError.message,
    };

    // Include stack trace only in development
    if (env.NODE_ENV === 'development') {
        response.stack = apiError.stack;
    }

    res.status(apiError.statusCode).json(response);
};
