import { Router } from 'express';
import { addComment, getCommentsByRound } from '../controllers/discussion.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createCommentSchema } from '../types/api.types.js';

// Setup for nested router under "/api/rounds/:id/comments"
export const nestedDiscussionRoutes = Router({ mergeParams: true });

nestedDiscussionRoutes.use(authenticate);

nestedDiscussionRoutes.get('/', getCommentsByRound);

nestedDiscussionRoutes.post(
    '/',
    validate(createCommentSchema),
    addComment
);
