import { Router } from 'express';
import { addComment, getCommentsByRound, getCommentsByTask } from '../controllers/discussion.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createCommentSchema } from '../types/api.types.js';

// Setup for nested router under "/api/rounds/:id/comments" OR "/api/tasks/:taskId/comments"
export const nestedDiscussionRoutes = Router({ mergeParams: true });

nestedDiscussionRoutes.use(authenticate);

// Handlers check for taskId or roundId in req.params
nestedDiscussionRoutes.get('/', (req, res, next) => {
    const { taskId } = req.params as { taskId?: string };
    if (taskId) {
        return getCommentsByTask(req, res, next);
    }
    return getCommentsByRound(req, res, next);
});

nestedDiscussionRoutes.post(
    '/',
    validate(createCommentSchema),
    addComment
);
