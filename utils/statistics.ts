
import { Estimation, RoundStats } from '../types';

export const calculateRoundStats = (estimations: Estimation[]): RoundStats => {
  const values = estimations.map(e => e.value).sort((a, b) => a - b);
  const n = values.length;
  
  if (n === 0) return {
    mean: 0, median: 0, stdDev: 0, variance: 0, 
    coefficientOfVariation: 0, range: [0, 0], iqr: 0, outliers: []
  };

  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  
  const median = n % 2 !== 0 
    ? values[Math.floor(n / 2)] 
    : (values[n / 2 - 1] + values[n / 2]) / 2;

  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  const cv = (stdDev / mean) * 100;

  // IQR Outlier Detection
  const q1 = values[Math.floor(n * 0.25)];
  const q3 = values[Math.floor(n * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const outliers = estimations
    .filter(e => e.value < lowerBound || e.value > upperBound)
    .map(e => e.id);

  return {
    mean: Number(mean.toFixed(2)),
    median: Number(median.toFixed(2)),
    stdDev: Number(stdDev.toFixed(2)),
    variance: Number(variance.toFixed(2)),
    coefficientOfVariation: Number(cv.toFixed(2)),
    range: [values[0], values[n - 1]],
    iqr: Number(iqr.toFixed(2)),
    outliers
  };
};
