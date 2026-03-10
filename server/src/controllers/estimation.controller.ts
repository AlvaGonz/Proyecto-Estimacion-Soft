import { Request, Response } from 'express';
import { estimationService } from '../services/estimation.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Role } from '../config/constants.js';

export const submitEstimation = asyncHandler(async (req: Request, res: Response) => {
    const { id: roundId } = req.params;
    const { value, justification } = req.body;
    const expertId = req.user?.id as string;

    const estimation = await estimationService.submit(roundId, expertId, value, justification);

    res.status(201).json({
        success: true,
        message: 'Estimación enviada exitosamente',
        data: estimation
    });
});

export const getEstimationsByRound = asyncHandler(async (req: Request, res: Response) => {
    const { id: roundId } = req.params;
    const requesterId = req.user?.id as string;
    const requesterRole = req.user?.role as Role;

    const estimations = await estimationService.findByRound(roundId, requesterId, requesterRole);

    res.json({
        success: true,
        data: estimations
    });
});

export const updateEstimation = asyncHandler(async (req: Request, res: Response) => {
    const { id: estimationId } = req.params;
    const expertId = req.user?.id as string;

    const updated = await estimationService.update(estimationId, expertId, req.body);

    res.json({
        success: true,
        message: 'Estimación actualizada',
        data: updated
    });
});
