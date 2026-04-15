import { Comment } from '../models/Comment.model.js';
import { Task } from '../models/Task.model.js';
import { Project } from '../models/Project.model.js';
import { IComment } from '../types/models.types.js';
import { auditService } from './audit.service.js';
import { ApiError } from '../utils/ApiError.js';
import { ROLES, TASK_STATUS } from '../config/constants.js';

export const discussionService = {
    async addComment(
        userId: string, 
        content: string, 
        isAnonymous: boolean, 
        taskId?: string, 
        roundId?: string,
        userRole?: string
    ): Promise<IComment> {
        if (!taskId) {
            throw ApiError.badRequest('La discusión debe estar asociada a una tarea');
        }

        const task = await Task.findById(taskId).select('projectId status');
        if (!task) {
            throw ApiError.notFound('Tarea no encontrada');
        }

        if (task.status === TASK_STATUS.FINALIZED) {
            throw ApiError.forbidden('No se puede participar en discusión de una tarea finalizada');
        }

        const project = await Project.findById(task.projectId).select('facilitatorId expertIds status');
        if (!project) {
            throw ApiError.notFound('Proyecto no encontrado para esta tarea');
        }

        const isAdmin = userRole === ROLES.ADMIN;
        const isFacilitator = String(project.facilitatorId) === userId;
        const isExpert = project.expertIds.some((expertId) => String(expertId) === userId);
        if (!isAdmin && !isFacilitator && !isExpert) {
            throw ApiError.forbidden('No tienes permiso para participar en esta discusión de proyecto');
        }

        const comment = await Comment.create({
            roundId,
            taskId,
            userId,
            userRole,
            content,
            isAnonymous
        });

        await auditService.log({ 
            userId, 
            action: 'comment:create', 
            resource: 'Comment', 
            resourceId: comment.id, 
            details: { taskId, roundId, isAnonymous } 
        });
        return comment;
    },

    async getCommentsByTask(taskId: string, userId: string, userRole?: string): Promise<any[]> {
        const task = await Task.findById(taskId).select('projectId');
        if (!task) {
            throw ApiError.notFound('Tarea no encontrada');
        }

        const project = await Project.findById(task.projectId).select('facilitatorId expertIds');
        if (!project) {
            throw ApiError.notFound('Proyecto no encontrado para esta tarea');
        }

        const isAdmin = userRole === ROLES.ADMIN;
        const isFacilitator = String(project.facilitatorId) === userId;
        const isExpert = project.expertIds.some((expertId) => String(expertId) === userId);
        if (!isAdmin && !isFacilitator && !isExpert) {
            throw ApiError.forbidden('No tienes permiso para ver esta discusión');
        }

        const comments = await Comment.find({ taskId }).populate('userId', 'name role').sort({ createdAt: 1 });
        return this.processComments(comments);
    },

    async getCommentsByRound(roundId: string): Promise<any[]> {
        const comments = await Comment.find({ roundId }).populate('userId', 'name role').sort({ createdAt: 1 });
        return this.processComments(comments);
    },

    processComments(comments: any[]): any[] {
        const roleToLabel = (role?: string): string => {
            if (role === ROLES.ADMIN || role === 'Administrator') return 'Administrador';
            if (role === ROLES.FACILITADOR || role === 'Facilitator') return 'Facilitador';
            return 'Experto';
        };

        return comments.map(c => {
            const doc = c.toObject();
            doc.id = String(doc._id || doc.id);
            doc.timestamp = doc.createdAt || doc.timestamp || new Date();
            
            // Map raw role to Spanish label
            const role = doc.userRole || (doc.userId as any)?.role || 'experto';
            const roleLabel = roleToLabel(role);
            doc.userClassification = roleLabel; // New field for clarity

            if (doc.isAnonymous) {
                doc.userRole = roleLabel;
                if (doc.userId) {
                    (doc.userId as any).name = roleLabel;
                    (doc.userId as any).email = undefined; // Mask email too
                }
            }
            return doc;
        });
    }
};
