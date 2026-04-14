import { Router } from 'express';
import { getUsers, createUser, updateUser, deactivateUser, activateUser, deleteUser, getProjects, restoreProject } from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole, requirePermission } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createUserByAdminSchema, updateUserByAdminSchema } from '../types/api.types.js';
import { ROLES, PERMISSIONS } from '../config/constants.js';

const router = Router();

// All admin routes: must be authenticated
router.use(authenticate);

// User management endpoints: ADMIN and FACILITADOR
router.get('/users', requireRole(ROLES.ADMIN, ROLES.FACILITADOR), requirePermission(PERMISSIONS.MANAGE_USERS), getUsers);
router.post('/users', requireRole(ROLES.ADMIN, ROLES.FACILITADOR), requirePermission(PERMISSIONS.MANAGE_USERS), validate(createUserByAdminSchema), createUser);
router.patch('/users/:id', requireRole(ROLES.ADMIN, ROLES.FACILITADOR), requirePermission(PERMISSIONS.MANAGE_USERS), validate(updateUserByAdminSchema), updateUser);
router.patch('/users/:id/deactivate', requireRole(ROLES.ADMIN, ROLES.FACILITADOR), requirePermission(PERMISSIONS.MANAGE_USERS), deactivateUser);
router.patch('/users/:id/activate', requireRole(ROLES.ADMIN, ROLES.FACILITADOR), requirePermission(PERMISSIONS.MANAGE_USERS), activateUser);
router.delete('/users/:id', requireRole(ROLES.ADMIN, ROLES.FACILITADOR), requirePermission(PERMISSIONS.MANAGE_USERS), deleteUser);

// Project management endpoints: ADMIN (global default previously, now explicit)
router.get('/projects', requireRole(ROLES.ADMIN), getProjects);
router.patch('/projects/:id/restore', requireRole(ROLES.ADMIN), restoreProject);

// GET /api/admin/projects
router.get('/projects', getProjects);

// PATCH /api/admin/projects/:id/restore
router.patch('/projects/:id/restore', restoreProject);

export default router;
