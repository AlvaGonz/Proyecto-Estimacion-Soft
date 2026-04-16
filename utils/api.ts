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

/** Build a `RequestInit` from our custom ApiRequestInit.
 *  Handles both JSON bodies and FormData transparently. */
function buildConfig(options: ApiRequestInit): RequestInit {
    const cfg: RequestInit = {
        ...options as any,
        credentials: 'include',
        headers: { ...options.headers },
    };

    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
        cfg.body = JSON.stringify(options.body);
        cfg.headers = { ...cfg.headers, 'Content-Type': 'application/json' };
    } else if (options.body) {
        // FormData or other body types — let the browser set Content-Type automatically
        cfg.body = options.body as BodyInit;
    }

    return cfg;
}

export async function fetchApi<T = any>(endpoint: string, options: ApiRequestInit = {}, retries = 1): Promise<T> {
    const fullUrl = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(fullUrl, buildConfig(options));

    // ─── Auto token-refresh on 401 ────────────────────────────────────────────
    if (response.status === 401 && retries > 0 && !endpoint.includes('/auth/')) {
        // Ensure only one refresh is in-flight at a time (concurrent request protection)
        if (!isRefreshing) {
            isRefreshing = true;
            refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
            })
                .then(r => r.ok)
                .catch(() => false)
                .finally(() => {
                    isRefreshing = false;
                    refreshPromise = null;
                });
        }

        const refreshed = await refreshPromise;

        if (refreshed) {
            // Retry the original request once with the refreshed token cookie
            return fetchApi<T>(endpoint, options, retries - 1);
        }

        // Refresh failed — session is truly expired, notify the app
        window.dispatchEvent(new Event('auth:unauthorized'));
        throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
    }

    const json: ApiResponse<T> = await response.json().catch(
        () => ({ success: false, message: 'Respuesta inválida del servidor' })
    );

    if (!response.ok || !json.success) {
        const errorMessage = json.message || 'Error en la petición';
        throw new Error(errorMessage);
    }

    return json.data as T;
}
