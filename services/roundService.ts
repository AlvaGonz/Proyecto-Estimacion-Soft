import { Round, ConvergenceAnalysis } from '../types';
import { fetchApi } from '../utils/api';

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
        return fetchApi<{ round: Round, analysis: ConvergenceAnalysis }>(`/rounds/${roundId}/close`, {
            method: 'POST'
        });
    }
};
