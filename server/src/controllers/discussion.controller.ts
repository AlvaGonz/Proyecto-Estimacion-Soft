import { Request, Response } from 'express';
import { discussionService } from '../services/discussion.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const addComment = asyncHandler(async (req: Request, res: Response) => {
    // Both taskId and roundId are optional in the URL params, or we can handle different routes
    const { taskId, roundId } = req.params;
    const { content, isAnonymous } = req.body;
    const userId = req.user?.id as string;
    const userRole = req.user?.role;

    const comment = await discussionService.addComment(
        userId, 
        content, 
        isAnonymous, 
        taskId, 
        roundId,
        userRole
    );

    res.status(201).json({
        success: true,
        message: 'Comentario agregado',
        data: comment
    });
});

export const getCommentsByTask = asyncHandler(async (req: Request, res: Response) => {
    const { taskId } = req.params;
    const comments = await discussionService.getCommentsByTask(taskId);

    res.json({
        success: true,
        data: comments
    });
});

export const getCommentsByRound = asyncHandler(async (req: Request, res: Response) => {
    const { id: roundId } = req.params;
    const comments = await discussionService.getCommentsByRound(roundId);

    res.json({
        success: true,
        data: comments
    });
});
