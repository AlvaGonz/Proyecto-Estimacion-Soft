import type { Estimation, ConvergenceAnalysis, ConvergenceConfig } from '../types';

export interface ConvergenceResult {
  converged: boolean;
  recommendation: string;
  cv: number;
  outlierCount: number;
  outlierPercent: number;
}

export interface EstimationWithExpert extends Estimation {
  expertLabel: string;
}

export const CONVERGENCE_DEFAULTS: ConvergenceConfig = {
  cvThreshold: 0.25,
  maxOutlierPercent: 0.30
};

export const convergenceService = {
  /**
   * Add anonymous expert labels (Experto A, B, C...) to estimations
   * RF019: Vista comparativa anónima
   */
  addAnonymousLabels(estimations: Estimation[]): EstimationWithExpert[] {
    return estimations.map((est, index) => ({
      ...est,
      expertLabel: `Experto ${String.fromCharCode(65 + (index % 26))}`
    }));
  },

  /**
   * Calculate coefficient of variation from estimations
   * RF020: Evaluación de convergencia
   */
  calculateCV(estimations: Estimation[]): number {
    if (!estimations || estimations.length < 2) return 0;
    
    const values = estimations.map(e => e.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    if (mean === 0) return 0;
    
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return Number((stdDev / mean).toFixed(2));
  },

  /**
   * Evaluate convergence based on CV and outliers
   * RF020: Evaluación de convergencia
   */
  evaluateConvergence(
    cv: number,
    totalEstimations: number,
    outlierCount: number,
    config: ConvergenceConfig = CONVERGENCE_DEFAULTS
  ): ConvergenceResult {
    if (totalEstimations === 0) {
      return {
        converged: false,
        recommendation: 'No hay estimaciones para evaluar.',
        cv: 0,
        outlierCount: 0,
        outlierPercent: 0
      };
    }

    const outlierPercent = outlierCount / totalEstimations;
    const isCvAcceptable = cv <= config.cvThreshold;
    const isOutlierAcceptable = outlierPercent <= config.maxOutlierPercent;

    let recommendation = '';
    
    if (isCvAcceptable && isOutlierAcceptable) {
      return {
        converged: true,
        recommendation: 'El grupo ha alcanzado una convergencia aceptable. Se puede usar la mediana o moda como valor final.',
        cv,
        outlierCount,
        outlierPercent: Number(outlierPercent.toFixed(2))
      };
    }

    if (!isCvAcceptable) {
      recommendation += `Alto nivel de dispersión (CV: ${(cv * 100).toFixed(1)}%). `;
    }
    if (!isOutlierAcceptable) {
      recommendation += `Demasiados valores atípicos (${(outlierPercent * 100).toFixed(1)}%). `;
    }
    recommendation += 'Se recomienda abrir una nueva ronda de discusión.';

    return {
      converged: false,
      recommendation,
      cv,
      outlierCount,
      outlierPercent: Number(outlierPercent.toFixed(2))
    };
  },

  /**
   * Get convergence level label
   * RF021: Indicadores visuales de consenso
   */
  getConvergenceLevel(cv: number, converged: boolean): 'Alta' | 'Media' | 'Baja' {
    if (converged || cv <= 0.15) return 'Alta';
    if (cv <= 0.35) return 'Media';
    return 'Baja';
  },

  /**
   * Get recommendation based on convergence
   * RF022: Recomendación del sistema
   */
  getRecommendation(result: ConvergenceResult): ConvergenceAnalysis {
    const level = this.getConvergenceLevel(result.cv, result.converged);
    
    let recommendation = '';
    if (result.converged) {
      recommendation = 'Finalizar tarea - Consenso alcanzado';
    } else if (level === 'Media') {
      recommendation = 'Nueva ronda - Mejora de consenso recomendada';
    } else {
      recommendation = 'Nueva ronda - Discusión adicional necesaria';
    }

    return {
      level,
      recommendation,
      aiInsights: result.recommendation
    };
  }
};
