import { IEstimation } from '../types/models.types.js';
import { statisticsService } from '../services/statistics.service.js';
import { IBaseEstimationMethod, MethodResult } from './IBaseEstimationMethod.js';

export class DelphiMethod implements IBaseEstimationMethod {
    calculate(estimations: IEstimation[]): MethodResult {
        if (!estimations || estimations.length === 0) {
            throw new Error('No hay estimaciones para calcular');
        }

        const stats = statisticsService.calculateMetrics(estimations.map(e => ({
            id: String(e._id),
            value: e.value
        })));

        return {
            mean: stats.mean,
            median: stats.median,
            stdDev: stats.stdDev,
            variance: stats.variance,
            cv: stats.coefficientOfVariation,
            range: stats.range,
            iqr: stats.iqr,
            outlierEstimationIds: stats.outlierEstimationIds,
            metricaResultados: {}
        };
    }
}
