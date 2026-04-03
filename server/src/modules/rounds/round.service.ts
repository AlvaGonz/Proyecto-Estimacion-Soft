import { Round } from './round.model.js';
import { Task } from '../tasks/task.model.js';
import { Project } from '../projects/project.model.js';
import { Estimation } from '../estimations/estimation.model.js';
import { IRound, IRoundStats, IConvergenceConfig } from '../../types/models.types.js';
import { ApiError } from '../../utils/ApiError.js';
import { ROUND_STATUS, TASK_STATUS, PROJECT_STATUS } from '../../config/constants.js';
import { auditService } from '../audit-log/audit.service.js';
import { convergenceService, ConvergenceResult } from '../convergence/convergence.service.js';
import { DelphiMethod } from '../../strategies/DelphiMethod.js';
import { PlanningPokerMethod } from '../../strategies/PlanningPokerMethod.js';
import { ThreePointMethod } from '../../strategies/ThreePointMethod.js';
import { IBaseEstimationMethod } from '../../strategies/IBaseEstimationMethod.js';
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
        try {
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
            round.status = ROUND_STATUS.CLOSED;
            round.endTime = new Date();
            round.stats = {
                mean: statsResult.mean,
                median: statsResult.median,
                stdDev: statsResult.stdDev,
                variance: statsResult.variance,
                coefficientOfVariation: statsResult.cv,
                range: statsResult.range,
                iqr: statsResult.iqr,
                outliers: statsResult.outlierEstimationIds as any,
                metricaResultados: statsResult.metricaResultados
            } as unknown as IRoundStats;

            await round.save();

            // (B-012) Audit sanitization: Log only key metrics, not raw stats/outlier details
            const auditData = {
                mean: round.stats.mean,
                median: round.stats.median,
                cv: round.stats.coefficientOfVariation,
                converged: convergence.converged,
                estimatedCount: round.stats.metricaResultados?.totalEstimations || 0
            };

            await auditService.log({
                userId: requesterId,
                action: 'round:close',
                resource: 'Round',
                resourceId: round.id,
                details: { 
                    taskId: round.taskId, 
                    roundNumber: round.roundNumber,
                    summary: auditData 
                }
            });

            // (B-004): State Sync — If converged, update Task status and result
            if (convergence.converged) {
                await Task.findByIdAndUpdate(round.taskId, {
                    status: TASK_STATUS.CONSENSUS,
                    finalEstimate: round.stats.median,
                    finalJustification: `Estimación consensuada en Ronda ${round.roundNumber} con CV=${round.stats.coefficientOfVariation.toFixed(3)}`
                });
            }

            return { round, convergence };
        } catch (error: any) {
            console.error('[RoundService] Error closing round:', error);
            throw error;
        }
    },

    async findByTask(taskId: string): Promise<IRound[]> {
        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            throw ApiError.badRequest('ID de tarea inválido');
        }
        return await Round.find({ taskId }).sort({ roundNumber: 1 });
    },

    async updateAnalysis(roundId: string, analysis: any, requesterId: string): Promise<IRound> {
        const round = await Round.findById(roundId);
        if (!round) {
            throw ApiError.notFound('Ronda no encontrada');
        }

        round.analysis = analysis;
        await round.save();

        await auditService.log({
            userId: requesterId,
            action: 'round:analysis:update',
            resource: 'Round',
            resourceId: round.id,
            details: { analysis }
        });

        return round;
    }
};
