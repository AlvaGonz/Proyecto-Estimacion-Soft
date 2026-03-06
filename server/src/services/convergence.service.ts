import { IConvergenceConfig } from '../types/models.types.js';

export interface ConvergenceResult {
    converged: boolean;
    recommendation: string;
}

export const convergenceService = {
    evaluateConsensus(
        cv: number,
        totalEstimations: number,
        outlierCount: number,
        config: IConvergenceConfig
    ): ConvergenceResult {
        if (totalEstimations === 0) {
            return {
                converged: false,
                recommendation: 'No hay estimaciones para evaluar.'
            };
        }

        const outlierPercent = outlierCount / totalEstimations;
        // Convergence invariants from Wideband Delphi definition
        const isCvAcceptable = cv <= config.cvThreshold;
        const isOutlierAcceptable = outlierPercent <= config.maxOutlierPercent;

        if (isCvAcceptable && isOutlierAcceptable) {
            return {
                converged: true,
                recommendation: 'El grupo ha alcanzado una convergencia aceptable. Se puede usar la mediana o moda como valor final.'
            };
        }

        let recommendation = '';
        if (!isCvAcceptable) {
            recommendation += `Alto nivel de dispersión (Coeficiente de Variación: ${(cv * 100).toFixed(1)}% > ${(config.cvThreshold * 100).toFixed(1)}%). `;
        }
        if (!isOutlierAcceptable) {
            recommendation += `Demasiados valores atípicos (${(outlierPercent * 100).toFixed(1)}% > ${(config.maxOutlierPercent * 100).toFixed(1)}%). `;
        }
        recommendation += 'Se recomienda abrir una nueva ronda de discusión.';

        return {
            converged: false,
            recommendation
        };
    }
};
