import { Task } from '../models/Task.model.js';
import { ITask } from '../types/models.types.js';
import { ApiError } from '../utils/ApiError.js';
import { PROJECT_STATUS, TASK_STATUS } from '../config/constants.js';
import { projectService } from './project.service.js';
import { auditService } from './audit.service.js';
import mongoose from 'mongoose';

export const taskService = {
    async create(projectId: string, data: Partial<ITask>, requesterId: string): Promise<ITask> {
        // Validate project exists and is not archived
        const project = await projectService.findById(projectId);

        if (project.status === PROJECT_STATUS.ARCHIVED) {
            throw ApiError.forbidden('No se pueden agregar tareas a un proyecto archivado');
        }

        if (project.status === PROJECT_STATUS.FINISHED) {
            throw ApiError.forbidden('No se pueden agregar tareas a un proyecto finalizado');
        }

        const task = await Task.create({
            ...data,
            projectId,
            status: TASK_STATUS.PENDING
        });

        await auditService.log({ userId: requesterId, action: 'task:create', resource: 'Task', resourceId: task.id, details: { title: task.title, projectId } });
        return task;
    },

    async findByProject(projectId: string): Promise<ITask[]> {
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            throw ApiError.badRequest('ID de proyecto inválido');
        }

        return await Task.find({ projectId }).sort({ createdAt: 1 });
    },

    async findById(taskId: string): Promise<ITask> {
        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            throw ApiError.badRequest('ID de tarea inválido');
        }

        const task = await Task.findById(taskId);
        if (!task) {
            throw ApiError.notFound('Tarea no encontrada');
        }

        return task;
    },

    async update(taskId: string, data: Partial<ITask>, requesterId: string): Promise<ITask> {
        const task = await this.findById(taskId);

        if (task.status === TASK_STATUS.CONSENSUS) {
            throw ApiError.forbidden('No se puede modificar una tarea que ya alcanzó el consenso');
        }

        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            { $set: data },
            { new: true, runValidators: true }
        );

        await auditService.log({ userId: requesterId, action: 'task:update', resource: 'Task', resourceId: taskId, details: { updatedFields: Object.keys(data) } });
        return updatedTask as ITask;
    },

    async updateStatus(taskId: string, newStatus: string, requesterId: string, finalEstimate?: number): Promise<ITask> {
        const task = await this.findById(taskId);

        const updateData: any = { status: newStatus };
        if (finalEstimate !== undefined && newStatus === TASK_STATUS.CONSENSUS) {
            updateData.finalEstimate = finalEstimate;
        }

        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            { $set: updateData },
            { new: true }
        );

        await auditService.log({ userId: requesterId, action: 'task:status_change', resource: 'Task', resourceId: taskId, details: { oldStatus: task.status, newStatus } });
        return updatedTask as ITask;
    }
};
