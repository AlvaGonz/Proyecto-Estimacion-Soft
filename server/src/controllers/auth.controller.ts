import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authService } from '../services/auth.service.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { RegisterDTO, LoginDTO } from '../types/api.types.js';

const REFRESH_TOKEN_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
};

const ACCESS_TOKEN_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: '/',
};

export const register = asyncHandler(async (req: Request, res: Response) => {
    const data: RegisterDTO = req.body;
    const result = await authService.register(data);

    // Set tokens as httpOnly cookies
    res.cookie('refreshToken', result.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
    res.cookie('accessToken', result.accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);

    res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
            user: result.user,
            accessToken: result.accessToken,
        },
    });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const data: LoginDTO = req.body;
    const result = await authService.login(data);

    // Set tokens as httpOnly cookies
    res.cookie('refreshToken', result.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
    res.cookie('accessToken', result.accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);

    res.json({
        success: true,
        message: 'Inicio de sesión exitoso',
        data: {
            user: result.user,
            accessToken: result.accessToken,
        },
    });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
        throw ApiError.unauthorized('No se proporcionó refresh token');
    }

    const result = await authService.refreshToken(refreshToken);

    res.cookie('accessToken', result.accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);

    res.json({
        success: true,
        data: result,
    });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
    // Clear the httpOnly cookies regardless of auth status
    res.clearCookie('accessToken', {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        path: '/',
    });
    
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        path: '/',
    });

    // Only attempt DB invalidation if we have a user
    if (req.user) {
        await authService.logout(req.user.id).catch(err => {
            console.error('[Logout] Failed to invalidate session in DB:', err.message);
        });
    }

    res.json({
        success: true,
        message: 'Sesión cerrada exitosamente',
    });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
        throw ApiError.unauthorized('No autenticado');
    }

    res.json({
        success: true,
        data: req.user,
    });
});
