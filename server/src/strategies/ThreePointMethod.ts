import { IEstimation } from '../types/models.types.js';
import { statisticsService } from '../services/statistics.service.js';
import { IBaseEstimationMethod, MethodResult } from './IBaseEstimationMethod.js';

export class ThreePointMethod implements IBaseEstimationMethod {
    calculate(estimations: IEstimation[]): MethodResult {
        if (!estimations || estimations.length === 0) {
            throw new Error('No hay estimaciones para calcular');
        }

        // PERT: E = (O + 4M + P) / 6
        // Cada experto envió O, M, P en metodoData
        const os: number[] = [];
        const ms: number[] = [];
        const ps: number[] = [];

        estimations.forEach(e => {
            if (e.metodoData && e.metodoData.optimistic !== undefined) {
                os.push(Number(e.metodoData.optimistic));
                ms.push(Number(e.metodoData.mostLikely));
                ps.push(Number(e.metodoData.pessimistic));
            } else {
                // Fallback si no hay data (no debería pasar)
                os.push(e.value);
                ms.push(e.value);
                ps.push(e.value);
            }
        });

        const oAvg = os.reduce((a, b) => a + b, 0) / os.length;
        const mAvg = ms.reduce((a, b) => a + b, 0) / ms.length;
        const pAvg = ps.reduce((a, b) => a + b, 0) / ps.length;

        // E_mean = (O_avg + 4*M_avg + P_avg) / 6
        const eMean = (oAvg + 4 * mAvg + pAvg) / 6;
        const sigmaMean = (pAvg - oAvg) / 6;

        const stats = statisticsService.calculateMetrics(estimations.map(e => ({
            id: String(e._id),
            value: e.value
        })));

        return {
            mean: Number(eMean.toFixed(2)),
            median: stats.median,
            stdDev: Number(sigmaMean.toFixed(2)),
            variance: Number(Math.pow(sigmaMean, 2).toFixed(2)),
            cv: stats.coefficientOfVariation,
            range: [Number(oAvg.toFixed(2)), Number(pAvg.toFixed(2))],
            iqr: stats.iqr,
            outlierEstimationIds: stats.outlierEstimationIds,
            metricaResultados: {
                optimisticAvg: Number(oAvg.toFixed(2)),
                mostLikelyAvg: Number(mAvg.toFixed(2)),
                pessimisticAvg: Number(pAvg.toFixed(2)),
                expectedValue: Number(eMean.toFixed(2)),
                standardDeviation: Number(sigmaMean.toFixed(2))
            }
        };
    }
}
