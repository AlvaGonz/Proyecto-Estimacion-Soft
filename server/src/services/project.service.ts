import { Project } from '../models/Project.model.js';
import { Round } from '../models/Round.model.js';
import { Task } from '../models/Task.model.js';
import { User } from '../models/User.model.js';
import { IProject } from '../types/models.types.js';
import { ApiError } from '../utils/ApiError.js';
import { PROJECT_STATUS, ROLES, Role } from '../config/constants.js';
import { auditService } from './audit.service.js';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';

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

        // Calculate hasStartedRounds manually for the UI
        const taskIds = await Task.find({ projectId: id }).distinct('_id');
        const count = await Round.countDocuments({ taskId: { $in: taskIds } });
        
        const projectObj = project.toObject() as IProject;
        (projectObj as any).hasStartedRounds = count > 0;

        return projectObj;
    },

    async update(id: string, data: Partial<IProject>, requesterId: string, requesterName?: string, requesterRole?: string): Promise<IProject> {
        const project = await this.findById(id);

        if (project.status === PROJECT_STATUS.ARCHIVED) {
            throw ApiError.forbidden('No se puede modificar un proyecto archivado');
        }

        if (project.status === PROJECT_STATUS.FINISHED) {
            throw ApiError.forbidden('No se puede modificar un proyecto finalizado');
        }

        // RF034: Bloqueo de cambio de método tras inicio de rondas
        if (data.estimationMethod && data.estimationMethod !== (project.estimationMethod as any)) {
            const taskIds = await Task.find({ projectId: id }).distinct('_id');
            const roundsStarted = await Round.countDocuments({ taskId: { $in: taskIds } });
            if (roundsStarted > 0) {
                throw ApiError.badRequest('No se puede cambiar el método de estimación una vez iniciadas las rondas');
            }
        }

        const facilitatorInProject = project.facilitatorId as any;
        const previousFacilitatorId = String(facilitatorInProject?._id || facilitatorInProject || '');
        const previousFacilitatorName = facilitatorInProject?.name || previousFacilitatorId;

        const incomingFacilitatorId = data.facilitatorId ? String(data.facilitatorId) : undefined;
        if (incomingFacilitatorId !== undefined && incomingFacilitatorId !== previousFacilitatorId) {
            const nextFacilitator = await User.findOne({
                _id: incomingFacilitatorId,
                role: ROLES.FACILITADOR,
                isActive: true
            }).select('name email role');

            if (!nextFacilitator) {
                throw ApiError.badRequest('El facilitador seleccionado no existe o no está activo');
            }
        }

        const logDetails: Record<string, unknown> = {
            updatedFields: Object.keys(data),
            changes: {}
        };

        if (incomingFacilitatorId !== undefined && incomingFacilitatorId !== previousFacilitatorId) {
            const nextFacilitator = await User.findById(incomingFacilitatorId).select('name email');
            (logDetails.changes as Record<string, unknown>).facilitator = {
                from: { id: previousFacilitatorId, name: previousFacilitatorName },
                to: { id: incomingFacilitatorId, name: nextFacilitator?.name || incomingFacilitatorId }
            };
            logDetails.whatManaged = 'Cambio de facilitador del proyecto';
        }

        if (data.estimationMethod && data.estimationMethod !== (project.estimationMethod as any)) {
            (logDetails.changes as Record<string, unknown>).estimationMethod = {
                from: project.estimationMethod,
                to: data.estimationMethod
            };
            logDetails.whatManaged = logDetails.whatManaged || 'Cambio de método de estimación';
        }

        if (data.convergenceConfig) {
            (logDetails.changes as Record<string, unknown>).convergenceConfig = {
                from: project.convergenceConfig,
                to: data.convergenceConfig
            };
            logDetails.whatManaged = logDetails.whatManaged || 'Cambio de métrica/umbral de convergencia';
        }

        const updatedProject = await Project.findByIdAndUpdate(
            id,
            { $set: data },
            { new: true, runValidators: true }
        )
            .populate('facilitatorId', 'name email')
            .populate('expertIds', 'name email');

        await auditService.log({ 
            userId: requesterId, 
            userName: requesterName,
            userRole: requesterRole,
            action: 'project:update', 
            resource: 'Project', 
            resourceId: id, 
            details: logDetails 
        });
        return updatedProject as IProject;
    },

    async archive(id: string, requesterId: string): Promise<IProject> {
        const project = await this.update(id, { status: PROJECT_STATUS.ARCHIVED as any }, requesterId);
        await auditService.log({ userId: requesterId, action: 'project:archive', resource: 'Project', resourceId: id });
        return project;
    },

    async manageExperts(
        id: string,
        action: 'add' | 'remove',
        expertIds: string[],
        requesterId: string,
        requesterName?: string,
        requesterRole?: string
    ): Promise<IProject> {
        const project = await this.findById(id);

        if (project.status === PROJECT_STATUS.ARCHIVED) {
            throw ApiError.forbidden('No se puede modificar un proyecto archivado');
        }

        if (project.status === PROJECT_STATUS.FINISHED) {
            throw ApiError.forbidden('No se puede modificar expertos en un proyecto finalizado');
        }

        const validExperts = await User.find({
            _id: { $in: expertIds },
            role: ROLES.EXPERTO,
            isActive: true
        }).select('name email role');

        if (validExperts.length !== expertIds.length) {
            throw ApiError.badRequest('Uno o más expertos seleccionados no existen o no están activos');
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

        await auditService.log({
            userId: requesterId,
            userName: requesterName,
            userRole: requesterRole,
            action: `project:experts_${action}`,
            resource: 'Project',
            resourceId: id,
            details: {
                whatManaged: action === 'add' ? 'Asignación de expertos al proyecto' : 'Remoción de expertos del proyecto',
                actionType: action,
                experts: validExperts.map((expert) => ({
                    id: expert.id,
                    name: expert.name,
                    email: expert.email
                }))
            }
        });
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
    },

    async addAttachment(projectId: string, fileData: any, requesterId: string): Promise<any> {
        const project = await Project.findById(projectId);
        if (!project) {
            throw ApiError.notFound('Proyecto no encontrado');
        }

        const attachment = {
            originalName: fileData.originalname,
            filename: fileData.filename,
            mimeType: fileData.mimetype,
            size: fileData.size,
            path: `/uploads/${fileData.filename}`,
            uploadedAt: new Date()
        };

        project.attachments.push(attachment as any);
        await project.save();

        await auditService.log({
            userId: requesterId,
            action: 'project:upload_attachment',
            resource: 'Project',
            resourceId: projectId,
            details: { filename: fileData.filename, originalName: fileData.originalname }
        });

        // Retornar el attachment con su ID generado por Mongoose
        return project.attachments[project.attachments.length - 1];
    },

    async deleteAttachment(projectId: string, attachmentId: string, requesterId: string): Promise<IProject> {
        const project = await Project.findById(projectId);
        if (!project) {
            throw ApiError.notFound('Proyecto no encontrado');
        }

        const attachmentIndex = project.attachments.findIndex(
            (a: any) => String(a._id) === attachmentId || String(a.id) === attachmentId
        );

        if (attachmentIndex === -1) {
            throw ApiError.notFound('Archivo no encontrado en el proyecto');
        }

        const attachment = project.attachments[attachmentIndex];
        const filePath = path.join(process.cwd(), 'uploads', attachment.filename);

        // Intenta borrar el archivo físico
        try {
            if (fs.existsSync(filePath)) {
                await fs.promises.unlink(filePath);
            }
        } catch (err) {
            console.error(`Error deleting physical file ${filePath}:`, err);
            // Seguimos adelante aunque falle el borrado físico para limpiar la DB
        }

        // Eliminar de la base de datos
        project.attachments.splice(attachmentIndex, 1);
        await project.save();

        await auditService.log({
            userId: requesterId,
            action: 'project:delete_attachment',
            resource: 'Project',
            resourceId: projectId,
            details: { filename: attachment.filename, originalName: attachment.originalName }
        });

        return project.toObject() as IProject;
    }
};
