import React, { Fragment, useState, useMemo, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    XMarkIcon, 
    FlagIcon, 
    Bars3Icon,
    HomeIcon,
    ChatBubbleLeftRightIcon,
    PlusCircleIcon,
    HeartIcon,
    TrophyIcon,
    ChatBubbleBottomCenterTextIcon,
    CalendarIcon,
    InformationCircleIcon,
    UserPlusIcon,
    ArrowRightOnRectangleIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import clsx from 'clsx';
import { getImagePath } from '@/shared/api/config';
import Avatar from '../users/Avatar';
import { routes } from '@/routes';
import FeedbackModal from '@/components/common/FeedbackModal';
import { apiMutate } from '@/shared/api/apiClient';
import NotificationsBell from '@/components/notifications/NotificationsBell';

type NavItem = {
    name: string;
    to: string;
    icon?: React.ComponentType<{ className?: string }>;
};

function useAppNav(isLoggedIn: boolean, isAdmin?: boolean): NavItem[] {
    const base: NavItem[] = [{ name: 'Main', to: routes.home, icon: HomeIcon }];
    if (isLoggedIn) {
        base.push(
            { name: 'DMs', to: routes.dms, icon: ChatBubbleLeftRightIcon },
            { name: 'Create', to: routes.createPost, icon: PlusCircleIcon },
            { name: 'Donate', to: routes.donate, icon: HeartIcon },
            { name: 'Leaderboard', to: routes.leaderboard, icon: TrophyIcon },
            { name: 'Feedback', to: routes.feedback, icon: FlagIcon },
            { name: 'Forum', to: routes.chat, icon: ChatBubbleBottomCenterTextIcon },
            { name: 'Events', to: routes.events, icon: CalendarIcon },
            { name: 'About', to: routes.about, icon: InformationCircleIcon },
        );
        if (isAdmin) {
            base.push({ name: 'Admin', to: routes.admin, icon: ShieldCheckIcon });
        }
    }
    else {
        base.push(
            { name: 'Donate', to: routes.donate, icon: HeartIcon },
            { name: 'About', to: routes.about, icon: InformationCircleIcon },
            { name: 'Login', to: routes.login, icon: ArrowRightOnRectangleIcon },
            { name: 'Register', to: routes.signUp, icon: UserPlusIcon }
        );
    }
    return base;
}

function NavItemComponent({
    href,
    children,
    className
}: {
    href: string;
    children: React.ReactNode;
    className?: string;
}) {
    const location = useLocation();
    const isActive =
        href === routes.home
            ? location.pathname === routes.home
            : location.pathname.startsWith(href);

    return (
        <li>
            <Link
                to={href}
                className={clsx(
                    'group relative flex flex-col items-center justify-center transition-all duration-150',
                    isActive
                        ? 'text-teal-500 dark:text-teal-400'
                        : 'hover:text-teal-500 dark:hover:text-teal-400',
                    className
                )}
            >
                {children}
                {isActive && (
                    <span className='absolute inset-x-1 -bottom-px h-px bg-gradient-to-r from-teal-500/0 via-teal-500/40 to-teal-500/0 dark:from-teal-400/0 dark:via-teal-400/40 dark:to-teal-400/0' />
                )}
            </Link>
        </li>
    );
}


function DesktopNavigation({ items }: { items: NavItem[] }) {
    return (
        <nav className='hidden md:block'>
            <ul className='flex rounded-full bg-white/90 px-3 py-2 text-sm font-medium text-zinc-800 shadow-lg ring-1 shadow-zinc-800/5 ring-zinc-900/5 backdrop-blur-sm dark:bg-zinc-800/90 dark:text-zinc-200 dark:ring-white/10'>
                {items.map((item) => (
                    <li key={item.name}>
                        <NavItemComponent
                            href={item.to}
                            className='flex flex-col items-center justify-center px-4 py-2 transition-all duration-150 hover:scale-105'
                        >
                            {item.icon && (
                                <item.icon
                                    className={clsx(
                                        'h-5 w-5 mb-1 transition-colors duration-150',
                                        'text-zinc-500 group-hover:text-teal-500 dark:text-zinc-400 dark:group-hover:text-teal-400'
                                    )}
                                />
                            )}
                            <span className='text-xs md:text-sm'>{item.name}</span>
                        </NavItemComponent>
                    </li>
                ))}
            </ul>
        </nav>
    );
}


function MobileNavigation({ items }: { items: NavItem[] }) {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    
    return (
        <div className='md:hidden'>
            <button 
                onClick={() => setIsOpen(true)}
                aria-label='Open menu'
                className='flex h-10 w-10 items-center justify-center rounded-lg bg-white/90 text-zinc-800 shadow-lg backdrop-blur-sm dark:bg-zinc-800/90 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-800'
            >
                <Bars3Icon className='h-6 w-6' />
            </button>
            
            {isOpen && (
                <>
                    <div className='fixed inset-0 z-[60] bg-black/50' onClick={() => setIsOpen(false)} />
                    <div className='fixed inset-0 z-[70] h-full min-h-screen bg-white dark:bg-zinc-900 p-6 flex flex-col'>
                        <div className='flex flex-row-reverse items-center justify-between mb-8'>
                            <button 
                                onClick={() => setIsOpen(false)}
                                aria-label='Close menu' 
                                className='p-2 -mr-2'
                            >
                                <XMarkIcon className='h-7 w-7 text-zinc-500 dark:text-zinc-400' />
                            </button>
                            <h2 className='text-lg font-semibold text-zinc-800 dark:text-zinc-200'>
                                Menu
                            </h2>
                        </div>
                        <nav className='flex-1 overflow-y-auto -mx-2'>
                            <ul className='space-y-2'>
                                {items.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <li key={item.name}>
                                            <button
                                                onClick={() => {
                                                    setIsOpen(false);
                                                    navigate(item.to);
                                                }}
                                                className='flex items-center gap-4 px-6 py-4 text-base font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors w-full text-left'
                                            >
                                                {Icon && <Icon className='h-6 w-6 text-teal-600 dark:text-teal-400 flex-shrink-0' />}
                                                <span>{item.name}</span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </nav>
                    </div>
                </>
            )}
        </div>
    );
}

function ThemeToggleButton() {
    const { theme, toggleTheme } = useTheme();
    const other = theme === 'dark' ? 'light' : 'dark';
    return (
        <button
            type='button'
            aria-label={`Switch to ${other} theme`}
            onClick={toggleTheme}
            className='flex h-10 w-10 items-center justify-center rounded-lg bg-white/90 text-zinc-600 shadow-lg backdrop-blur-sm hover:bg-white dark:bg-zinc-800/90 dark:text-zinc-300 dark:hover:bg-zinc-800'
        >
            <span className='block dark:hidden'>
                <svg
                    viewBox='0 0 24 24'
                    aria-hidden='true'
                    className='h-6 w-6 fill-zinc-100 stroke-zinc-500 transition group-hover:fill-zinc-200 group-hover:stroke-zinc-700'
                >
                    <path d='M8 12.25A4.25 4.25 0 0 1 12.25 8v0a4.25 4.25 0 0 1 4.25 4.25v0a4.25 4.25 0 0 1-4.25 4.25v0A4.25 4.25 0 0 1 8 12.25v0Z' />
                    <path
                        d='M12.25 3v1.5M21.5 12.25H20M18.791 18.791l-1.06-1.06M18.791 5.709l-1.06 1.06M12.25 20v1.5M4.5 12.25H3M6.77 6.77 5.709 5.709M6.77 17.73l-1.061 1.061'
                        fill='none'
                    />
                </svg>
            </span>
            <span className='hidden dark:block'>
                <svg
                    viewBox='0 0 24 24'
                    aria-hidden='true'
                    className='h-6 w-6 fill-zinc-700 stroke-zinc-500 transition'
                >
                    <path
                        d='M17.25 16.22a6.937 6.937 0 0 1-9.47-9.47 7.451 7.451 0 1 0 9.47 9.47ZM12.75 7C17 7 17 2.75 17 2.75S17 7 21.25 7C17 7 17 11.25 17 11.25S17 7 12.75 7Z'
                        strokeWidth='1.5'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                    />
                </svg>
            </span>
        </button>
    );
}

function UserMenu({ onLogout }: { onLogout: () => void }) {
    const [open, setOpen] = useState(false);
    const { user } = useAuth();
    const profileHref = user ? routes.user[user.id] : routes.login;
    const menuRef = useRef<HTMLDivElement>(null);

    return (
        <div className='relative' ref={menuRef}>
            <button
                id='profile-button'
                onClick={() => setOpen(!open)}
                className='flex h-10 w-10 items-center justify-center rounded-lg bg-white/90 text-zinc-600 shadow-lg backdrop-blur-sm dark:bg-zinc-800/90 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 transition-all duration-200'
            >
                <Avatar
                    avatar={getImagePath(user?.avatar)}
                    username={user?.username}
                    size={40}
                />
            </button>
            {open && (
                <div
                    id='profile-dropdown'
                    className='absolute right-0 z-50 mt-2 w-40 rounded-lg bg-white shadow-lg ring-1 ring-zinc-900/5 dark:bg-zinc-800 dark:ring-white/10'
                >
                    <Link
                        to={profileHref}
                        onClick={() => setOpen(false)}
                        className='block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700'
                    >
                        Profile
                    </Link>
                    <button
                        onClick={() => {
                            setOpen(false);
                            onLogout();
                        }}
                        className='block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-zinc-100 dark:text-red-400 dark:hover:bg-zinc-700'
                    >
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
}

export type NavbarProps = {
    isLoggedIn: boolean;
    user?: { id: number; admin?: boolean };
    onLogout: () => void;
    brand?: React.ReactNode;
    onOpenSidebar: () => void;
};

export default function Navbar({
    isLoggedIn,
    user,
    onLogout,
    brand,
    onOpenSidebar
}: NavbarProps) {
    const navItems = useMemo(
        () => useAppNav(isLoggedIn, user?.admin),
        [isLoggedIn, user]
    );


    return (
        <>
            <header className='sticky top-0 z-50 flex justify-between items-center gap-2 bg-transparent px-4 py-4 backdrop-blur-md'>
                <div className='flex items-center gap-2'>
                    <MobileNavigation items={navItems} />
                    {brand || <></>}
                </div>

                <div className='flex flex-1 justify-end md:justify-center'>
                    <DesktopNavigation items={navItems} />
                </div>

                <div className='flex items-center gap-2'>
                    <ThemeToggleButton />

                    {isLoggedIn ? (
                        <>
                            <NotificationsBell />
                            {/* <Link
                                to={routes.feedback}
                                aria-label='Feedback'
                                className='flex h-10 w-10 items-center justify-center rounded-lg bg-white/90 text-zinc-800 shadow-lg backdrop-blur-sm hover:bg-white dark:bg-zinc-800/90 dark:text-zinc-200 dark:hover:bg-zinc-800'
                            >
                                <FlagIcon className='h-5 w-5' />
                            </Link> */}
                            <UserMenu onLogout={onLogout} />
                        </>
                    ) : (
                        <div className='flex items-center gap-1.5'>
                            <Link
                                to={routes.login}
                                className='rounded-full bg-white/90 px-3 py-2 text-s md:text-sm md:px-4 md:py-2 font-medium text-zinc-800 shadow-lg ring-1 shadow-zinc-800/5 ring-zinc-900/5 backdrop-blur-sm hover:ring-zinc-900/10 dark:bg-zinc-800/90 dark:text-zinc-200 dark:ring-white/10 dark:hover:ring-white/20'
                            >
                                Login
                            </Link>
                            <Link
                                to={routes.signUp}
                                className='rounded-full bg-teal-500 px-3 py-2 text-s md:text-sm md:px-4 md:py-2 font-medium text-white shadow-lg hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:bg-teal-600 dark:hover:bg-teal-500'
                            >
                                Register
                            </Link>
                        </div>
                    )}
                </div>
            </header>

        </>
    );
}