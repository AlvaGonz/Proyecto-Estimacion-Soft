import { Comment } from '../types';
import { fetchApi } from '../utils/api';

export const discussionService = {
    async getComments(roundId: string): Promise<Comment[]> {
        return fetchApi<Comment[]>(`/rounds/${roundId}/comments`);
    },

    async addComment(roundId: string, content: string, isAnonymous: boolean): Promise<Comment> {
        return fetchApi<Comment>(`/rounds/${roundId}/comments`, {
            method: 'POST',
            body: { content, isAnonymous }
        });
    }
};
