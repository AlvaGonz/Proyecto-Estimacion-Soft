import { IEstimation } from '../types/models.types.js';
import { statisticsService } from '../services/statistics.service.js';
import { IBaseEstimationMethod, MethodResult } from './IBaseEstimationMethod.js';

export class PlanningPokerMethod implements IBaseEstimationMethod {
    calculate(estimations: IEstimation[]): MethodResult {
        if (!estimations || estimations.length === 0) {
            throw new Error('No hay estimaciones para calcular');
        }

        const stats = statisticsService.calculateMetrics(estimations.map(e => ({
            id: String(e._id),
            value: e.value
        })));

        // Calcular Moda (RF015b)
        const frequencies: Record<number, number> = {};
        let maxFreq = 0;
        let moda: number[] = [];

        estimations.forEach(e => {
            frequencies[e.value] = (frequencies[e.value] || 0) + 1;
            if (frequencies[e.value] > maxFreq) {
                maxFreq = frequencies[e.value];
                moda = [e.value];
            } else if (frequencies[e.value] === maxFreq) {
                moda.push(e.value);
            }
        });

        const numExpertos = estimations.length;
        const consensoPct = (maxFreq / numExpertos) * 100;

        return {
            mean: stats.mean,
            median: stats.median,
            stdDev: stats.stdDev,
            variance: stats.variance,
            cv: stats.coefficientOfVariation,
            range: stats.range,
            iqr: stats.iqr,
            outlierEstimationIds: stats.outlierEstimationIds,
            metricaResultados: {
                moda: moda.length === numExpertos ? 'Ninguna' : moda.join(', '),
                frecuencia: maxFreq,
                consensoPct: Number(consensoPct.toFixed(2)),
                distribucion: frequencies
            }
        };
    }
}
