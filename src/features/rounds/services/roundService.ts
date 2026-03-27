import { Round, ConvergenceAnalysis } from '../../../types';
import { fetchApi } from '../../../shared/api';

export const roundService = {
    async getRoundsByTask(projectId: string, taskId: string): Promise<Round[]> {
        return fetchApi<Round[]>(`/projects/${projectId}/rounds?taskId=${taskId}`);
    },

    async openRound(projectId: string, taskId: string): Promise<Round> {
        return fetchApi<Round>(`/projects/${projectId}/rounds`, {
            method: 'POST',
            body: { taskId }
        });
    },

    async closeRound(roundId: string): Promise<{ round: Round, analysis: ConvergenceAnalysis }> {
        const response = await fetchApi<{ round: Round, convergence: { converged: boolean, recommendation: string } }>(`/rounds/${roundId}/close`, {
            method: 'POST'
        });
        
        return {
            round: response.round,
            analysis: {
                level: response.convergence.converged ? 'Alta' : 'Baja',
                recommendation: response.convergence.recommendation
            }
        };
    }
};
