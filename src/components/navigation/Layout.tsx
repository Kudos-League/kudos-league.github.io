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
    Bars3Icon,
    XMarkIcon
} from '@heroicons/react/24/outline';

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

// New component for sidebar navigation links with active state
type SidebarLinkProps = {
    to: string;
    children: React.ReactNode;
    isActive?: boolean;
    onClick?: () => void;
};

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, children, isActive, onClick }) => (
    <Link 
        to={to} 
        onClick={onClick}
        className={`px-3 py-2 rounded-md transition-colors duration-200 whitespace-nowrap ${
            isActive 
                ? 'bg-blue-100 text-blue-700 font-semibold border-l-4 border-blue-500' 
                : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
        }`}
    >
        {children}
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

    const handleSidebarLinkClick = () => {
        setSidebarOpen(false);
    };

    const handleLogout = () => {
        logout();
        setShowDropdown(false);
        navigate('/'); // Redirect to home page after logout
    };

    return (
        <div className='flex h-screen'>
            {/* Desktop Sidebar - hidden on mobile */}
            <aside className='hidden md:block w-60 bg-white border-r border-gray-200 shadow-sm p-4'>
                <nav className='flex flex-col gap-1'>
                    <SidebarLink to='/' isActive={isActivePath('/')}>
                        Main
                    </SidebarLink>
                    {isLoggedIn && (
                        <>
                            <SidebarLink to='/create-post' isActive={isActivePath('/create-post')}>
                                Create Gift / Request
                            </SidebarLink>
                            <SidebarLink to='/donate' isActive={isActivePath('/donate')}>
                                Donate
                            </SidebarLink>
                            <SidebarLink to='/leaderboard' isActive={isActivePath('/leaderboard')}>
                                Leaderboard
                            </SidebarLink>
                            <SidebarLink to='/chat' isActive={isActivePath('/chat')}>
                                Forum
                            </SidebarLink>
                            <SidebarLink to='/events' isActive={isActivePath('/events')}>
                                Events
                            </SidebarLink>
                            {user?.admin && (
                                <SidebarLink to='/admin' isActive={isActivePath('/admin')}>
                                    Admin Dashboard
                                </SidebarLink>
                            )}
                        </>
                    )}
                </nav>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div className='fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden'>
                    <aside 
                        id="mobile-sidebar"
                        className='fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-50 p-4'
                    >
                        <div className='flex justify-between items-center mb-6'>
                            <h2 className='text-lg font-semibold text-gray-800'>Menu</h2>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className='p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            >
                                <XMarkIcon className='w-6 h-6' />
                            </button>
                        </div>
                        <nav className='flex flex-col gap-1'>
                            <SidebarLink to='/' isActive={isActivePath('/')} onClick={handleSidebarLinkClick}>
                                Main
                            </SidebarLink>
                            {isLoggedIn && (
                                <>
                                    <SidebarLink to='/create-post' isActive={isActivePath('/create-post')} onClick={handleSidebarLinkClick}>
                                        Create Gift / Request
                                    </SidebarLink>
                                    <SidebarLink to='/donate' isActive={isActivePath('/donate')} onClick={handleSidebarLinkClick}>
                                        Donate
                                    </SidebarLink>
                                    <SidebarLink to='/leaderboard' isActive={isActivePath('/leaderboard')} onClick={handleSidebarLinkClick}>
                                        Leaderboard
                                    </SidebarLink>
                                    <SidebarLink to='/chat' isActive={isActivePath('/chat')} onClick={handleSidebarLinkClick}>
                                        Forum
                                    </SidebarLink>
                                    <SidebarLink to='/events' isActive={isActivePath('/events')} onClick={handleSidebarLinkClick}>
                                        Events
                                    </SidebarLink>
                                    {user?.admin && (
                                        <SidebarLink to='/admin' isActive={isActivePath('/admin')} onClick={handleSidebarLinkClick}>
                                            Admin Dashboard
                                        </SidebarLink>
                                    )}
                                </>
                            )}
                        </nav>
                    </aside>
                </div>
            )}

            {/* Main Content */}
            <div className='flex-1 flex flex-col min-w-0'>
                <header className='flex justify-between items-center px-4 md:px-6 py-4 shadow bg-white'>
                    <div className='flex items-center gap-3'>
                        {/* Hamburger Menu - only visible on mobile */}
                        <button
                            id="hamburger-button"
                            onClick={() => setSidebarOpen(true)}
                            className='md:hidden p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100'
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
