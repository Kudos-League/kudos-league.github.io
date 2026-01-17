import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { routes } from '@/routes';

import {
    HomeIcon,
    EnvelopeIcon,
    UserCircleIcon,
    InformationCircleIcon,
    ArrowRightOnRectangleIcon,
    UserPlusIcon
} from '@heroicons/react/24/outline';
import Navbar from './Navbar';
import AppSidebar from './Sidebar';
import DMsModal from '../messages/DMsModal';
import SearchModal from './SearchModal';
import MobileTabBar from './MobileTabBar';
import { useAuth } from '@/contexts/useAuth';
import { useDMs } from '@/contexts/DMsContext';

const Layout: React.FC = () => {
    const { isLoggedIn, user, logout } = useAuth();
    const { isOpen: dmsModalOpen, openDMs, closeDMs } = useDMs();
    const [showDropdown, setShowDropdown] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchModalOpen, setSearchModalOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

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
