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

export async function fetchApi<T = any>(endpoint: string, options: ApiRequestInit = {}): Promise<T> {
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

    const json: ApiResponse<T> = await response.json();

    if (!response.ok || !json.success) {
        const errorMessage = json.message || 'Error en la petición';
        throw new Error(errorMessage);
    }

    return json.data as T;
}

