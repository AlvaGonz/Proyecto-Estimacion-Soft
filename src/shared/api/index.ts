export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: Record<string, string[]>;
}

export class ApiError extends Error {
    public status: number;
    public data: any;

    constructor(status: number, message: string, data?: any) {
        super(message);
        this.status = status;
        this.data = data;
        this.name = 'ApiError';
    }
}

// Normalize endpoint safely (e.g. /auth/login)
const normalizeEndpoint = (endpoint: string) => endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function fetchWithConfig<T>(endpoint: string, options: RequestInit = {}, retries = 1): Promise<ApiResponse<T>> {
    const baseURL = (import.meta as any).env.VITE_API_URL || 'http://localhost:4000/api';
    const url = `${baseURL}${normalizeEndpoint(endpoint)}`;

    const headers = new Headers(options.headers || {});
    
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    const config: RequestInit = {
        ...options,
        headers,
        credentials: 'include', // Enforce httpOnly cookie exchange for JWT
    };

    try {
        const response = await fetch(url, config);
        const contentType = response.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');
        
        let responseData: any = null;
        if (isJson) {
            responseData = await response.json();
        }

        // Handle 401 Unauthorized
        if (response.status === 401 && retries > 0 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
            if (!isRefreshing) {
                isRefreshing = true;
                refreshPromise = fetch(`${baseURL}/auth/refresh`, { method: 'POST', credentials: 'include' })
                    .then(res => res.ok)
                    .catch(() => false)
                    .finally(() => {
                        isRefreshing = false;
                    });
            }

            const refreshSuccess = await refreshPromise;
            if (refreshSuccess) {
                // Retry the original request
                return fetchWithConfig<T>(endpoint, options, 0);
            } else {
                // Global handle 401: emitting event for App.tsx to catch
                window.dispatchEvent(new Event('auth:unauthorized'));
                throw new ApiError(401, 'Session expired', responseData);
            }
        }

        if (!response.ok || (responseData && responseData.success === false)) {
            throw new ApiError(
                response.status,
                responseData?.message || response.statusText || 'An error occurred during the request',
                responseData
            );
        }

        return (responseData as ApiResponse<T>) || { success: true, data: undefined as unknown as T };
    } catch (error) {
        if (error instanceof ApiError) {
            // Already emitting above if it's the specific refresh failure path,
            // but let's also catch simple 401s if retries were 0
            if (error.status === 401 && !endpoint.includes('/auth/login')) {
                window.dispatchEvent(new Event('auth:unauthorized'));
            }
            throw error;
        }
        throw new ApiError(
            500,
            error instanceof Error ? error.message : 'Unknown network error',
            null
        );
    }
}

export const api = {
    get: <T>(endpoint: string, options?: Omit<RequestInit, 'method' | 'body'>) => 
        fetchWithConfig<T>(endpoint, { ...options, method: 'GET' }),
        
    post: <T>(endpoint: string, data?: any, options?: Omit<RequestInit, 'method' | 'body'>) => 
        fetchWithConfig<T>(endpoint, { 
            ...options, 
            method: 'POST', 
            body: data instanceof FormData ? data : JSON.stringify(data) 
        }),
        
    put: <T>(endpoint: string, data?: any, options?: Omit<RequestInit, 'method' | 'body'>) => 
        fetchWithConfig<T>(endpoint, { 
            ...options, 
            method: 'PUT', 
            body: data instanceof FormData ? data : JSON.stringify(data) 
        }),
        
    patch: <T>(endpoint: string, data?: any, options?: Omit<RequestInit, 'method' | 'body'>) => 
        fetchWithConfig<T>(endpoint, { 
            ...options, 
            method: 'PATCH', 
            body: data instanceof FormData ? data : JSON.stringify(data) 
        }),
        
    delete: <T>(endpoint: string, options?: Omit<RequestInit, 'method' | 'body'>) => 
        fetchWithConfig<T>(endpoint, { ...options, method: 'DELETE' }),
};

/**
 * Legacy wrapper for fetchWithConfig to maintain compatibility
 */
export async function fetchApi<T>(endpoint: string, options: any = {}): Promise<T> {
    const { method = 'GET', body, ...rest } = options;
    const response = await fetchWithConfig<T>(endpoint, {
        method,
        body: body ? JSON.stringify(body) : undefined,
        ...rest
    });
    return response.data as T;
}
