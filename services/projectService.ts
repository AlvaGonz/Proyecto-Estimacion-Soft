import { Project } from '../types';
import { fetchApi } from '../utils/api';

export const projectService = {
    async getProjects(): Promise<Project[]> {
        return fetchApi<Project[]>('/projects');
    },

    async getProject(id: string): Promise<Project> {
        return fetchApi<Project>(`/projects/${id}`);
    },

    async createProject(data: Partial<Project>): Promise<Project> {
        return fetchApi<Project>('/projects', {
            method: 'POST',
            body: {
                name: data.name,
                description: data.description,
                unit: data.unit,
                expertIds: data.expertIds
            }
        });
    },

    async updateProject(id: string, data: Partial<Project>): Promise<Project> {
        return fetchApi<Project>(`/projects/${id}`, {
            method: 'PATCH',
            body: data
        });
    },

    async archiveProject(id: string): Promise<Project> {
        return fetchApi<Project>(`/projects/${id}/archive`, {
            method: 'POST'
        });
    },

    async manageExperts(id: string, action: 'add' | 'remove', expertIds: string[]): Promise<Project> {
        return fetchApi<Project>(`/projects/${id}/experts`, {
            method: 'PATCH',
            body: { action, expertIds }
        });
    }
};
