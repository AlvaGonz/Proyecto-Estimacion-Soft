import { Router } from 'express';
import {
    submitEstimation, getEstimationsByRound, updateEstimation
} from './estimation.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { ROLES } from '../../config/constants.js';
import { createEstimationSchema, updateEstimationSchema } from '../../types/api.types.js';

const router = Router();
router.use(authenticate);

// We need a router for endpoints under /api/rounds/:id/estimations
export const nestedEstimationRoutes = Router({ mergeParams: true });

nestedEstimationRoutes.get('/', getEstimationsByRound);

nestedEstimationRoutes.post(
    '/',
    requireRole(ROLES.EXPERTO),
    validate(createEstimationSchema),
    submitEstimation
);

// Endpoints directly under /api/estimations/:id
router.patch(
    '/:id',
    requireRole(ROLES.EXPERTO),
    validate(updateEstimationSchema),
    updateEstimation
);

export default router;
