import { Router } from 'express';
import { openRound, closeRound, getRoundsByTask } from '../controllers/round.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { ROLES } from '../config/constants.js';
import { openRoundSchema } from '../types/api.types.js';

const router = Router();

router.use(authenticate);

// Note: Mounted at /api/projects on the top level? Based on plan: 
// The routes are separated logically but we can define them here.
// Actually, let's treat this router as specifically for rounds. 
// So, `/` means `/api/rounds`

// Wait, the plan says:
// GET /api/projects/:pid/rounds
// POST /api/projects/:pid/rounds
// POST /api/rounds/:id/close
// For simplicity, we can mount these as:

// 1) Endpoints that are purely about the round resource
router.post(
    '/:id/close',
    requireRole(ROLES.ADMIN, ROLES.FACILITADOR),
    closeRound
);

// We will export an additional router specifically for nested project requests.
export const nestedRoundRoutes = Router({ mergeParams: true });

nestedRoundRoutes.get('/', getRoundsByTask);

nestedRoundRoutes.post(
    '/',
    requireRole(ROLES.ADMIN, ROLES.FACILITADOR),
    validate(openRoundSchema),
    openRound
);

export default router;
