import { IEstimation, IRoundStats } from '../types/models.types.js';

export interface MethodResult {
    mean: number;
    median: number;
    stdDev: number;
    variance: number;
    cv: number;
    range: [number, number];
    iqr: number;
    outlierEstimationIds: string[];
    // Method-specific results
    metricaResultados: Record<string, any>;
}

export interface IBaseEstimationMethod {
    calculate(estimations: IEstimation[]): MethodResult;
}
