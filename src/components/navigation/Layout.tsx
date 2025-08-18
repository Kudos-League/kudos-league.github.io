import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

import {
    HomeIcon,
    EnvelopeIcon,
    UserCircleIcon,
    InformationCircleIcon,
    ArrowRightOnRectangleIcon,
    UserPlusIcon
} from '@heroicons/react/24/outline';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

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
                <Navbar
                    onOpenSidebar={() => setSidebarOpen(true)}
                    isLoggedIn={!!isLoggedIn}
                    user={user ?? undefined}
                    onLogout={handleLogout}
                    brand={<span className="text-lg font-semibold text-gray-800 dark:text-white">Kudos League</span>}
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
