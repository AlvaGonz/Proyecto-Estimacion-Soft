import { describe, it, expect } from 'vitest';
import { calculateRoundStats, analyzeConvergence } from '../../shared/utils/statistics';

describe('Statistical Engine (Wideband Delphi)', () => {
    it('Calculates mean, median and standard deviation correctly', () => {
        const estimations = [
            { value: 10, participantId: '1' },
            { value: 12, participantId: '2' },
            { value: 11, participantId: '3' },
            { value: 13, participantId: '4' },
            { value: 11, participantId: '5' }
        ];
        
        const stats = calculateRoundStats(estimations as any);
        
        expect(stats.mean).toBeCloseTo(11.4);
        expect(stats.median).toBe(11);
        expect(stats.stdDev).toBeGreaterThan(0);
    });

    it('Calculates Coefficient of Variation (CV) correctly', () => {
        // High convergence: low spread
        const highConv = [
            { value: 10, participantId: '1' },
            { value: 10, participantId: '2' },
            { value: 11, participantId: '3' }
        ];
        const statsHigh = calculateRoundStats(highConv as any);
        expect(statsHigh.coefficientOfVariation).toBeLessThan(10);

        // Low convergence: high spread
        const lowConv = [
            { value: 10, participantId: '1' },
            { value: 50, participantId: '2' },
            { value: 100, participantId: '3' }
        ];
        const statsLow = calculateRoundStats(lowConv as any);
        expect(statsLow.coefficientOfVariation).toBeGreaterThan(50);
    });

    it('Identifies outliers using IQR method', () => {
        const estimations = [
            { id: 'e1', value: 10, participantId: '1' },
            { id: 'e2', value: 12, participantId: '2' },
            { id: 'e3', value: 11, participantId: '3' },
            { id: 'e4', value: 13, participantId: '4' },
            { id: 'e5', value: 50, participantId: '5' } // Outlier
        ];
        
        const stats = calculateRoundStats(estimations as any);
        expect(stats.outlierEstimationIds).toContain('e5');
        expect(stats.outlierEstimationIds).not.toContain('e1');
    });
});

describe('AI Convergence Verdict Logic', () => {
    it('Verdicts "Alta" when CV <= 15', () => {
        const analysis = analyzeConvergence(10);
        expect(analysis.level).toBe('Alta');
    });

    it('Verdicts "Baja" when CV > 15', () => { // Or CV > 35?
        const analysis = analyzeConvergence(40);
        expect(analysis.level).toBe('Baja');
    });
});
