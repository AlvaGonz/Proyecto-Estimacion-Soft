import { Router } from 'express';
import { getUsers, createUser, updateUser, deactivateUser, activateUser, deleteUser, getProjects, restoreProject, archiveProject, deleteProject } from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole, requirePermission } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createUserByAdminSchema, updateUserByAdminSchema } from '../types/api.types.js';
import { ROLES, PERMISSIONS } from '../config/constants.js';

const router = Router();

// All admin routes: must be authenticated
router.use(authenticate);

// ─── Project Management Endpoints (Top Priority) ───────────────────
// These are moved to the top to avoid conflicts with user-related dynamic routes
router.get('/projects', requireRole(ROLES.ADMIN), getProjects);
router.patch('/projects/:id/restore', requireRole(ROLES.ADMIN), restoreProject);
router.patch('/projects/:id/archive', requireRole(ROLES.ADMIN), archiveProject);
router.delete('/projects/:id', requireRole(ROLES.ADMIN), deleteProject);

// ─── User Management Endpoints ─────────────────────────────────────
router.get('/users', requireRole(ROLES.ADMIN, ROLES.FACILITADOR), requirePermission(PERMISSIONS.MANAGE_USERS), getUsers);
router.post('/users', requireRole(ROLES.ADMIN, ROLES.FACILITADOR), requirePermission(PERMISSIONS.MANAGE_USERS), validate(createUserByAdminSchema), createUser);
router.patch('/users/:id', requireRole(ROLES.ADMIN, ROLES.FACILITADOR), requirePermission(PERMISSIONS.MANAGE_USERS), validate(updateUserByAdminSchema), updateUser);
router.patch('/users/:id/deactivate', requireRole(ROLES.ADMIN, ROLES.FACILITADOR), requirePermission(PERMISSIONS.MANAGE_USERS), deactivateUser);
router.patch('/users/:id/activate', requireRole(ROLES.ADMIN, ROLES.FACILITADOR), requirePermission(PERMISSIONS.MANAGE_USERS), activateUser);
router.delete('/users/:id', requireRole(ROLES.ADMIN, ROLES.FACILITADOR), requirePermission(PERMISSIONS.MANAGE_USERS), deleteUser);

export default router;
