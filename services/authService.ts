import { UserRole, User } from '../types';

const API_BASE_URL = 'http://localhost:4000/api';

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

async function fetchWithAuth(url: string, options: any = {}) {
    const fullUrl = `${API_BASE_URL}${url}`;

    // Set credentials to 'include' to send/receive cookies
    options.credentials = 'include';

    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
        options.body = JSON.stringify(options.body);
        options.headers = {
            ...options.headers,
            'Content-Type': 'application/json'
        };
    }

    const response = await fetch(fullUrl, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Error en la petición');
    }

    return data;
}

export const authService = {
    async login(credentials: any): Promise<User> {
        const response = await fetchWithAuth('/auth/login', {
            method: 'POST',
            body: {
                email: credentials.email,
                password: credentials.password
            }
        });

        const backendUser = response.data.user;

        return {
            id: backendUser._id || backendUser.id,
            name: backendUser.name,
            email: backendUser.email,
            role: backendToRoleMap[backendUser.role] || UserRole.EXPERT
        };
    },

    async getMe(): Promise<User | null> {
        try {
            const response = await fetchWithAuth('/auth/me');
            const backendUser = response.data;

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
        return fetchWithAuth('/auth/logout', { method: 'POST' });
    }
};
