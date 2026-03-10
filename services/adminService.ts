import { fetchApi } from '../utils/api';

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
    async listUsers(filters?: { role?: string; isActive?: boolean; page?: number }): Promise<ListUsersResult> {
        const params = new URLSearchParams();
        if (filters?.role) params.set('role', filters.role);
        if (filters?.isActive !== undefined) params.set('isActive', String(filters.isActive));
        if (filters?.page) params.set('page', String(filters.page));

        const query = params.toString() ? `?${params.toString()}` : '';
        return await fetchApi<ListUsersResult>(`/admin/users${query}`);
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
};
