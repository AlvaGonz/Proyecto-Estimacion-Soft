import { Estimation } from '../types';
import { fetchApi } from '../utils/api';

export const estimationService = {
    async getEstimationsByRound(roundId: string): Promise<Estimation[]> {
        return fetchApi<Estimation[]>(`/rounds/${roundId}/estimations`);
    },

    async submitEstimation(roundId: string, value: number, justification: string): Promise<Estimation> {
        return fetchApi<Estimation>(`/rounds/${roundId}/estimations`, {
            method: 'POST',
            body: { value, justification }
        });
    },

    async updateEstimation(estimationId: string, value: number, justification: string): Promise<Estimation> {
        return fetchApi<Estimation>(`/estimations/${estimationId}`, {
            method: 'PATCH',
            body: { value, justification }
        });
    }
};
