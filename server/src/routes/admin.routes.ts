import { Router } from 'express';
import { getUsers, createUser, updateUser, deactivateUser, getProjects, restoreProject } from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole, requirePermission } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createUserByAdminSchema, updateUserByAdminSchema } from '../types/api.types.js';
import { ROLES, PERMISSIONS } from '../config/constants.js';

const router = Router();

// All admin routes: must be authenticated AND have ADMIN role
router.use(authenticate, requireRole(ROLES.ADMIN));

// GET  /api/admin/users
router.get('/users', requirePermission(PERMISSIONS.MANAGE_USERS), getUsers);

// POST /api/admin/users
router.post('/users', requirePermission(PERMISSIONS.MANAGE_USERS), validate(createUserByAdminSchema), createUser);

// PATCH /api/admin/users/:id
router.patch('/users/:id', requirePermission(PERMISSIONS.MANAGE_USERS), validate(updateUserByAdminSchema), updateUser);

// PATCH /api/admin/users/:id/deactivate
router.patch('/users/:id/deactivate', requirePermission(PERMISSIONS.MANAGE_USERS), deactivateUser);

// GET /api/admin/projects
router.get('/projects', getProjects);

// PATCH /api/admin/projects/:id/restore
router.patch('/projects/:id/restore', restoreProject);

export default router;
