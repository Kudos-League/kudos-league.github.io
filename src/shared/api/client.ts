import { QueryClient } from '@tanstack/react-query';
import { initReactQueryInterceptor } from '@/services/logCollector/reactQueryInterceptor';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 30_000
        },
        mutations: {
            retry: 0
        }
    }
});

// Initialize dev tools React Query logging (only in dev mode)
initReactQueryInterceptor(queryClient);

export default queryClient;
