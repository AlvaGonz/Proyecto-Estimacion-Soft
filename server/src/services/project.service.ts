import { Project } from '../models/Project.model.js';
import { Round } from '../models/Round.model.js';
import { Task } from '../models/Task.model.js';
import { IProject } from '../types/models.types.js';
import { ApiError } from '../utils/ApiError.js';
import { PROJECT_STATUS, ROLES, Role } from '../config/constants.js';
import { auditService } from './audit.service.js';
import mongoose from 'mongoose';

export const projectService = {
    async create(data: Partial<IProject>, facilitatorId: string): Promise<IProject> {
        const project = await Project.create({
            ...data,
            facilitatorId,
            status: PROJECT_STATUS.ACTIVE
        });

        await auditService.log({ userId: facilitatorId, action: 'project:create', resource: 'Project', resourceId: project.id, details: { name: project.name } });
        return project;
    },

    async findAll(userId: string, role: Role): Promise<IProject[]> {
        const query: any = { isDeleted: { $ne: true } };

        // Data isolation based on role
        if (role === ROLES.FACILITADOR) {
            query.facilitatorId = userId;
        } else if (role === ROLES.EXPERTO) {
            query.expertIds = userId;
        }
        // Admin gets all projects, so no query restriction

        return await Project.find(query)
            .populate('facilitatorId', 'name email')
            .populate('expertIds', 'name email')
            .sort({ createdAt: -1 });
    },

    async findById(id: string): Promise<IProject> {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw ApiError.badRequest('ID de proyecto inválido');
        }

        const project = await Project.findOne({ _id: id, isDeleted: { $ne: true } })
            .populate('facilitatorId', 'name email')
            .populate('expertIds', 'name email')
            .populate('taskCount'); // Virtual field

        if (!project) {
            throw ApiError.notFound('Proyecto no encontrado');
        }

        // Add virtual-like property for UI
        const taskIds = await Task.find({ projectId: id }).distinct('_id');
        const count = await Round.countDocuments({ taskId: { $in: taskIds } });
        
        // We attach this to the document instance. 
        // Note: res.json() will include it if we don't use .toObject() or if we use { virtuals: true }
        (project as any).hasStartedRounds = count > 0;

        return project as any;
    },

    async update(id: string, data: Partial<IProject>, requesterId: string): Promise<IProject> {
        const project = await this.findById(id);

        if (project.status === PROJECT_STATUS.ARCHIVED) {
            throw ApiError.forbidden('No se puede modificar un proyecto archivado');
        }

        // RF034: Bloqueo de cambio de método tras inicio de rondas
        if (data.estimationMethod && data.estimationMethod !== (project.estimationMethod as any)) {
            const taskIds = await Task.find({ projectId: id }).distinct('_id');
            const roundsStarted = await Round.countDocuments({ taskId: { $in: taskIds } });
            if (roundsStarted > 0) {
                throw ApiError.badRequest('No se puede cambiar el método de estimación una vez iniciadas las rondas');
            }
        }

        const updatedProject = await Project.findByIdAndUpdate(
            id,
            { $set: data },
            { new: true, runValidators: true }
        )
            .populate('facilitatorId', 'name email')
            .populate('expertIds', 'name email');

        await auditService.log({ userId: requesterId, action: 'project:update', resource: 'Project', resourceId: id, details: { updatedFields: Object.keys(data) } });
        return updatedProject as IProject;
    },

    async archive(id: string, requesterId: string): Promise<IProject> {
        const project = await this.update(id, { status: PROJECT_STATUS.ARCHIVED as any }, requesterId);
        await auditService.log({ userId: requesterId, action: 'project:archive', resource: 'Project', resourceId: id });
        return project;
    },

    async manageExperts(id: string, action: 'add' | 'remove', expertIds: string[], requesterId: string): Promise<IProject> {
        const project = await this.findById(id);

        if (project.status === PROJECT_STATUS.ARCHIVED) {
            throw ApiError.forbidden('No se puede modificar un proyecto archivado');
        }

        const updateOp = action === 'add'
            ? { $addToSet: { expertIds: { $each: expertIds } } }
            : { $pullAll: { expertIds: expertIds } };

        const updatedProject = await Project.findByIdAndUpdate(
            id,
            updateOp,
            { new: true }
        )
            .populate('facilitatorId', 'name email')
            .populate('expertIds', 'name email');

        await auditService.log({ userId: requesterId, action: `project:experts_${action}`, resource: 'Project', resourceId: id, details: { expertIds } });
        return updatedProject as IProject;
    },

    async softDelete(id: string, requesterId: string): Promise<void> {
        const project = await Project.findById(id);
        if (!project) {
            throw ApiError.notFound('Proyecto no encontrado');
        }

        project.isDeleted = true;
        await project.save();

        await auditService.log({
            userId: requesterId,
            action: 'project:delete',
            resource: 'Project',
            resourceId: id,
            details: { name: project.name }
        });
    },

    async findAllAdmin(): Promise<IProject[]> {
        return await Project.find({})
            .populate('facilitatorId', 'name email')
            .populate('expertIds', 'name email')
            .sort({ createdAt: -1 });
    },

    async restore(id: string, requesterId: string): Promise<IProject> {
        const project = await Project.findByIdAndUpdate(
            id,
            { $set: { isDeleted: false } },
            { new: true }
        );
        if (!project) {
            throw ApiError.notFound('Proyecto no encontrado');
        }

        await auditService.log({
            userId: requesterId,
            action: 'project:restore',
            resource: 'Project',
            resourceId: id
        });
        return project as IProject;
    }
};
