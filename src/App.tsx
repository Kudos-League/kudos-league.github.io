import React from 'react';

import { Suspense } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from 'redux_store/store';
import { ErrorBoundary } from 'react-error-boundary';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import AppNavigator from '@/components/navigation/AppNavigator';
import queryClient from './shared/api/client';

function ErrorFallback() {
    return <div>Error loading</div>;
}

export default function App() {
    return (
        <ReduxProvider store={store}>
            <Suspense fallback={<div>Loading app...</div>}>
                <ErrorBoundary
                    FallbackComponent={ErrorFallback}
                    onError={console.error}
                >
                    <AuthProvider>
                        <QueryClientProvider client={queryClient}>
                            <NotificationsProvider>
                                <ThemeProvider>
                                    <AppCore />
                                </ThemeProvider>
                            </NotificationsProvider>
                            <ReactQueryDevtools initialIsOpen={false} />
                        </QueryClientProvider>
                    </AuthProvider>
                </ErrorBoundary>
            </Suspense>
        </ReduxProvider>
    );
}

function AppCore() {
    const { loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <BrowserRouter>
            <AppNavigator />
        </BrowserRouter>
    );
}
