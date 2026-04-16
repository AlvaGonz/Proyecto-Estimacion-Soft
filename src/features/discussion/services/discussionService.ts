import { Comment } from '../../../types';
import { fetchApi } from '../../../shared/api';

export const discussionService = {
    async getComments(roundId: string): Promise<Comment[]> {
        return fetchApi<Comment[]>(`/rounds/${roundId}/comments`);
    },

    async getCommentsByTask(projectId: string, taskId: string): Promise<Comment[]> {
        return fetchApi<Comment[]>(`/projects/${projectId}/tasks/${taskId}/comments`);
    },

    async addComment(roundId: string, content: string, isAnonymous: boolean): Promise<Comment> {
        return fetchApi<Comment>(`/rounds/${roundId}/comments`, {
            method: 'POST',
            body: { content, isAnonymous }
        });
    },

    async addCommentToTask(projectId: string, taskId: string, content: string, isAnonymous: boolean): Promise<Comment> {
        return fetchApi<Comment>(`/projects/${projectId}/tasks/${taskId}/comments`, {
            method: 'POST',
            body: { content, isAnonymous }
        });
    }
};
