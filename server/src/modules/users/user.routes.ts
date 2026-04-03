import { Router } from 'express';
import { getUsers, createUser, updateUser, deactivateUser, deleteUser } from './user.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole, requirePermission } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createUserByAdminSchema, updateUserByAdminSchema } from '../../types/api.types.js';
import { ROLES, PERMISSIONS } from '../../config/constants.js';

const router = Router();

// Base middeleware: authentication
router.use(authenticate);

// GET /api/users
// Both Admin and Facilitator can list users (Facilitator needs it to select experts)
router.get('/', requireRole(ROLES.ADMIN, ROLES.FACILITADOR), getUsers);

// Only Admin can perform these management operations
router.post(
    '/',
    requireRole(ROLES.ADMIN),
    requirePermission(PERMISSIONS.MANAGE_USERS),
    validate(createUserByAdminSchema),
    createUser
);

router.patch(
    '/:id',
    requireRole(ROLES.ADMIN),
    requirePermission(PERMISSIONS.MANAGE_USERS),
    validate(updateUserByAdminSchema),
    updateUser
);

router.patch(
    '/:id/deactivate',
    requireRole(ROLES.ADMIN),
    requirePermission(PERMISSIONS.MANAGE_USERS),
    deactivateUser
);

router.delete(
    '/:id',
    requireRole(ROLES.ADMIN),
    requirePermission(PERMISSIONS.MANAGE_USERS),
    deleteUser
);

export default router;
