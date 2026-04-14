import { Task } from '../types';
import { fetchApi } from '../utils/api';

export const taskService = {
    async getTasks(projectId: string): Promise<Task[]> {
        return fetchApi<Task[]>(`/projects/${projectId}/tasks`);
    },

    async createTask(projectId: string, data: Partial<Task>): Promise<Task> {
        return fetchApi<Task>(`/projects/${projectId}/tasks`, {
            method: 'POST',
            body: {
                title: data.title,
                description: data.description
            }
        });
    },

    async updateTask(projectId: string, taskId: string, data: Partial<Task>): Promise<Task> {
        return fetchApi<Task>(`/projects/${projectId}/tasks/${taskId}`, {
            method: 'PATCH',
            body: data
        });
    },

    async finalizeTask(projectId: string, taskId: string): Promise<Task> {
        return fetchApi<Task>(`/projects/${projectId}/tasks/${taskId}/finalize`, {
            method: 'PATCH'
        });
    }
};
