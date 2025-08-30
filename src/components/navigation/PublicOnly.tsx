import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import Spinner from '@/components/common/Spinner';
import { useAuth } from '@/contexts/useAuth';
import { routes } from '@/routes';

export default function PublicOnly({
    children
}: {
    children: React.ReactElement;
}) {
    const { loading, isLoggedIn } = useAuth();
    const location = useLocation();
    if (loading) return <Spinner text='Hooking you up...' />;
    if (isLoggedIn) {
        const fallback = (location.state as any)?.from?.pathname || routes.home;
        return <Navigate to={fallback} replace />;
    }
    return children;
}
