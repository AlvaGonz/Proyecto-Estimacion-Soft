import { Task } from '../models/Task.model.js';
import { Round } from '../models/Round.model.js';
import { Project } from '../models/Project.model.js';
import { Estimation } from '../models/Estimation.model.js';
import { ITask, IProject } from '../types/models.types.js';
import { ROUND_STATUS } from '../config/constants.js';
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

        const project = await Project.findById(projectId);
        if (!project) {
            throw ApiError.notFound('Proyecto no encontrado');
        }

        const tasks = await Task.find({ projectId }).sort({ createdAt: 1 });
        
        // Enhance tasks with completion percentage
        const enhancedTasks = await Promise.all(tasks.map(async (task) => {
            const completionPercentage = await this.calculateCompletion(task, project);
            const taskObj = task.toJSON();
            return { ...taskObj, completionPercentage };
        }));

        return enhancedTasks as unknown as ITask[];
    },

    async calculateCompletion(task: ITask, project: IProject): Promise<number> {
        if (task.status === TASK_STATUS.CONSENSUS || task.status === TASK_STATUS.FINALIZED) {
            return 100;
        }

        const closedRoundsCount = await Round.countDocuments({ taskId: task._id, status: ROUND_STATUS.CLOSED });
        const openRound = await Round.findOne({ taskId: task._id, status: ROUND_STATUS.OPEN });

        let expertParticipationRatio = 1; // If no open round, current round is "done"
        if (openRound) {
            const estimationsCount = await Estimation.countDocuments({ roundId: openRound._id });
            const totalExperts = project.expertIds.length;
            expertParticipationRatio = totalExperts > 0 ? estimationsCount / totalExperts : 1;
        }

        const minRounds = Math.max(project.maxRounds || 1, 1);
        const roundProgressRatio = Math.min(closedRoundsCount / minRounds, 1);

        const completionPercentage = Math.round(((expertParticipationRatio + roundProgressRatio) / 2) * 100);
        return Math.min(100, completionPercentage);
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
        if (finalEstimate !== undefined && (newStatus === TASK_STATUS.CONSENSUS || newStatus === TASK_STATUS.FINALIZED)) {
            updateData.finalEstimate = finalEstimate;
        }

        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            { $set: updateData },
            { new: true }
        );

        await auditService.log({ userId: requesterId, action: 'task:status_change', resource: 'Task', resourceId: taskId, details: { oldStatus: task.status, newStatus } });
        return updatedTask as ITask;
    },

    async finalize(taskId: string, requesterId: string): Promise<ITask> {
        const task = await this.findById(taskId);
        
        // Ensure it has at least one round (open or closed)
        const roundCount = await Round.countDocuments({ taskId });
        if (roundCount === 0) {
            throw ApiError.badRequest('No se puede finalizar una tarea sin rondas');
        }

        if (task.status === TASK_STATUS.FINALIZED) {
            throw ApiError.conflict('La tarea ya está finalizada');
        }

        // We could calculate a default final estimate if not provided, 
        // e.g., the median of the last closed round, or 0 if none.
        let finalEstimate = task.finalEstimate;
        if (!finalEstimate) {
            const lastClosedRound = await Round.findOne({ taskId, status: ROUND_STATUS.CLOSED }).sort({ roundNumber: -1 });
            if (lastClosedRound?.stats) {
                finalEstimate = lastClosedRound.stats.median;
            }
        }

        return await this.updateStatus(taskId, TASK_STATUS.FINALIZED, requesterId, finalEstimate);
    }
};
