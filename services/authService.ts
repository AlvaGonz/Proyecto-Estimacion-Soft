import { UserRole, User } from '../types';
import { fetchApi } from '../utils/api';

// Map frontend role enum to backend role strings
const roleToBackendMap: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'admin',
    [UserRole.FACILITATOR]: 'facilitador',
    [UserRole.EXPERT]: 'experto'
};

// Map backend role strings back to frontend enum
const backendToRoleMap: Record<string, UserRole> = {
    'admin': UserRole.ADMIN,
    'facilitador': UserRole.FACILITATOR,
    'experto': UserRole.EXPERT
};

export const authService = {
    async login(credentials: any): Promise<User> {
        const data = await fetchApi<{ user: any }>('/auth/login', {
            method: 'POST',
            body: {
                email: credentials.email,
                password: credentials.password
            }
        });

        const backendUser = data.user;

        return {
            id: backendUser._id || backendUser.id,
            name: backendUser.name,
            email: backendUser.email,
            role: backendToRoleMap[backendUser.role] || UserRole.EXPERT
        };
    },

    async getMe(): Promise<User | null> {
        try {
            const backendUser = await fetchApi<any>('/auth/me');

            return {
                id: backendUser.id,
                name: backendUser.name || 'Usuario',
                email: backendUser.email,
                role: backendToRoleMap[backendUser.role] || UserRole.EXPERT
            };
        } catch (e) {
            return null;
        }
    },

    async logout() {
        return fetchApi('/auth/logout', { method: 'POST' });
    }
};
