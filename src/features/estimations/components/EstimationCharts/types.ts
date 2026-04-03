export interface EstimationData {
  value: number;
  isOutlier?: boolean;
}

export interface RoundData {
  roundNumber: number;
  mean: number;
  median: number;
  stdDev: number;
  estimations: EstimationData[];
}
