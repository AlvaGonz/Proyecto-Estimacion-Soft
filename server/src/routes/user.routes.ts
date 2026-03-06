import { Router } from 'express';
import { getAllUsers, updateUser } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { ROLES } from '../config/constants.js';

const router = Router();

// GET /api/users — Get all users (admin only)
router.get('/', authenticate, requireRole(ROLES.ADMIN), getAllUsers);

// PATCH /api/users/:id — Update user (admin only)
router.patch('/:id', authenticate, requireRole(ROLES.ADMIN), updateUser);

export default router;
