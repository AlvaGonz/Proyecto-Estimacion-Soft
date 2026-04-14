import { fetchApi } from '../utils/api';
import { UserRole } from '../types';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: string;
    expertiseArea?: string;
}

export const userService = {
    async getAllUsers(filters?: { isActive?: boolean; role?: string }): Promise<User[]> {
        const params = new URLSearchParams();
        if (filters?.isActive !== undefined) params.set('isActive', String(filters.isActive));
        if (filters?.role) params.set('role', filters.role);
        const query = params.toString() ? `?${params.toString()}` : '';
        return await fetchApi<User[]>(`/users${query}`);
    },

    /** Returns only active experts — used in ProjectForm step 4 */
    async getActiveExperts(): Promise<User[]> {
        return await fetchApi<User[]>('/users?role=experto&isActive=true');
    },

    /** Returns only active facilitators — used in ProjectForm step 5 (admin only) */
    async getActiveFacilitators(): Promise<User[]> {
        return await fetchApi<User[]>('/users?role=facilitador&isActive=true');
    },

    async getUserById(id: string): Promise<User> {
        return await fetchApi<User>(`/users/${id}`);
    },

    async updateUser(id: string, data: Partial<User>): Promise<User> {
        return await fetchApi<User>(`/users/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }
};
