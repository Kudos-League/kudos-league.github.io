import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AvatarComponent from '@/components/Avatar';

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

const LayoutFooter: React.FC = () => {
    const { isLoggedIn } = useAuth();

    return (
        <footer className='bg-white border-t border-gray-200 px-4 py-2 text-sm text-gray-700'>
            <div className='flex justify-around items-center gap-4'>
                {isLoggedIn ? (
                    <>
                        <FooterLink to='/' icon={HomeIcon} label='Feed' />
                        <FooterLink to='/dms' icon={EnvelopeIcon} label='DMs' />
                        <FooterLink
                            to='/user/me'
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

    return (
        <div className='flex h-screen'>
            {/* Sidebar */}
            <aside className='w-60 bg-white border-r border-gray-200 shadow-sm p-4'>
                <nav className='flex flex-col gap-2'>
                    <Link to='/' className='font-semibold text-blue-600'>
                        Home
                    </Link>
                    {isLoggedIn && (
                        <>
                            <Link to='/create-post'>Create Post</Link>
                            <Link to='/donate'>Donate</Link>
                            <Link to='/search'>Search</Link>
                            <Link to='/leaderboard'>Leaderboard</Link>
                            <Link to='/chat'>Chat</Link>
                            <Link to='/create-event'>Create Event</Link>
                            {user?.admin && (
                                <Link to='/admin'>Admin Dashboard</Link>
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
                                                    '/user/' + user.username
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
