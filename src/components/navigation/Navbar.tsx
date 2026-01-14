import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    FlagIcon,
    ChatBubbleLeftRightIcon,
    HeartIcon,
    TrophyIcon,
    InformationCircleIcon,
    ArrowRightOnRectangleIcon,
    ShieldCheckIcon,
    UserCircleIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import clsx from 'clsx';
import { getImagePath } from '@/shared/api/config';
import Avatar from '../users/Avatar';
import { routes } from '@/routes';
import NotificationsBell from '@/components/notifications/NotificationsBell';
import SearchBar from './SearchBar';
import { useNavigate } from 'react-router-dom';

type NavItem = {
    name: string;
    to: string;
    icon?: React.ComponentType<{ className?: string }>;
};

// User menu items for logged-in users
function useUserMenuItems(isAdmin?: boolean): NavItem[] {
    const items: NavItem[] = [
        { name: 'My Activity', to: routes.activity, icon: ChartBarIcon },
        { name: 'About', to: routes.about, icon: InformationCircleIcon },
        { name: 'Give Feedback', to: routes.feedback, icon: FlagIcon }
    ];
    if (isAdmin) {
        items.push({ name: 'Admin', to: routes.admin, icon: ShieldCheckIcon });
    }
    return items;
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
                        ? 'text-brand-600 dark:text-brand-300'
                        : 'hover:text-brand-600 dark:hover:text-brand-300',
                    className
                )}
            >
                {children}
            </Link>
        </li>
    );
}

function DesktopNavigation({ items }: { items: NavItem[] }) {
    return (
        <nav className='hidden lg:block'>
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
                                        'text-zinc-500 group-hover:text-brand-600 dark:text-zinc-400 dark:group-hover:text-brand-300'
                                    )}
                                />
                            )}
                            <span className='text-xs lg:text-sm'>
                                {item.name}
                            </span>
                        </NavItemComponent>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

// function ThemeToggleButton() {
//     const { theme, toggleTheme } = useTheme();
//     const other = theme === 'dark' ? 'light' : 'dark';
//     return (
//         <button
//             type='button'
//             aria-label={`Switch to ${other} theme`}
//             onClick={toggleTheme}
//             className='flex h-10 w-10 items-center justify-center rounded-lg bg-white/90 text-zinc-600 shadow-lg backdrop-blur-sm hover:bg-white dark:bg-zinc-800/90 dark:text-zinc-300 dark:hover:bg-zinc-800'
//         >
//             <span className='block dark:hidden'>
//                 <svg
//                     viewBox='0 0 24 24'
//                     aria-hidden='true'
//                     className='h-6 w-6 fill-zinc-100 stroke-zinc-500 transition group-hover:fill-zinc-200 group-hover:stroke-zinc-700'
//                 >
//                     <path d='M8 12.25A4.25 4.25 0 0 1 12.25 8v0a4.25 4.25 0 0 1 4.25 4.25v0a4.25 4.25 0 0 1-4.25 4.25v0A4.25 4.25 0 0 1 8 12.25v0Z' />
//                     <path
//                         d='M12.25 3v1.5M21.5 12.25H20M18.791 18.791l-1.06-1.06M18.791 5.709l-1.06 1.06M12.25 20v1.5M4.5 12.25H3M6.77 6.77 5.709 5.709M6.77 17.73l-1.061 1.061'
//                         fill='none'
//                     />
//                 </svg>
//             </span>
//             <span className='hidden dark:block'>
//                 <svg
//                     viewBox='0 0 24 24'
//                     aria-hidden='true'
//                     className='h-6 w-6 fill-zinc-700 stroke-zinc-500 transition'
//                 >
//                     <path
//                         d='M17.25 16.22a6.937 6.937 0 0 1-9.47-9.47 7.451 7.451 0 1 0 9.47 9.47ZM12.75 7C17 7 17 2.75 17 2.75S17 7 21.25 7C17 7 17 11.25 17 11.25S17 7 12.75 7Z'
//                         strokeWidth='1.5'
//                         strokeLinecap='round'
//                         strokeLinejoin='round'
//                     />
//                 </svg>
//             </span>
//         </button>
//     );
// }

