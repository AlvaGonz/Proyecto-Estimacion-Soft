import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authenticate = asyncHandler(
    async (req: Request, _res: Response, next: NextFunction) => {
        // TODO: Extract JWT from cookies or Authorization header
        // const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];
        // if (!token) throw ApiError.unauthorized('Token no proporcionado');

        // TODO: Verify token with JWT_ACCESS_SECRET
        // const decoded = tokenService.verifyAccessToken(token);

        // TODO: Check if user exists and is active in database
        // const user = await User.findById(decoded.id);
        // if (!user || !user.isActive) throw ApiError.unauthorized('Usuario no válido');

        // STUB: Simulate authenticated user for scaffolding
        req.user = {
            id: 'stub-user-id',
            email: 'test@example.com',
            role: 'facilitador',
        };
        next();
    }
);
