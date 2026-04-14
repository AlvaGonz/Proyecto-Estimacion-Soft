import { Router } from 'express';
import {
    createProject, getProjects, getProjectById, updateProject,
    archiveProject, manageExperts, getProjectAuditLogs,
    createTask, getTasksByProject, updateTask, deleteProject,
    deleteAttachment, finalizeTask
} from '../controllers/project.controller.js';
import { upload } from '../middleware/upload.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { ROLES } from '../config/constants.js';
import {
    createProjectSchema, updateProjectSchema, manageExpertsSchema,
    createTaskSchema, updateTaskSchema
} from '../types/api.types.js';

const router = Router();

// Apply auth to all project routes
router.use(authenticate);

// ─── Project Endpoints ──────────────────────────────────────────────

// GET /api/projects - All roles can view (service filters by role)
router.get('/', getProjects);

// GET /api/projects/:id - Details
router.get('/:id', getProjectById);

// POST /api/projects
router.post(
    '/',
    requireRole(ROLES.ADMIN, ROLES.FACILITADOR),
    validate(createProjectSchema),
    createProject
);

// PATCH /api/projects/:id
router.patch(
    '/:id',
    requireRole(ROLES.ADMIN, ROLES.FACILITADOR),
    validate(updateProjectSchema),
    updateProject
);

// POST /api/projects/:id/archive - Soft delete (archive status)
router.post(
    '/:id/archive',
    requireRole(ROLES.ADMIN, ROLES.FACILITADOR),
    archiveProject
);

// DELETE /api/projects/:id - Permanent soft delete (isDeleted flag)
router.delete(
    '/:id',
    requireRole(ROLES.ADMIN),
    deleteProject
);

// PATCH /api/projects/:id/experts
router.patch(
    '/:id/experts',
    requireRole(ROLES.ADMIN, ROLES.FACILITADOR),
    validate(manageExpertsSchema),
    manageExperts
);

// GET /api/projects/:id/audit-logs
router.get('/:id/audit-logs', getProjectAuditLogs);

// ─── Nested Task Endpoints ──────────────────────────────────────────

// GET /api/projects/:id/tasks
router.get('/:id/tasks', getTasksByProject);

// POST /api/projects/:id/tasks
router.post(
    '/:id/tasks',
    requireRole(ROLES.ADMIN, ROLES.FACILITADOR),
    validate(createTaskSchema),
    createTask
);

// PATCH /api/projects/:id/tasks/:tid
router.patch(
    '/:id/tasks/:tid',
    requireRole(ROLES.ADMIN, ROLES.FACILITADOR),
    validate(updateTaskSchema),
    updateTask
);

// PATCH /api/projects/:id/tasks/:tid/finalize
router.patch(
    '/:id/tasks/:tid/finalize',
    requireRole(ROLES.ADMIN, ROLES.FACILITADOR),
    finalizeTask
);

export default router;
