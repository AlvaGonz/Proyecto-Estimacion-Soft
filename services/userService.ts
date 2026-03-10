import { fetchApi } from '../utils/api';
import { UserRole } from '../types';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: string;
}

export const userService = {
    async getAllUsers(): Promise<User[]> {
        const response = await fetchApi<{ users: User[] }>('/users');
        return response.users || [];
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
