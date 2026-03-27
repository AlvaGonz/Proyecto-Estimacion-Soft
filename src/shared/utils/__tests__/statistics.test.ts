import { describe, it, expect } from 'vitest';
import { calculateRoundStats } from '../statistics';
import { Estimation } from '../../../types';

describe('calculateRoundStats', () => {
  const baseEstimations: Estimation[] = [
    { id: 'e1', value: 3, roundId: 'r1', taskId: 't1', expertId: 'u1', justification: '', timestamp: 0 },
    { id: 'e2', value: 5, roundId: 'r1', taskId: 't1', expertId: 'u2', justification: '', timestamp: 0 },
    { id: 'e3', value: 5, roundId: 'r1', taskId: 't1', expertId: 'u3', justification: '', timestamp: 0 },
    { id: 'e4', value: 7, roundId: 'r1', taskId: 't1', expertId: 'u4', justification: '', timestamp: 0 },
  ];

  it('calcula la media correctamente', () => {
    const stats = calculateRoundStats(baseEstimations);
    expect(stats.mean).toBe(5); // (3+5+5+7)/4 = 5
  });

  it('calcula la mediana correctamente con número par de estimaciones', () => {
    const stats = calculateRoundStats(baseEstimations);
    expect(stats.median).toBe(5); // mediana de [3, 5, 5, 7] es (5+5)/2 = 5
  });

  it('calcula el rango correctamente', () => {
    const stats = calculateRoundStats(baseEstimations);
    expect(stats.range).toEqual([3, 7]);
  });

  it('calcula el CV correctamente', () => {
    const stats = calculateRoundStats(baseEstimations);
    // (stdDev / mean) * 100
    // mean = 5
    // variance = ((3-5)^2 + (5-5)^2 + (5-5)^2 + (7-5)^2) / 4 = (4 + 0 + 0 + 4) / 4 = 2
    // stdDev = sqrt(2) approx 1.4142
    // cv = (1.4142 / 5) * 100 = 28.284...
    expect(stats.coefficientOfVariation).toBeCloseTo(28.28, 1);
  });

  it('detecta outliers correctamente usando IQR', () => {
    // values = [3, 5, 5, 7, 100]
    // n = 5
    // q1 = values[floor(5*0.25)] = values[1] = 5
    // q3 = values[floor(5*0.75)] = values[3] = 7
    // iqr = 7 - 5 = 2
    // upperBound = 7 + 1.5 * 2 = 10
    // lowerBound = 5 - 1.5 * 2 = 2
    const withOutlier: Estimation[] = [
      ...baseEstimations,
      { id: 'e5', value: 100, roundId: 'r1', taskId: 't1', expertId: 'u5', justification: '', timestamp: 0 },
    ];
    const stats = calculateRoundStats(withOutlier);
    expect(stats.outlierEstimationIds).toContain('e5');
    expect(stats.outlierEstimationIds).not.toContain('e1');
  });

  it('retorna arrays vacíos de outliers cuando todos convergen', () => {
    const convergent: Estimation[] = [
      { id: 'e1', value: 5, roundId: 'r1', taskId: 't1', expertId: 'u1', justification: '', timestamp: 0 },
      { id: 'e2', value: 5, roundId: 'r1', taskId: 't1', expertId: 'u2', justification: '', timestamp: 0 },
      { id: 'e3', value: 6, roundId: 'r1', taskId: 't1', expertId: 'u3', justification: '', timestamp: 0 },
    ];
    const stats = calculateRoundStats(convergent);
    expect(stats.outlierEstimationIds).toHaveLength(0);
  });

  it('retorna ceros con array vacío sin lanzar error', () => {
    const stats = calculateRoundStats([]);
    expect(stats.mean).toBe(0);
    expect(stats.outlierEstimationIds).toHaveLength(0);
  });
});
