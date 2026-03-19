export interface MetricInput {
    id: string; // The estimation ID
    value: number; // The estimated value
}

export interface StatMetrics {
    mean: number;
    median: number;
    stdDev: number;
    variance: number;
    coefficientOfVariation: number;
    range: [number, number];
    iqr: number;
    outlierEstimationIds: string[];
}

export const statisticsService = {
    calculateMetrics(estimations: MetricInput[]): StatMetrics {
        if (!estimations || estimations.length === 0) {
            return {
                mean: 0,
                median: 0,
                stdDev: 0,
                variance: 0,
                coefficientOfVariation: 0,
                range: [0, 0],
                iqr: 0,
                outlierEstimationIds: []
            };
        }

        const values = estimations.map(e => e.value).sort((a, b) => a - b);
        const count = values.length;

        // Mean
        const mean = values.reduce((sum, val) => sum + val, 0) / count;

        // Median
        const mid = Math.floor(count / 2);
        const median = count % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;

        // Variance & Standard Deviation
        // Population variance formula
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / count;
        const stdDev = Math.sqrt(variance);

        // Coefficient of Variation (CV)
        const cv = mean === 0 ? 0 : stdDev / mean;

        // Range
        const range: [number, number] = [values[0], values[count - 1]];

        // IQR (Interquartile Range)
        const q1 = this.calculatePercentile(values, 25);
        const q3 = this.calculatePercentile(values, 75);
        const iqr = q3 - q1;

        // Outliers (IQR Rule)
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;

        const outlierEstimationIds = estimations
            .filter(e => e.value < lowerBound || e.value > upperBound)
            .map(e => e.id);

        return {
            mean: Number(mean.toFixed(2)),
            median: Number(median.toFixed(2)),
            stdDev: Number(stdDev.toFixed(2)),
            variance: Number(variance.toFixed(2)),
            coefficientOfVariation: Number(cv.toFixed(2)),
            range,
            iqr: Number(iqr.toFixed(2)),
            outlierEstimationIds
        };
    },

    calculatePercentile(sortedArray: number[], percentile: number): number {
        const index = (percentile / 100) * (sortedArray.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);

        if (lower === upper) {
            return sortedArray[lower];
        }

        const weight = index - lower;
        return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
    }
};
