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
import { useAuth } from '@/contexts/useAuth';

type FooterLinkProps = {
    to: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    label: string;
};

const FooterLink: React.FC<FooterLinkProps> = ({ to, icon: Icon, label }) => (
    <Link
        to={to}
        className='flex flex-col items-center text-gray-600 hover:text-blue-600'
    >
        <Icon className='w-6 h-6' />
        <div className='text-xs'>{label}</div>
    </Link>
);

const LayoutFooter: React.FC = () => {
    const { isLoggedIn, user } = useAuth();

    return (
        <footer className='border-t border-gray-200 px-4 py-2 text-sm text-gray-700 md:hidden'>
            <div className='flex justify-around items-center gap-4'>
                {isLoggedIn ? (
                    <>
                        <FooterLink
                            to={routes.home}
                            icon={HomeIcon}
                            label='Home'
                        />
                        <FooterLink
                            to={routes.dms}
                            icon={EnvelopeIcon}
                            label='DMs'
                        />
                        <FooterLink
                            to={routes.user[user!.id]}
                            icon={UserCircleIcon}
                            label='My Profile'
                        />
                    </>
                ) : (
                    <>
                        <FooterLink
                            to={routes.about}
                            icon={InformationCircleIcon}
                            label='About'
                        />
                        <FooterLink
                            to={routes.login}
                            icon={ArrowRightOnRectangleIcon}
                            label='Login'
                        />
                        <FooterLink
                            to={routes.signUp}
                            icon={UserPlusIcon}
                            label='Register'
                        />
                    </>
                )}
            </div>
        </footer>
    );
};

const Layout: React.FC = () => {
    const { isLoggedIn, user, logout } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
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

    return (
        <div className='flex h-screen'>
            <div className='flex-1 flex flex-col min-w-0'>
                <Navbar
                    onOpenSidebar={() => setSidebarOpen(true)}
                    isLoggedIn={!!isLoggedIn}
                    user={user ?? undefined}
                    onLogout={handleLogout}
                    brand={
                        <Link
                            to={routes.home}
                            className='text-lg font-semibold text-black dark:text-white hover:opacity-80 transition-opacity cursor-pointer'
                        >
                            Kudos League
                        </Link>
                    }
                />

                <main className='flex-1 overflow-y-auto p-4 md:p-6'>
                    <Outlet />
                </main>

                <LayoutFooter />
            </div>
        </div>
    );
};

export default Layout;
