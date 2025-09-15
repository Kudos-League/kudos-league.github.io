import React from 'react';

import { Provider as ReduxProvider } from 'react-redux';
import { store } from 'redux_store/store';
import { ErrorBoundary } from 'react-error-boundary';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { AuthProvider, useAuth } from '@/contexts/useAuth';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import ConnectingOverlay from '@/components/common/ConnectingOverlay';

import AppNavigator from '@/components/navigation/AppNavigator';
import queryClient from './shared/api/client';
import Spinner from './components/common/Spinner';
import Alert from './components/common/Alert';
import AlertHost from '@/components/common/AlertHost';

function ErrorFallback({ error }: { error: string[] }) {
    return (
        <Alert
            className='w-full'
            type='danger'
            title='Error loading page'
            message={
                Array.isArray(error)
                    ? error.join('\n')
                    : (error as any).toString()
            }
        />
    );
}

export default function App() {
    return (
        <ReduxProvider store={store}>
            <ErrorBoundary
                FallbackComponent={ErrorFallback}
                onError={console.error}
            >
                <QueryClientProvider client={queryClient}>
                    <AuthProvider>
                        <NotificationsProvider>
                            <ThemeProvider>
                                <WebSocketProvider>
                                    <AppCore />
                                    <AlertHost />
                                    <ConnectingOverlay />
                                </WebSocketProvider>
                            </ThemeProvider>
                        </NotificationsProvider>
                        <ReactQueryDevtools initialIsOpen={false} />
                    </AuthProvider>
                </QueryClientProvider>
            </ErrorBoundary>
        </ReduxProvider>
    );
}

function AppCore() {
    const { loading } = useAuth();
    if (loading) return <Spinner text='Logging in...' />;

    return (
        <BrowserRouter>
            <AppNavigator />
        </BrowserRouter>
    );
}

// noop 
