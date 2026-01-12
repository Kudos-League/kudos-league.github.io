import LogCollectorService from './LogCollectorService';
import type { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

interface PendingRequest {
    startTime: number;
    method?: string;
    url?: string;
    requestHeaders?: Record<string, string>;
    requestBody?: any;
}

const pendingRequests = new Map<string, PendingRequest>();

/**
 * Generate request ID for tracking
 */
function generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sanitize sensitive headers
 */
function sanitizeHeaders(
    headers: Record<string, any> = {}
): Record<string, string> {
    const sanitized: Record<string, string> = {};
    const sensitiveHeaders = [
        'authorization',
        'cookie',
        'x-api-key',
        'x-auth-token'
    ];

    for (const [key, value] of Object.entries(headers)) {
        if (sensitiveHeaders.includes(key.toLowerCase())) {
            // Show only that header exists
            if (typeof value === 'string' && value.startsWith('Bearer')) {
                sanitized[key] = 'Bearer ***';
            }
            else {
                sanitized[key] = '***';
            }
        }
        else {
            sanitized[key] = String(value);
        }
    }

    return sanitized;
}

/**
 * Serialize request body safely
 */
function serializeRequestBody(config: AxiosRequestConfig): any {
    const { data, params } = config;

    // Skip serializing if it's FormData (for file uploads)
    if (data instanceof FormData) {
        return '[FormData]';
    }

    try {
        const body: any = {};

        if (data) {
            const serialized = JSON.stringify(data);
            if (serialized.length > 10000) {
                body.data = '[Large payload truncated...]';
            }
            else {
                body.data = data;
            }
        }

        if (params) {
            body.params = params;
        }

        return Object.keys(body).length > 0 ? body : undefined;
    }
    catch (e) {
        return '[Serialization error]';
    }
}

/**
 * Serialize response body safely
 */
function serializeResponseBody(data: any): any {
    try {
        const serialized = JSON.stringify(data);
        if (serialized.length > 10000) {
            return '[Large payload truncated...]';
        }
        return data;
    }
    catch (e) {
        return '[Serialization error]';
    }
}

/**
 * Create axios request interceptor
 */
export function createRequestInterceptor(_axios: any) {
    return (config: AxiosRequestConfig) => {
        const isDevMode =
            process.env.REACT_APP_BACKEND_URI?.includes('localhost') ||
            process.env.REACT_APP_BACKEND_URI?.includes('api-dev');

        if (!isDevMode) return config;

        const service = LogCollectorService.getInstance();
        if (!service.getEnabled()) return config;

        try {
            const requestId = generateRequestId();

            // Store request details for later use in response interceptor
            const pending: PendingRequest = {
                startTime: Date.now(),
                method: config.method?.toUpperCase(),
                url: config.url,
                requestHeaders: sanitizeHeaders(
                    config.headers as Record<string, any>
                ),
                requestBody: serializeRequestBody(config)
            };

            pendingRequests.set(requestId, pending);

            // Attach request ID to config for retrieval in response interceptor
            (config as any).__logRequestId = requestId;
        }
        catch (e) {
            console.error(
                '[LogCollector Network] Failed to process request:',
                e
            );
        }

        return config;
    };
}

/**
 * Create axios response interceptor
 */
export function createResponseInterceptor(_axios: any) {
    return (response: AxiosResponse) => {
        const isDevMode =
            process.env.REACT_APP_BACKEND_URI?.includes('localhost') ||
            process.env.REACT_APP_BACKEND_URI?.includes('api-dev');

        if (!isDevMode) return response;

        const service = LogCollectorService.getInstance();
        if (!service.getEnabled()) return response;

        try {
            const requestId = (response.config as any).__logRequestId;
            const pending = requestId ? pendingRequests.get(requestId) : null;

            if (!pending) return response;

            const duration = Date.now() - pending.startTime;
            const method = pending.method || 'UNKNOWN';
            const url = pending.url || '';
            const status = response.status;
            const statusText = response.statusText || '';

            const message = `${method} ${url} → ${status} ${statusText}`;

            service.addLog({
                type: 'network',
                message,
                method: method as any,
                url,
                status,
                statusText,
                duration,
                requestHeaders: pending.requestHeaders,
                requestBody: pending.requestBody,
                responseHeaders: sanitizeHeaders(
                    response.headers as Record<string, any>
                ),
                responseBody: serializeResponseBody(response.data)
            } as any);

            // Cleanup
            pendingRequests.delete(requestId);
        }
        catch (e) {
            console.error(
                '[LogCollector Network] Failed to process response:',
                e
            );
        }

        return response;
    };
}

/**
 * Create axios error interceptor
 */
export function createErrorInterceptor(_axios: any) {
    return (error: AxiosError | any) => {
        const isDevMode =
            process.env.REACT_APP_BACKEND_URI?.includes('localhost') ||
            process.env.REACT_APP_BACKEND_URI?.includes('api-dev');

        if (!isDevMode) return Promise.reject(error);

        const service = LogCollectorService.getInstance();
        if (!service.getEnabled()) return Promise.reject(error);

        try {
            const requestId = (error.config as any)?.__logRequestId;
            const pending = requestId ? pendingRequests.get(requestId) : null;

            if (pending) {
                const duration = Date.now() - pending.startTime;
                const method = pending.method || 'UNKNOWN';
                const url = pending.url || '';
                const status = error.response?.status;
                const statusText = error.response?.statusText;

                const message = `${method} ${url} → Error: ${error.message}`;

                service.addLog({
                    type: 'network',
                    message,
                    method: method as any,
                    url,
                    status,
                    statusText,
                    duration,
                    requestHeaders: pending.requestHeaders,
                    requestBody: pending.requestBody,
                    responseHeaders: error.response
                        ? sanitizeHeaders(
                              error.response.headers as Record<string, any>
                        )
                        : undefined,
                    responseBody: error.response
                        ? serializeResponseBody(error.response.data)
                        : undefined,
                    error: error.message
                } as any);

                // Cleanup
                pendingRequests.delete(requestId);
            }
        }
        catch (e) {
            console.error('[LogCollector Network] Failed to process error:', e);
        }

        return Promise.reject(error);
    };
}

/**
 * Initialize network interceptor with axios instance
 */
export function initNetworkInterceptor(axiosInstance: any): void {
    const isDevMode =
        process.env.REACT_APP_BACKEND_URI?.includes('localhost') ||
        process.env.REACT_APP_BACKEND_URI?.includes('api-dev');

    if (!isDevMode) return;

    try {
        axiosInstance.interceptors.request.use(
            createRequestInterceptor(axiosInstance)
        );
        axiosInstance.interceptors.response.use(
            createResponseInterceptor(axiosInstance),
            createErrorInterceptor(axiosInstance)
        );

        console.log('[LogCollector] Network interceptor initialized');
    }
    catch (e) {
        console.error(
            '[LogCollector] Failed to initialize network interceptor:',
            e
        );
    }
}
