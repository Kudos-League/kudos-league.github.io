import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useQueryErrorResetBoundary, useQueryClient } from '@tanstack/react-query';
import Spinner from './Spinner';

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: (err: unknown, reset: () => void) => React.ReactNode;
  onReset?: () => void;
};

export function QueryBoundary({
    children,
    fallback = <Spinner />,
    errorFallback,
    onReset,
}: Props) {
    const { reset } = useQueryErrorResetBoundary();
    const qc = useQueryClient();

    return (
        <ErrorBoundary
            onReset={() => {
                reset();
                qc.invalidateQueries();

                onReset?.();
            }}
            fallbackRender={({ error, resetErrorBoundary }) => {
                if (errorFallback) return errorFallback(error, resetErrorBoundary);

                const message =
                    (error as any)?.message ??
                    (typeof error === 'string' ? error : 'Something went wrong.');

                return (
                    <div className="p-4 bg-red-50 text-red-700 rounded">
                        {message}
                        <button
                            className="ml-2 underline"
                            onClick={() => resetErrorBoundary()}
                        >
                            Retry
                        </button>
                    </div>
                );
            }}
        >
            <React.Suspense fallback={fallback}>{children}</React.Suspense>
        </ErrorBoundary>
    );
}
