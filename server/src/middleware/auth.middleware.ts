import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { tokenService } from '../services/token.service.js';
import { User } from '../models/index.js';

export const authenticate = asyncHandler(
    async (req: Request, _res: Response, next: NextFunction) => {
        // Extract token: prefer cookie, fallback to Authorization header
        const token =
            req.cookies?.accessToken ||
            (req.headers.authorization?.startsWith('Bearer ')
                ? req.headers.authorization.split(' ')[1]
                : undefined);

        if (!token) {
            throw ApiError.unauthorized('Token de acceso no proporcionado');
        }

        // Verify token — throws ApiError on failure
        const payload = tokenService.verifyAccessToken(token);

        // Verify user still exists and is active
        const user = await User.findById(payload.id);
        if (!user) {
            throw ApiError.unauthorized('Usuario no encontrado');
        }
        if (!user.isActive) {
            throw ApiError.forbidden('Cuenta desactivada');
        }

        // Attach user info to request
        req.user = {
            id: user.id as string,
            email: user.email,
            role: user.role,
        };

        next();
    }
);
