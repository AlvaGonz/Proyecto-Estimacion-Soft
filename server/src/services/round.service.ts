import { Round } from '../models/Round.model.js';
import { Task } from '../models/Task.model.js';
import { Project } from '../models/Project.model.js';
import { Estimation } from '../models/Estimation.model.js';
import { IRound, IRoundStats, IConvergenceConfig } from '../types/models.types.js';
import { ApiError } from '../utils/ApiError.js';
import { ROUND_STATUS, TASK_STATUS, PROJECT_STATUS } from '../config/constants.js';
import { statisticsService, MetricInput } from './statistics.service.js';
import { convergenceService, ConvergenceResult } from './convergence.service.js';
import { auditService } from './audit.service.js';
import { DelphiMethod } from '../strategies/DelphiMethod.js';
import { PlanningPokerMethod } from '../strategies/PlanningPokerMethod.js';
import { ThreePointMethod } from '../strategies/ThreePointMethod.js';
import { IBaseEstimationMethod } from '../strategies/IBaseEstimationMethod.js';
import mongoose from 'mongoose';

export const roundService = {
    async openNew(taskId: string, requesterId: string): Promise<IRound> {
        const task = await Task.findById(taskId);
        if (!task) {
            throw ApiError.notFound('Tarea no encontrada');
        }

        const project = await Project.findById(task.projectId);
        if (!project || project.status !== PROJECT_STATUS.ACTIVE) {
            throw ApiError.forbidden('Solo se pueden abrir rondas en proyectos activos');
        }

        // Check if there's already an open round
        const openRound = await Round.findOne({ taskId, status: ROUND_STATUS.OPEN });
        if (openRound) {
            throw ApiError.conflict('Ya existe una ronda abierta para esta tarea');
        }

        // Get the highest round number
        const lastRound = await Round.findOne({ taskId }).sort({ roundNumber: -1 });
        const nextRoundNumber = lastRound ? lastRound.roundNumber + 1 : 1;

        // Change task status to 'estimating'
        task.status = TASK_STATUS.ESTIMATING;
        await task.save();

        const round = await Round.create({
            taskId,
            roundNumber: nextRoundNumber,
            status: ROUND_STATUS.OPEN,
            startTime: new Date()
        });

        await auditService.log({ userId: requesterId, action: 'round:create', resource: 'Round', resourceId: round.id, details: { taskId, roundNumber: round.roundNumber } });
        return round;
    },

    async close(roundId: string, requesterId: string): Promise<{ round: IRound; convergence: ConvergenceResult }> {
        const round = await Round.findById(roundId);

        if (!round) {
            throw ApiError.notFound('Ronda no encontrada');
        }

        if (round.status === ROUND_STATUS.CLOSED) {
            throw ApiError.conflict('La ronda ya está cerrada');
        }

        const task = await Task.findById(round.taskId);
        if (!task) {
            throw ApiError.internal('Tarea asociada no encontrada');
        }

        const project = await Project.findById(task.projectId);
        if (!project) {
            throw ApiError.internal('Proyecto asociado no encontrado');
        }

        // Get all estimations for this round
        const estimations = await Estimation.find({ roundId });

        // Calculate statistics based on project method
        let strategy: IBaseEstimationMethod;
        switch (project.estimationMethod) {
            case 'planning-poker':
                strategy = new PlanningPokerMethod();
                break;
            case 'three-point':
                strategy = new ThreePointMethod();
                break;
            default:
                strategy = new DelphiMethod();
                break;
        }

        const statsResult = strategy.calculate(estimations);
        const config = project.convergenceConfig as IConvergenceConfig;

        // Evaluate convergence
        const convergence = convergenceService.evaluateConsensus(
            statsResult.cv,
            estimations.length,
            statsResult.outlierEstimationIds.length,
            config
        );

        // Update round
        // Note: setting status, endTime, and stats AT ONCE to respect immutability hook behavior
        round.status = ROUND_STATUS.CLOSED;
        round.endTime = new Date();
        round.stats = {
            mean: statsResult.mean,
            median: statsResult.median,
            stdDev: statsResult.stdDev,
            variance: statsResult.variance,
            cv: statsResult.cv,
            range: statsResult.range,
            iqr: statsResult.iqr,
            outlierEstimationIds: statsResult.outlierEstimationIds as any,
            metricaResultados: statsResult.metricaResultados
        } as unknown as IRoundStats;

        await round.save();

        const result = {
            round: round.toJSON(),
            convergence: {
                ...convergence,
                recommendation: convergence.recommendation,
                // Ensure all stats from statisticsService are passed back to the frontend
                stats: {
                    ...statsResult,
                    cv: statsResult.cv,
                    metricaResultados: statsResult.metricaResultados
                }
            }
        };

        await auditService.log({
            userId: requesterId,
            action: 'round:close',
            resource: 'Round',
            resourceId: roundId,
            details: {
                taskId: String(task._id),
                stats: round.stats,
                converged: convergence.converged
            }
        });

        return result as unknown as { round: IRound; convergence: ConvergenceResult };
    },

    async findByTask(taskId: string): Promise<IRound[]> {
        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            throw ApiError.badRequest('ID de tarea inválido');
        }
        return await Round.find({ taskId }).sort({ roundNumber: 1 });
    }
};
