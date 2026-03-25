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
    async getAllUsers(): Promise<User[]> {
        return await fetchApi<User[]>('/users');
    },

    async getUserById(id: string): Promise<User> {
        if (!id || typeof id !== 'string' || id.includes('[object')) {
            console.error('userService: Invalid user ID provided:', id);
            throw new Error('Invalid user ID');
        }
        return await fetchApi<User>(`/users/${id}`);
    },

    async updateUser(id: string, data: Partial<User>): Promise<User> {
        return await fetchApi<User>(`/users/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }
};
