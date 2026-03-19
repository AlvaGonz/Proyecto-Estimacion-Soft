import { Request, Response } from 'express';
import { projectService } from '../services/project.service.js';
import { taskService } from '../services/task.service.js';
import { auditService } from '../services/audit.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Role } from '../config/constants.js';

// ─── Proyectos ───────────────────────────────────────────────────────

export const createProject = asyncHandler(async (req: Request, res: Response) => {
    const facilitatorId = req.user?.id as string;
    const project = await projectService.create(req.body, facilitatorId);

    res.status(201).json({
        success: true,
        message: 'Proyecto creado exitosamente',
        data: project
    });
});

export const getProjects = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const role = req.user?.role as Role;
    const projects = await projectService.findAll(userId, role);

    res.json({
        success: true,
        data: projects
    });
});

export const getProjectById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const project = await projectService.findById(id);

    // TODO: Verify if the user has access to this specific project
    // Admin has access to all. Facilitator if is facilitatorId. Experto if in expertIds.

    res.json({
        success: true,
        data: project
    });
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const requesterId = req.user?.id as string;
    const project = await projectService.update(id, req.body, requesterId);

    res.json({
        success: true,
        message: 'Proyecto actualizado',
        data: project
    });
});

export const archiveProject = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const requesterId = req.user?.id as string;
    const project = await projectService.archive(id, requesterId);

    res.json({
        success: true,
        message: 'Proyecto archivado',
        data: project
    });
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const requesterId = req.user?.id as string;
    await projectService.softDelete(id, requesterId);

    res.json({
        success: true,
        message: 'Proyecto eliminado exitosamente'
    });
});

export const manageExperts = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { action, expertIds } = req.body;
    const requesterId = req.user?.id as string;

    const project = await projectService.manageExperts(id, action, expertIds, requesterId);

    res.json({
        success: true,
        message: action === 'add' ? 'Expertos añadidos' : 'Expertos removidos',
        data: project
    });
});

// ─── Tareas (Tasks nested inside Project) ──────────────────────────

export const createTask = asyncHandler(async (req: Request, res: Response) => {
    const { id: projectId } = req.params;
    const requesterId = req.user?.id as string;

    const task = await taskService.create(projectId, req.body, requesterId);

    res.status(201).json({
        success: true,
        message: 'Tarea creada exitosamente',
        data: task
    });
});

export const getTasksByProject = asyncHandler(async (req: Request, res: Response) => {
    const { id: projectId } = req.params;
    const tasks = await taskService.findByProject(projectId);

    res.json({
        success: true,
        data: tasks
    });
});

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
    const { tid } = req.params;
    const requesterId = req.user?.id as string;

    const task = await taskService.update(tid, req.body, requesterId);

    res.json({
        success: true,
        message: 'Tarea modificada',
        data: task
    });
});

export const getProjectAuditLogs = asyncHandler(async (req: Request, res: Response) => {
    const { id: projectId } = req.params;
    const logs = await auditService.findByProject(projectId);

    res.json({
        success: true,
        data: logs
    });
});

