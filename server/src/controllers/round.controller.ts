import { Request, Response } from 'express';
import { roundService } from '../services/round.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const openRound = asyncHandler(async (req: Request, res: Response) => {
    const { taskId } = req.body;
    const requesterId = req.user?.id as string;

    const round = await roundService.openNew(taskId, requesterId);

    res.status(201).json({
        success: true,
        message: 'Ronda de estimación abierta exitosamente',
        data: round
    });
});

export const closeRound = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params; // roundId
    const requesterId = req.user?.id as string;

    const { round, convergence } = await roundService.close(id, requesterId);

    res.json({
        success: true,
        message: 'Ronda cerrada y métricas calculadas',
        data: {
            round,
            convergence
        }
    });
});

export const getRoundsByTask = asyncHandler(async (req: Request, res: Response) => {
    // Assuming taskId is passed as a query param according to the route plan
    const { taskId } = req.query;

    if (!taskId || typeof taskId !== 'string') {
        res.status(400).json({ success: false, message: 'Falta taskId en la query' });
        return;
    }

    const rounds = await roundService.findByTask(taskId);

    res.json({
        success: true,
        data: rounds
    });
});

export const updateRoundAnalysis = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { analysis } = req.body;
    const requesterId = req.user?.id as string;

    const round = await roundService.updateAnalysis(id, analysis, requesterId);

    res.json({
        success: true,
        message: 'Análisis de ronda guardado exitosamente',
        data: round
    });
});
