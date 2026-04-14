const API_BASE_URL = 'http://localhost:4000/api';

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: Record<string, string[]>;
}

export interface ApiRequestInit extends Omit<RequestInit, 'body'> {
    body?: any;
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

export async function fetchApi<T = any>(endpoint: string, options: ApiRequestInit = {}, retries = 1): Promise<T> {
    const fullUrl = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
        ...options as any,
        credentials: 'include',
        headers: {
            ...options.headers,
        },
    };

    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
        config.body = JSON.stringify(options.body);
        config.headers = {
            ...config.headers,
            'Content-Type': 'application/json',
        };
    } else if (options.body) {
        config.body = options.body;
    }

    const response = await fetch(fullUrl, config);

    if (response.status === 401 && !endpoint.includes('/auth/')) {
        // window.location.href = '/'; // Commented out to avoid reloading the page
        throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
    }

    if (response.status === 401 && retries === 0 && !endpoint.includes('/auth/login')) {
        window.dispatchEvent(new Event('auth:unauthorized'));
    }

    const json: ApiResponse<T> = await response.json().catch(() => ({ success: false, message: 'Invalid JSON response' }));

    if (!response.ok || !json.success) {
        // If we get a 401 here and it didn't match the refresh logic (e.g. retries === 0), it's a hard unauthorized
        // We exclude logout and refresh to avoid infinite loops during session cleanup
        if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/logout') && !endpoint.includes('/auth/refresh')) {
            window.dispatchEvent(new Event('auth:unauthorized'));
        }
        const errorMessage = json.message || 'Error en la petición';
        throw new Error(errorMessage);
    }

    return json.data as T;
}
