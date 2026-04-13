import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { adminService } from '../services/admin.service.js';
import { projectService } from '../services/project.service.js';

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const role = req.query.role as string | undefined;
    const isActiveParam = req.query.isActive as string | undefined;
    const isActive = isActiveParam !== undefined ? isActiveParam === 'true' : undefined;

    const result = await adminService.listUsers({ role, isActive, page, limit });
    res.json({ success: true, data: result });
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await adminService.createUser(req.body, req.user!.id);
    res.status(201).json({ success: true, data: user });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await adminService.updateUser(req.params.id, req.body, req.user!.id);
    res.json({ success: true, data: user });
});

export const deactivateUser = asyncHandler(async (req: Request, res: Response) => {
    await adminService.deactivateUser(req.params.id, req.user!.id);
    res.json({ success: true, message: 'Usuario desactivado exitosamente' });
});

export const activateUser = asyncHandler(async (req: Request, res: Response) => {
    await adminService.activateUser(req.params.id, req.user!.id);
    res.json({ success: true, message: 'Usuario activado exitosamente' });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
    await adminService.deleteUser(req.params.id, req.user!.id);
    res.json({ success: true, message: 'Usuario eliminado permanentemente' });
});

export const getProjects = asyncHandler(async (req: Request, res: Response) => {
    const projects = await projectService.findAllAdmin();
    res.json({ success: true, data: projects });
});

export const restoreProject = asyncHandler(async (req: Request, res: Response) => {
    const project = await projectService.restore(req.params.id, req.user!.id);
    res.json({ success: true, data: project, message: 'Proyecto restaurado exitosamente' });
});
