import { Project, AuditEntry } from '../types';
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
            body: data,
        });
    },

    async updateProject(id: string, data: Partial<Project>): Promise<Project> {
        return fetchApi<Project>(`/projects/${id}`, {
            method: 'PATCH',
            body: data,
        });
    },

    async getAuditLogs(id: string): Promise<AuditEntry[]> {
        return fetchApi<AuditEntry[]>(`/projects/${id}/audit-logs`);
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
    },

    async deleteProject(id: string): Promise<void> {
        return fetchApi<void>(`/projects/${id}`, {
            method: 'DELETE'
        });
    },

    async uploadAttachment(id: string, file: File): Promise<any> {
        const formData = new FormData();
        formData.append('file', file);
        return fetchApi<any>(`/projects/${id}/upload`, {
            method: 'POST',
            body: formData
        });
    }
};
