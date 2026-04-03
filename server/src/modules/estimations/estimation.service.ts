import { Estimation } from './estimation.model.js';
import { Round } from '../rounds/round.model.js';
import { IEstimation } from '../../types/models.types.js';
import { ApiError } from '../../utils/ApiError.js';
import { ROUND_STATUS, ROLES, Role } from '../../config/constants.js';
import { auditService } from '../audit-log/audit.service.js';

export const estimationService = {
    async submit(roundId: string, expertId: string, value: number, justification: string, metodoData?: any): Promise<IEstimation> {
        const round = await Round.findById(roundId);
        if (!round) throw ApiError.notFound('Ronda no encontrada');

        if (round.status === ROUND_STATUS.CLOSED) {
            throw ApiError.forbidden('No se pueden enviar estimaciones en una ronda cerrada');
        }

        // Enforce unique estimation per expert per round
        const existing = await Estimation.findOne({ roundId, expertId });
        if (existing) {
            throw ApiError.conflict('Ya emitió una estimación para esta ronda. Puede actualizarla, pero no crear una nueva.');
        }

        const estimation = await Estimation.create({
            roundId,
            taskId: round.taskId,
            expertId,
            value,
            justification,
            metodoData: metodoData || {}
        });

        await auditService.log({ userId: expertId, action: 'estimation:submit', resource: 'Estimation', resourceId: estimation.id, details: { roundId, value } });
        return estimation;
    },

    async findByRound(roundId: string, requesterId: string, requesterRole: Role): Promise<IEstimation[]> {
        const round = await Round.findById(roundId);
        if (!round) throw ApiError.notFound('Ronda no encontrada');

        const isClosed = round.status === ROUND_STATUS.CLOSED;

        // ⚠️ WIDEBAND DELPHI INVARIANT: Server-Side Visibility Filtering

        // 1. If round is CLOSED: All can see all estimations. 
        if (isClosed) {
            return await Estimation.find({ roundId }).populate('expertId', 'name').sort({ createdAt: 1 });
        }

        // 2. If round is OPEN:
        //    - Experts ONLY see their OWN estimations. This enforces anonymity during the estimation phase.
        if (requesterRole === ROLES.EXPERTO) {
            return await Estimation.find({ roundId, expertId: requesterId }).populate('expertId', 'name');
        }

        //    - Facilitators/Admins can see ALL estimations to monitor progress.
        return await Estimation.find({ roundId }).populate('expertId', 'name').sort({ createdAt: 1 });
    },

    async update(estimationId: string, expertId: string, data: Partial<IEstimation>): Promise<IEstimation> {
        const estimation = await Estimation.findById(estimationId);
        if (!estimation) throw ApiError.notFound('Estimación no encontrada');

        if (estimation.expertId.toString() !== expertId) {
            throw ApiError.forbidden('Solo puede modificar sus propias estimaciones');
        }

        const round = await Round.findById(estimation.roundId);
        if (!round || round.status === ROUND_STATUS.CLOSED) {
            throw ApiError.forbidden('No se pueden modificar estimaciones en una ronda cerrada (inmutabilidad)');
        }

        const updated = await Estimation.findByIdAndUpdate(
            estimationId,
            { $set: data },
            { new: true, runValidators: true }
        );

        await auditService.log({ userId: expertId, action: 'estimation:update', resource: 'Estimation', resourceId: estimationId, details: { updatedFields: Object.keys(data) } });
        return updated as IEstimation;
    }
};
