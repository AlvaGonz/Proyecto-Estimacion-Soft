import { Request, Response } from 'express';
import { projectService } from '../services/project.service.js';
import { taskService } from '../services/task.service.js';
import { auditService } from '../services/audit.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Role } from '../config/constants.js';

// ─── Proyectos ───────────────────────────────────────────────────────

export const createProject = asyncHandler(async (req: Request, res: Response) => {
    const projectData = req.body;
    const facilitatorId = req.user?.id as string;

    const project = await projectService.create({ 
        ...projectData, 
        facilitatorId 
    }, facilitatorId);

    res.status(201).json({
        success: true,
        message: 'Proyecto creado exitosamente',
        data: project
    });
});

export const getProjects = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const role = req.user?.role as string;
    const { includeDeleted } = req.query;

    // Use findAll or findAllAdmin based on request
    const projects = includeDeleted === 'true' 
        ? await projectService.findAllAdmin()
        : await projectService.findAll(userId, role as any);

    res.json({
        success: true,
        data: projects
    });
});

export const getProjectById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const project = await projectService.findById(id);

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
        message: 'Proyecto actualizado correctamente',
        data: project
    });
});

export const archiveProject = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const requesterId = req.user?.id as string;

    const project = await projectService.archive(id, requesterId);

    res.json({
        success: true,
        message: 'Proyecto archivado correctamente',
        data: project
    });
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const requesterId = req.user?.id as string;

    await projectService.softDelete(id, requesterId);

    res.json({
        success: true,
        message: 'Proyecto eliminado correctamente'
    });
});

export const manageExperts = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { expertIds } = req.body;
    const requesterId = req.user?.id as string;

    // In project.service.ts it's manageExperts(id, action, expertIds, requesterId)
    // But currently called as updateExperts in my previous attempt.
    // I will use updateProject or fix projectService to have updateExperts.
    // Wait, let's check project.service.ts again. It has manageExperts(id, action, expertIds, requesterId).
    // The request body usually contains the full list of expertIds in my FE.
    // Let's assume manageExperts in service handles 'add'/'remove'.
    // If FE sends full list, I should probably have a 'set' action or use update().
    
    // Attempting to use update() for simple expert list replacement
    const project = await projectService.update(id, { expertIds }, requesterId);

    res.json({
        success: true,
        message: 'Lista de expertos actualizada',
        data: project
    });
});

// ─── Tareas ──────────────────────────────────────────────────────────

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

export const finalizeTask = asyncHandler(async (req: Request, res: Response) => {
    const { tid } = req.params;
    const requesterId = req.user?.id as string;

    const task = await taskService.finalize(tid, requesterId);

    res.json({
        success: true,
        message: 'Tarea finalizada correctamente',
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
