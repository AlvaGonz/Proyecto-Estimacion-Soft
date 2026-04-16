import { fetchApi } from '../../../shared/api';

export interface AdminUser {
    id: string;
    _id?: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt?: string;
}

export interface ListUsersResult {
    users: AdminUser[];
    total: number;
    page: number;
    pages: number;
}

interface CreateUserData {
    name: string;
    email: string;
    password: string;
    role: string;
}

interface UpdateUserData {
    name?: string;
    role?: string;
    isActive?: boolean;
}

export const adminService = {
    async listUsers(filters?: { role?: string; isActive?: boolean; page?: number; signal?: AbortSignal }): Promise<ListUsersResult> {
        const params = new URLSearchParams();
        if (filters?.role) params.set('role', filters.role);
        if (filters?.isActive !== undefined) params.set('isActive', String(filters.isActive));
        if (filters?.page) params.set('page', String(filters.page));

        const query = params.toString() ? `?${params.toString()}` : '';
        return await fetchApi<ListUsersResult>(`/admin/users${query}`, { signal: filters?.signal });
    },

    async createUser(data: CreateUserData): Promise<AdminUser> {
        return await fetchApi<AdminUser>('/admin/users', {
            method: 'POST',
            body: data,
        });
    },

    async updateUser(id: string, data: UpdateUserData): Promise<AdminUser> {
        return await fetchApi<AdminUser>(`/admin/users/${id}`, {
            method: 'PATCH',
            body: data,
        });
    },

    async deactivateUser(id: string): Promise<void> {
        await fetchApi<void>(`/admin/users/${id}/deactivate`, {
            method: 'PATCH',
        });
    },

    async activateUser(id: string): Promise<void> {
        await fetchApi<void>(`/admin/users/${id}/activate`, {
            method: 'PATCH',
        });
    },

    async deleteUser(id: string): Promise<void> {
        await fetchApi<void>(`/admin/users/${id}`, {
            method: 'DELETE',
        });
    },

    async listProjects(): Promise<any[]> {
        return await fetchApi<any[]>('/admin/projects');
    },

    async archiveProject(id: string): Promise<void> {
        await fetchApi<void>(`/admin/projects/${id}/archive`, {
            method: 'PATCH',
        });
    },

    async deleteProject(id: string): Promise<void> {
        await fetchApi<void>(`/admin/projects/${id}`, {
            method: 'DELETE',
        });
    },

    async restoreProject(id: string): Promise<void> {
        await fetchApi<void>(`/admin/projects/${id}/restore`, {
            method: 'PATCH',
        });
    },

    /** Reassign a project's facilitator — Admin only. Uses the existing PATCH /projects/:id endpoint. */
    async reassignFacilitator(projectId: string, facilitatorId: string): Promise<void> {
        await fetchApi<void>(`/projects/${projectId}`, {
            method: 'PATCH',
            body: { facilitatorId },
        });
    },
};
