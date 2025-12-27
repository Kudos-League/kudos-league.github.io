import LogCollectorService from './LogCollectorService';
import type { QueryClient } from '@tanstack/react-query';

/**
 * Initialize React Query interceptor to capture query/mutation events
 */
export function initReactQueryInterceptor(queryClient: QueryClient): void {
    const isDevMode =
        process.env.REACT_APP_BACKEND_URI?.includes('localhost') ||
        process.env.REACT_APP_BACKEND_URI?.includes('api-dev');

    if (!isDevMode) return;

    const service = LogCollectorService.getInstance();

    try {
        // Subscribe to query cache changes
        queryClient.getQueryCache().subscribe((event) => {
            if (!service.getEnabled()) return;

            try {
                const query = event.query;
                if (!query) return;
                const state = query.state;
                const queryKey = serializeQueryKey(query.queryKey);

                switch (event.type) {
                case 'added':
                    service.addLog({
                        type: 'react-query',
                        message: `→ Query: ${queryKey}`,
                        operation: 'query',
                        queryKey,
                        status: 'loading',
                    } as any);
                    break;

                case 'updated':
                    if (state.status === 'pending') {
                        service.addLog({
                            type: 'react-query',
                            message: `... Query: ${queryKey}`,
                            operation: 'query',
                            queryKey,
                            status: 'loading',
                        } as any);
                    }
                    else if (state.status === 'error') {
                        service.addLog({
                            type: 'react-query',
                            message: `✗ Query: ${queryKey} - Error`,
                            operation: 'query',
                            queryKey,
                            status: 'error',
                            error: state.error
                                ? String(state.error)
                                : 'Unknown error',
                        } as any);
                    }
                    else if (state.status === 'success') {
                        service.addLog({
                            type: 'react-query',
                            message: `✓ Query: ${queryKey}`,
                            operation: 'query',
                            queryKey,
                            status: 'success',
                            data: state.data,
                        } as any);
                    }
                    break;

                case 'removed':
                    service.addLog({
                        type: 'react-query',
                        message: `✗ Query removed: ${queryKey}`,
                        operation: 'query',
                        queryKey,
                    } as any);
                    break;
                }
            }
            catch (e) {
                console.error('[LogCollector ReactQuery] Failed to log query event:', e);
            }
        });

        // Subscribe to mutation cache changes
        queryClient.getMutationCache().subscribe((event) => {
            if (!service.getEnabled()) return;

            try {
                const mutation = event.mutation;
                if (!mutation) return;
                const state = mutation.state;

                switch (event.type) {
                case 'added':
                    service.addLog({
                        type: 'react-query',
                        message: `→ Mutation started`,
                        operation: 'mutation',
                        status: 'loading',
                    } as any);
                    break;

                case 'updated':
                    if (state.status === 'pending') {
                        service.addLog({
                            type: 'react-query',
                            message: `... Mutation in progress`,
                            operation: 'mutation',
                            status: 'loading',
                        } as any);
                    }
                    else if (state.status === 'error') {
                        service.addLog({
                            type: 'react-query',
                            message: `✗ Mutation failed`,
                            operation: 'mutation',
                            status: 'error',
                            error: state.error
                                ? String(state.error)
                                : 'Unknown error',
                        } as any);
                    }
                    else if (state.status === 'success') {
                        service.addLog({
                            type: 'react-query',
                            message: `✓ Mutation successful`,
                            operation: 'mutation',
                            status: 'success',
                            data: state.data,
                        } as any);
                    }
                    break;

                case 'removed':
                    service.addLog({
                        type: 'react-query',
                        message: `Mutation completed`,
                        operation: 'mutation',
                    } as any);
                    break;
                }
            }
            catch (e) {
                console.error('[LogCollector ReactQuery] Failed to log mutation event:', e);
            }
        });

        console.log('[LogCollector] React Query interceptor initialized');
    }
    catch (e) {
        console.error('[LogCollector] Failed to initialize React Query interceptor:', e);
    }
}

/**
 * Serialize query key array to string
 */
function serializeQueryKey(key: any[]): string {
    try {
        if (!Array.isArray(key)) return String(key);

        return key
            .map((k) => {
                if (typeof k === 'string') return k;
                if (typeof k === 'number') return String(k);
                if (typeof k === 'object') {
                    try {
                        return JSON.stringify(k);
                    }
                    catch {
                        return '[Object]';
                    }
                }
                return String(k);
            })
            .join(' / ');
    }
    catch (e) {
        return '[Invalid key]';
    }
}
