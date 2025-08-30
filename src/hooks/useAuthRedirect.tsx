import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { routes } from '@/routes';

/**
 * Hook that redirects unauthenticated users to login page
 * @param requireAdmin - If true, also checks if user is admin
 * @returns object with authentication status and user info
 */
export function useAuthRedirect(requireAdmin = false) {
    const { isLoggedIn, user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Don't redirect if still loading auth state
        if (loading) return;

        // Redirect if not logged in
        if (!isLoggedIn) {
            const returnUrl = encodeURIComponent(
                window.location.pathname + window.location.search
            );
            navigate(`${routes.login}?returnUrl=${returnUrl}`);
            return;
        }

        // Redirect if admin required but user is not admin
        if (requireAdmin && !user?.admin) {
            navigate(routes.home);
            return;
        }
    }, [isLoggedIn, user?.admin, loading, navigate, requireAdmin]);

    return {
        isLoggedIn,
        user,
        loading,
        isAuthorized: isLoggedIn && (!requireAdmin || user?.admin)
    };
}

export default useAuthRedirect;