function UserMenu({
    onLogout,
    menuItems
}: {
    onLogout: () => void;
    menuItems: NavItem[];
}) {
    const [open, setOpen] = useState(false);
    const { user } = useAuth();
    const profileHref = user ? routes.user[user.id] : routes.login;
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        }

        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [open]);

    return (
        <div className='relative' ref={menuRef}>
            <button
                id='profile-button'
                onClick={() => setOpen(!open)}
                className='mt-1'
            >
                <Avatar
                    avatar={getImagePath(user?.avatar)}
                    username={user?.username}
                    size={46}
                />
            </button>
            {open && (
                <div
                    id='profile-dropdown'
                    className='absolute right-0 z-50 mt-2 w-56 rounded-lg bg-white shadow-lg ring-1 ring-zinc-900/5 dark:bg-zinc-800 dark:ring-white/10'
                >
                    <Link
                        to={profileHref}
                        onClick={() => setOpen(false)}
                        className='flex items-center gap-3 px-4 py-3 text-base font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700 rounded-t-lg'
                    >
                        <UserCircleIcon className='h-5 w-5 text-zinc-500 dark:text-zinc-400' />
                        <span>Profile</span>
                    </Link>
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                to={item.to}
                                onClick={() => setOpen(false)}
                                className='flex items-center gap-3 px-4 py-3 text-base font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700'
                            >
                                {Icon && (
                                    <Icon className='h-5 w-5 text-zinc-500 dark:text-zinc-400' />
                                )}
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                    <button
                        onClick={() => {
                            setOpen(false);
                            onLogout();
                        }}
                        className='flex items-center gap-3 w-full px-4 py-3 text-left text-base font-medium text-red-600 hover:bg-zinc-100 dark:text-red-400 dark:hover:bg-zinc-700 rounded-b-lg'
                    >
                        <ArrowRightOnRectangleIcon className='h-5 w-5' />
                        <span>Logout</span>
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
    onOpenDMs: () => void;
    onOpenSearch: () => void;
};

export default function Navbar({
    isLoggedIn,
    user,
    onLogout,
    brand,
    onOpenSidebar,
    onOpenDMs,
    onOpenSearch
}: NavbarProps) {
    const navigate = useNavigate();
    const userMenuItems = useMemo(
        () => useUserMenuItems(user?.admin),
        [user?.admin]
    );
    const { state: notificationsState } = useNotifications();

    // Count unread DM notifications
    const unreadDMs = useMemo(() => {
        return notificationsState.items.filter(
            (n) => n.type === 'direct-message' && !n.isRead
        ).length;
    }, [notificationsState.items]);

    return (
        <>
            <header className='sticky-nav top-0 z-50 flex justify-between items-center gap-1 sm:gap-2 bg-transparent px-2 sm:px-4 py-4 lg:py-8 backdrop-blur-md'>
                <div className='flex items-center gap-1 sm:gap-2 flex-shrink-0 min-w-0 pl-2 sm:pl-4'>
                    <div className='flex-shrink-0 mr-2'>{brand || <></>}</div>
                    <Link
                        to={routes.donate}
                        className='rounded-full bg-white/90 px-2 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm lg:px-4 lg:py-2 font-medium text-zinc-800 shadow-lg ring-1 shadow-zinc-800/5 ring-zinc-900/5 backdrop-blur-sm hover:ring-zinc-900/10 dark:bg-zinc-800/90 dark:text-zinc-200 dark:ring-white/10 dark:hover:ring-white/20 whitespace-nowrap flex items-center gap-1'
                        aria-label='Donate'
                    >
                        <HeartIcon className='h-4 w-4 text-red-600 sm:h-5 sm:w-5' />
                        <span>Donate</span>
                    </Link>
                </div>

                <div className='flex flex-1 items-center min-w-0 px-2'>
                    {isLoggedIn && (
                        <div className='flex w-full justify-center'>
                            <SearchBar
                                className='w-full max-w-3xl'
                                onOpenSearchModal={onOpenSearch}
                            />
                        </div>
                    )}
                </div>

                <div className='flex items-center gap-2 sm:gap-3 flex-shrink-0'>
                    {/* <ThemeToggleButton /> */}

                    {isLoggedIn ? (
                        <>
                            {/* Create button - Desktop only */}
                            <Link
                                to={routes.createPost}
                                className='hidden lg:flex items-center justify-center gap-1 rounded-full bg-brand-600 px-5 py-3 text-base font-medium text-white shadow-lg hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:bg-brand-400 dark:hover:bg-brand-300'
                                aria-label='Create post'
                            >
                                Create
                            </Link>
                            {/* Mobile Search Button - Hidden since SearchBar is always visible */}
                            {/* DMs button - Desktop only */}
                            <button
                                onClick={onOpenDMs}
                                aria-label='DMs'
                                className='hidden lg:flex relative h-12 w-12 items-center justify-center rounded-lg bg-white/90 text-zinc-800 shadow-lg backdrop-blur-sm hover:bg-white dark:bg-zinc-800/90 dark:text-zinc-200 dark:hover:bg-zinc-800'
                            >
                                <ChatBubbleLeftRightIcon className='h-6 w-6' />
                                {unreadDMs > 0 && (
                                    <span
                                        className='absolute -top-1 -right-1 sm:-top-2 sm:-right-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-semibold leading-none text-white shadow-sm'
                                        aria-label={`${unreadDMs} unread messages`}
                                    >
                                        {unreadDMs > 9 ? '9+' : unreadDMs}
                                    </span>
                                )}
                            </button>
                            {/* Notifications - Desktop only */}
                            <div className='hidden lg:block flex-shrink-0'>
                                <NotificationsBell />
                            </div>
                            <div className='flex-shrink-0 pr-2 sm:pr-4'>
                                <UserMenu
                                    onLogout={onLogout}
                                    menuItems={userMenuItems}
                                />
                            </div>
                        </>
                    ) : (
                        <div className='flex items-center gap-1 sm:gap-1.5 flex-shrink-0'>
                            <Link
                                to={routes.login}
                                className='rounded-full bg-white/90 px-2 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm lg:px-4 lg:py-2 font-medium text-zinc-800 shadow-lg ring-1 shadow-zinc-800/5 ring-zinc-900/5 backdrop-blur-sm hover:ring-zinc-900/10 dark:bg-zinc-800/90 dark:text-zinc-200 dark:ring-white/10 dark:hover:ring-white/20 whitespace-nowrap'
                            >
                                Login
                            </Link>
                            <Link
                                to={routes.signUp}
                                className='rounded-full bg-brand-600 px-2 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm lg:px-4 lg:py-2 font-medium text-white shadow-lg hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:bg-brand-400 dark:hover:bg-brand-300 whitespace-nowrap'
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
