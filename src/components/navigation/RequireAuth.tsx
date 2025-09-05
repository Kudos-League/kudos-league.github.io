import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import Spinner from '@/components/common/Spinner';
import { useAuth } from '@/contexts/useAuth';
import { routes } from '@/routes';

type RequireAuthProps = {
    children: React.ReactElement;
    allow?: (ctx: { isLoggedIn: boolean; isAdmin?: boolean }) => boolean;
};

export default function RequireAuth({ children, allow }: RequireAuthProps) {
    const { loading, isLoggedIn, user } = useAuth();
    const location = useLocation();

    if (loading) return <Spinner text='Checking your authorization...' />;

    const permitted = allow
        ? allow({ isLoggedIn, isAdmin: user?.admin })
        : isLoggedIn;

    if (!permitted) {
        return (
            <Navigate to={routes.login} replace state={{ from: location }} />
        );
    }

    return children;
}
