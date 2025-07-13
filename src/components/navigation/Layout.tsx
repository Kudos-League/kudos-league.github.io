import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AvatarComponent from '@/components/users/Avatar';

import {
    HomeIcon,
    EnvelopeIcon,
    UserCircleIcon,
    InformationCircleIcon,
    ArrowRightOnRectangleIcon,
    UserPlusIcon
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
};

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, children, isActive }) => (
    <Link 
        to={to} 
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
        <footer className='bg-white border-t border-gray-200 px-4 py-2 text-sm text-gray-700'>
            <div className='flex justify-around items-center gap-4'>
                {isLoggedIn ? (
                    <>
                        <FooterLink to='/' icon={HomeIcon} label='Feed' />
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
    const navigate = useNavigate();
    const location = useLocation();

    // Helper function to check if a path is active
    const isActivePath = (path: string) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <div className='flex h-screen'>
            {/* Sidebar */}
            <aside className='w-60 bg-white border-r border-gray-200 shadow-sm p-4'>
                <nav className='flex flex-col gap-1'>
                    <SidebarLink to='/' isActive={isActivePath('/')}>
                        Home
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

            {/* Main Content */}
            <div className='flex-1 flex flex-col'>
                <header className='flex justify-between items-center px-6 py-4 shadow bg-white'>
                    <h1 className='text-xl font-semibold text-gray-800'>
                        Kudos League
                    </h1>
                    <div className='relative'>
                        {isLoggedIn && user ? (
                            <>
                                <button
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
                                </button>
                                {showDropdown && (
                                    <div className='absolute right-0 mt-2 bg-white border shadow-md rounded w-40 z-10'>
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
                                            onClick={() => {
                                                logout();
                                                setShowDropdown(false);
                                            }}
                                        >
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className='flex gap-2'>
                                <button
                                    className='border border-blue-500 text-blue-500 px-4 py-1 rounded hover:bg-blue-50'
                                    onClick={() => navigate('/login')}
                                >
                                    LOG IN
                                </button>
                                <button
                                    className='bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600'
                                    onClick={() => navigate('/sign-up')}
                                >
                                    SIGN UP
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                <main className='flex-1 overflow-y-auto p-6'>
                    <Outlet />
                </main>

                <LayoutFooter />
            </div>
        </div>
    );
};

export default Layout;