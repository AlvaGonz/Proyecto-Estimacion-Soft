import { EstimationData } from './types';

// Calcular histograma a partir de estimaciones
export const calculateHistogram = (estimations: EstimationData[], bins: number = 5) => {
  if (estimations.length === 0) return [];
  
  const values = estimations.map(e => e.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const binWidth = range / bins;
  
  const histogram = Array(bins).fill(0).map((_, i) => ({
    range: `${Math.round(min + i * binWidth)}-${Math.round(min + (i + 1) * binWidth)}`,
    count: 0,
    min: min + i * binWidth,
    max: min + (i + 1) * binWidth,
  }));
  
  values.forEach(value => {
    const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
    histogram[binIndex].count++;
  });
  
  return histogram;
};

// Calcular outliers usando IQR
export const calculateOutliers = (estimations: EstimationData[]) => {
  if (estimations.length < 4) return { outliers: [], normal: estimations, q1: undefined, q3: undefined, median: estimations.length > 0 ? [...estimations].sort((a,b)=>a.value-b.value)[Math.floor(estimations.length/2)].value : undefined };
  
  const sorted = [...estimations].sort((a, b) => a.value - b.value);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  const q1 = sorted[q1Index].value;
  const q3 = sorted[q3Index].value;
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  return {
    outliers: sorted.filter(e => e.value < lowerBound || e.value > upperBound),
    normal: sorted.filter(e => e.value >= lowerBound && e.value <= upperBound),
    q1,
    q3,
    median: sorted[Math.floor(sorted.length / 2)]?.value
  };
};
