import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AvatarComponent from '@/components/users/Avatar';
import HeaderBell from '@/components/notifications/NotificationsBell';

import {
    HomeIcon,
    EnvelopeIcon,
    UserCircleIcon,
    InformationCircleIcon,
    ArrowRightOnRectangleIcon,
    UserPlusIcon,
    Bars3Icon
} from '@heroicons/react/24/outline';
import Sidebar from './Sidebar';

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
        <footer className='bg-white border-t border-gray-200 px-4 py-2 text-sm text-gray-700 md:hidden'>
            <div className='flex justify-around items-center gap-4'>
                {isLoggedIn ? (
                    <>
                        <FooterLink to='/' icon={HomeIcon} label='Home' />
                        <FooterLink to='/dms' icon={EnvelopeIcon} label='DMs' />
                        <FooterLink
                            to={`/user/${user.id}`}
                            icon={UserCircleIcon}
                            label='My Profile'
                        />
                    </>
                ) : (
                    <>
                        <FooterLink
                            to='/about'
                            icon={InformationCircleIcon}
                            label='About'
                        />
                        <FooterLink
                            to='/login'
                            icon={ArrowRightOnRectangleIcon}
                            label='Login'
                        />
                        <FooterLink
                            to='/sign-up'
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

    // Helper function to check if a path is active
    const isActivePath = (path: string) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    // Close sidebar and dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const sidebar = document.getElementById('mobile-sidebar');
            const hamburger = document.getElementById('hamburger-button');
            const dropdown = document.getElementById('profile-dropdown');
            const profileButton = document.getElementById('profile-button');
            
            // Close mobile sidebar
            if (sidebarOpen && sidebar && hamburger && 
                !sidebar.contains(event.target as Node) && 
                !hamburger.contains(event.target as Node)) {
                setSidebarOpen(false);
            }
            
            // Close profile dropdown
            if (showDropdown && dropdown && profileButton &&
                !dropdown.contains(event.target as Node) &&
                !profileButton.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [sidebarOpen, showDropdown]);

    // Close sidebar and dropdown on route change
    useEffect(() => {
        setSidebarOpen(false);
        setShowDropdown(false);
    }, [location.pathname]);

    const handleLogout = () => {
        logout();
        setShowDropdown(false);
        navigate('/'); // Redirect to home page after logout
    };

    return (
        <div className='flex h-screen'>
            <Sidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onLinkClick={() => setSidebarOpen(false)}
                isLoggedIn={!!isLoggedIn}
                isAdmin={!!user?.admin}
                brand={<span className="text-lg font-semibold text-gray-800">Kudos League</span>}
            />

            {/* Main Content */}
            <div className='flex-1 flex flex-col min-w-0 lg:pl-72'>
                <header className='flex justify-between items-center px-4 md:px-6 py-4 shadow bg-white'>
                    <div className='flex items-center gap-3'>
                        {/* Hamburger Menu - only visible on mobile */}
                        <button
                            id="hamburger-button"
                            onClick={() => setSidebarOpen(true)}
                            className='lg:hidden p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        >
                            <Bars3Icon className='w-6 h-6' />
                        </button>
                        <h1 className='text-lg md:text-xl font-semibold text-gray-800'>
                            Kudos League
                        </h1>
                    </div>
                    <div className='relative'>
                        {isLoggedIn && user ? (
                            <>
                                <button
                                    id="profile-button"
                                    onClick={() =>
                                        setShowDropdown(!showDropdown)
                                    }
                                    className='flex items-center gap-2'
                                >
                                    {user.avatar ? (
                                        <AvatarComponent
                                            username={user.username}
                                            avatar={user.avatar}
                                            size={32}
                                        />
                                    ) : (
                                        <div className='w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-bold text-gray-700'>
                                            {user.username?.charAt(0) || 'U'}
                                        </div>
                                    )}
                                    <HeaderBell />
                                </button>
                                {showDropdown && (
                                    <div 
                                        id="profile-dropdown"
                                        className='absolute right-0 mt-2 bg-white border shadow-md rounded w-40 z-10'
                                    >
                                        <button
                                            className='w-full px-4 py-2 text-left hover:bg-gray-100'
                                            onClick={() => {
                                                navigate(
                                                    '/user/' + user.id
                                                );
                                                setShowDropdown(false);
                                            }}
                                        >
                                            Profile
                                        </button>
                                        <button
                                            className='w-full px-4 py-2 text-left text-red-500 hover:bg-gray-100'
                                            onClick={handleLogout}
                                        >
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className='flex gap-2'>
                                <button
                                    className='border border-blue-500 text-blue-500 px-3 md:px-4 py-1 rounded hover:bg-blue-50 text-sm'
                                    onClick={() => navigate('/login')}
                                >
                                    LOG IN
                                </button>
                                <button
                                    className='bg-blue-500 text-white px-3 md:px-4 py-1 rounded hover:bg-blue-600 text-sm'
                                    onClick={() => navigate('/sign-up')}
                                >
                                    SIGN UP
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                <main className='flex-1 overflow-y-auto p-4 md:p-6'>
                    <Outlet />
                </main>

                <LayoutFooter />
            </div>
        </div>
    );
};

export default Layout;
