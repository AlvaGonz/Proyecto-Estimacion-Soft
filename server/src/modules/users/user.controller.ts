import { Request, Response } from 'express';
import { userService } from './user.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const role = req.query.role as string | undefined;
    const isActiveParam = req.query.isActive as string | undefined;
    const isActive = isActiveParam !== undefined ? isActiveParam === 'true' : undefined;

    const result = await userService.listUsers({ role, isActive, page, limit });
    res.json({ success: true, data: result });
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.createUser(req.body, req.user!.id);
    res.status(201).json({ success: true, data: user });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.updateUser(req.params.id, req.body, req.user!.id);
    res.json({ success: true, data: user });
});

export const deactivateUser = asyncHandler(async (req: Request, res: Response) => {
    await userService.deactivateUser(req.params.id, req.user!.id);
    res.json({ success: true, message: 'Usuario desactivado exitosamente' });
});
