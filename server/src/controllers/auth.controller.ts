import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthService } from '../services/auth.service.js';
import { RegisterDTO, LoginDTO } from '../types/api.types.js';

const authService = new AuthService();

export const register = asyncHandler(async (req: Request, res: Response) => {
    const data: RegisterDTO = req.body;
    const result = await authService.register(data);

    // TODO: Set refresh token as httpOnly cookie
    // res.cookie('refreshToken', result.refreshToken, {
    //   httpOnly: true,
    //   secure: env.NODE_ENV === 'production',
    //   sameSite: 'strict',
    //   maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    // });

    res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: result,
    });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const data: LoginDTO = req.body;
    const result = await authService.login(data);

    // TODO: Set refresh token as httpOnly cookie

    res.json({
        success: true,
        message: 'Inicio de sesión exitoso',
        data: result,
    });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
    // TODO: Extract refresh token from httpOnly cookies
    const refreshToken = req.cookies?.refreshToken || 'stub-token';
    const result = await authService.refreshToken(refreshToken);

    res.json({
        success: true,
        data: result,
    });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id || 'stub-user-id';
    await authService.logout(userId);

    // TODO: Clear refresh token cookie
    // res.clearCookie('refreshToken');

    res.json({
        success: true,
        message: 'Sesión cerrada exitosamente',
    });
});
