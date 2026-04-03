import { Request, Response } from 'express';
import { discussionService } from './discussion.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const addComment = asyncHandler(async (req: Request, res: Response) => {
    const { id: roundId } = req.params;
    const { content, isAnonymous } = req.body;
    const userId = req.user?.id as string;

    const comment = await discussionService.addComment(roundId, userId, content, isAnonymous);

    res.status(201).json({
        success: true,
        message: 'Comentario agregado',
        data: comment
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
