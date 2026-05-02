import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { routes } from '@/routes';

import Navbar from './Navbar';
import AppSidebar from './Sidebar';
import DMsModal from '../messages/DMsModal';
import SearchModal from './SearchModal';
import MobileTabBar from './MobileTabBar';
import { useAuth } from '@/contexts/useAuth';
import { useDMs } from '@/contexts/DMsContext';

const Layout: React.FC = () => {
    const { isLoggedIn, user, logout, masquerade, stopMasquerade } = useAuth();
    const { isOpen: dmsModalOpen, openDMs, closeDMs } = useDMs();
    const [showDropdown, setShowDropdown] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchModalOpen, setSearchModalOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const isAuthRoute =
        location.pathname === routes.login ||
        location.pathname === routes.signUp ||
        location.pathname === '/sign-up' ||
        location.pathname === routes.forgotPassword ||
        location.pathname === routes.resetPassword;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const sidebar = document.getElementById('mobile-sidebar');
            const hamburger = document.getElementById('hamburger-button');
            const dropdown = document.getElementById('profile-dropdown');
            const profileButton = document.getElementById('profile-button');

            if (
                sidebarOpen &&
                sidebar &&
                hamburger &&
                !sidebar.contains(event.target as Node) &&
                !hamburger.contains(event.target as Node)
            ) {
                setSidebarOpen(false);
            }

            if (
                showDropdown &&
                dropdown &&
                profileButton &&
                !dropdown.contains(event.target as Node) &&
                !profileButton.contains(event.target as Node)
            ) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, [sidebarOpen, showDropdown]);

    useEffect(() => {
        setSidebarOpen(false);
        setShowDropdown(false);
    }, [location.pathname]);

    const handleLogout = () => {
        logout();
        setShowDropdown(false);
        navigate(routes.home);
    };

    const handleStopMasquerade = async () => {
        await stopMasquerade();
        navigate(routes.admin);
    };

    const isDevMode =
        process.env.REACT_APP_BACKEND_URI?.includes('localhost') ||
        process.env.REACT_APP_BACKEND_URI?.includes('api-dev');

    const handleBrandClick = (e: React.MouseEvent) => {
        if (isDevMode) {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('toggle-devtools'));
        }
    };

    const brandElement = (
        <Link
            to={routes.home}
            onClick={handleBrandClick}
            className='text-m font-semibold text-black dark:text-white hover:opacity-80 transition-opacity cursor-pointer flex flex-col flex-shrink-0'
        >
            <img
                src={`${process.env.PUBLIC_URL}/logo.webp`}
                alt='Kudos League'
                className='h-6 w-auto sm:h-8'
            />
        </Link>
    );

    if (isAuthRoute) {
        return (
            <div className='min-h-screen min-h-[100dvh] bg-slate-950'>
                <Outlet />
            </div>
        );
    }

    return (
        <div className='flex height-dvh'>
            {/* Sidebar for desktop, mobile hamburger menu */}
            <AppSidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                isLoggedIn={!!isLoggedIn}
                isAdmin={user?.admin}
                brand={brandElement}
            />

            {/* DMs Modal */}
            <DMsModal open={dmsModalOpen} onClose={closeDMs} />

            {/* Search Modal */}
            <SearchModal
                open={searchModalOpen}
                onClose={() => setSearchModalOpen(false)}
            />

            {/* Main content area - offset by sidebar width on desktop when logged in */}
            <div
                className={`flex-1 flex flex-col min-w-0 ${isLoggedIn ? 'lg:ml-20' : ''}`}
            >
                {masquerade?.active && (
                    <div className='sticky top-0 z-[70] flex flex-wrap items-center justify-center gap-x-3 gap-y-2 bg-amber-400 px-3 py-2 text-center text-sm font-semibold text-slate-950 shadow'>
                        <span>
                            Masquerading as{' '}
                            {user?.username ??
                                masquerade.targetUser?.username ??
                                'user'}
                            . Original admin:{' '}
                            {masquerade.originalAdmin?.username ?? 'admin'}.
                        </span>
                        <button
                            type='button'
                            onClick={handleStopMasquerade}
                            className='rounded-md bg-slate-950 px-3 py-1 text-sm text-white hover:bg-slate-800 disabled:opacity-60'
                        >
                            Exit
                        </button>
                    </div>
                )}
                <Navbar
                    onOpenSidebar={() => setSidebarOpen(true)}
                    onOpenDMs={() => openDMs()}
                    onOpenSearch={() => setSearchModalOpen(true)}
                    isLoggedIn={!!isLoggedIn}
                    user={user ?? undefined}
                    onLogout={handleLogout}
                    brand={brandElement}
                />

                {/* Mobile Tab Bar - only shown when logged in */}
                {isLoggedIn && <MobileTabBar />}

                <main className='flex-1 overflow-y-auto main-scroll-container'>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
