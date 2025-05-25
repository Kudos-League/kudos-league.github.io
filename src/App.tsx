import React from 'react';

import { Suspense } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "redux_store/store";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import AppNavigator from "@/components/AppNavigator";

import { ErrorBoundary } from 'react-error-boundary';
import { BrowserRouter } from 'react-router-dom';

function ErrorFallback() {
  return <div>Error loading</div>;
}

export default function App() {
  return (
    <ReduxProvider store={store}>
      <Suspense fallback={<div>Loading app...</div>}>
        <ErrorBoundary FallbackComponent={ErrorFallback} onError={console.error}>
          <AuthProvider>
            <AppCore />
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

// noop
