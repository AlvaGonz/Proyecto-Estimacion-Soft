const API_BASE_URL = 'http://localhost:4000/api';

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: Record<string, string[]>;
}

export async function fetchApi<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const fullUrl = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
        ...options,
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
    }

    const response = await fetch(fullUrl, config);
    const json: ApiResponse<T> = await response.json();

    if (!response.ok || !json.success) {
        const errorMessage = json.message || 'Error en la petición';
        throw new Error(errorMessage);
    }

    return json.data as T;
}
