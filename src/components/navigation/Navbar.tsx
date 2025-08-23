import React, { Fragment, useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Popover, PopoverButton, PopoverBackdrop, PopoverPanel } from '@headlessui/react';
import {
    BellIcon,
    ChevronDownIcon,
    XMarkIcon,
    UserCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import clsx from 'clsx';
import { getImagePath } from '@/shared/api/config';
import Avatar from '../users/Avatar';

// Type definition for navigation items
type NavItem = {
  name: string;
  to: string;
};

// Build navigation items depending on authentication state and admin status
function useAppNav(isLoggedIn: boolean, isAdmin?: boolean): NavItem[] {
    const base: NavItem[] = [{ name: 'Main', to: '/' }];
    if (isLoggedIn) {
        base.push(
            { name: 'DMs', to: '/dms' },
            { name: 'Create', to: '/create-post' },
            { name: 'Donate', to: '/donate' },
            { name: 'Leaderboard', to: '/leaderboard' },
            { name: 'Forum', to: '/chat' },
            { name: 'Events', to: '/events' },
        );
        if (isAdmin) {
            base.push({ name: 'Admin', to: '/admin' });
        }
    }
    else {
        base.push(
            { name: 'About', to: '/about' },
            { name: 'Login', to: '/login' },
            { name: 'Register', to: '/sign-up' },
        );
    }
    return base;
}

// Individual nav item with gradient underline for the active route
function NavItemComponent({ href, children }: { href: string; children: React.ReactNode }) {
    const location = useLocation();
    const isActive = href === '/' ? location.pathname === '/' : location.pathname.startsWith(href);
    return (
        <li>
            <Link
                to={href}
                className={clsx(
                    'relative block px-3 py-2 transition',
                    isActive
                        ? 'text-teal-500 dark:text-teal-400'
                        : 'hover:text-teal-500 dark:hover:text-teal-400',
                )}
            >
                {children}
                {isActive && (
                    <span className="absolute inset-x-1 -bottom-px h-px bg-gradient-to-r from-teal-500/0 via-teal-500/40 to-teal-500/0 dark:from-teal-400/0 dark:via-teal-400/40 dark:to-teal-400/0" />
                )}
            </Link>
        </li>
    );
}

// Desktop navigation container
function DesktopNavigation({ items }: { items: NavItem[] }) {
    return (
        <nav className="hidden md:block">
            <ul className="flex rounded-full bg-white/90 px-3 text-sm font-medium text-zinc-800 shadow-lg ring-1 shadow-zinc-800/5 ring-zinc-900/5 backdrop-blur-sm dark:bg-zinc-800/90 dark:text-zinc-200 dark:ring-white/10">
                {items.map((item) => (
                    <NavItemComponent key={item.name} href={item.to}>
                        {item.name}
                    </NavItemComponent>
                ))}
            </ul>
        </nav>
    );
}

// Mobile navigation via Popover
function MobileNavigation({ items }: { items: NavItem[] }) {
    return (
        <Popover className="md:hidden">
            <PopoverButton className="group flex items-center rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-zinc-800 shadow-lg ring-1 shadow-zinc-800/5 ring-zinc-900/5 backdrop-blur-sm dark:bg-zinc-800/90 dark:text-zinc-200 dark:ring-white/10 dark:hover:ring-white/20">
        Menu
                <ChevronDownIcon className="ml-3 h-3 w-3 stroke-zinc-500 group-hover:stroke-zinc-700 dark:group-hover:stroke-zinc-400" />
            </PopoverButton>
            <PopoverBackdrop
                transition
                className="fixed inset-0 z-50 bg-zinc-800/40 backdrop-blur-xs duration-150 data-closed:opacity-0 data-enter:ease-out data-leave:ease-in dark:bg-black/80"
            />
            <PopoverPanel
                focus
                transition
                className="fixed inset-x-4 top-8 z-50 origin-top rounded-3xl bg-white p-6 ring-1 ring-zinc-900/5 duration-150 data-closed:scale-95 data-closed:opacity-0 data-enter:ease-out data-leave:ease-in dark:bg-zinc-900 dark:ring-zinc-800"
            >
                <div className="flex flex-row-reverse items-center justify-between">
                    <PopoverButton aria-label="Close menu" className="-m-1 p-1">
                        <XMarkIcon className="h-6 w-6 text-zinc-500 dark:text-zinc-400" />
                    </PopoverButton>
                    <h2 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Navigation</h2>
                </div>
                <nav className="mt-6">
                    <ul className="-my-2 divide-y divide-zinc-100 text-base text-zinc-800 dark:divide-zinc-100/5 dark:text-zinc-300">
                        {items.map((item) => (
                            <li key={item.name}>
                                <PopoverButton as={Link} to={item.to} className="block py-2">
                                    {item.name}
                                </PopoverButton>
                            </li>
                        ))}
                    </ul>
                </nav>
            </PopoverPanel>
        </Popover>
    );
}

// Theme toggle button using our custom theme context
function ThemeToggleButton() {
    const { theme, toggleTheme } = useTheme();
    const other = theme === 'dark' ? 'light' : 'dark';
    return (
        <button
            type="button"
            aria-label={`Switch to ${other} theme`}
            onClick={toggleTheme}
            className="group rounded-full bg-white/90 px-3 py-2 shadow-lg ring-1 shadow-zinc-800/5 ring-zinc-900/5 backdrop-blur-sm transition dark:bg-zinc-800/90 dark:ring-white/10 dark:hover:ring-white/20"
        >
            <span className="block dark:hidden">
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="h-6 w-6 fill-zinc-100 stroke-zinc-500 transition group-hover:fill-zinc-200 group-hover:stroke-zinc-700"
                >
                    <path d="M8 12.25A4.25 4.25 0 0 1 12.25 8v0a4.25 4.25 0 0 1 4.25 4.25v0a4.25 4.25 0 0 1-4.25 4.25v0A4.25 4.25 0 0 1 8 12.25v0Z" />
                    <path
                        d="M12.25 3v1.5M21.5 12.25H20M18.791 18.791l-1.06-1.06M18.791 5.709l-1.06 1.06M12.25 20v1.5M4.5 12.25H3M6.77 6.77 5.709 5.709M6.77 17.73l-1.061 1.061"
                        fill="none"
                    />
                </svg>
            </span>
            <span className="hidden dark:block">
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="h-6 w-6 fill-zinc-700 stroke-zinc-500 transition"
                >
                    <path
                        d="M17.25 16.22a6.937 6.937 0 0 1-9.47-9.47 7.451 7.451 0 1 0 9.47 9.47ZM12.75 7C17 7 17 2.75 17 2.75S17 7 21.25 7C17 7 17 11.25 17 11.25S17 7 12.75 7Z"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </span>
        </button>
    );
}

// Dropdown menu for authenticated users
function UserMenu({ onLogout }: { onLogout: () => void }) {
    const [open, setOpen] = useState(false);
    const { user } = useAuth();
    return (
        <div className="relative">
            <button
                id="profile-button"
                onClick={() => setOpen(!open)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-zinc-600 shadow-lg ring-1 shadow-zinc-800/5 ring-zinc-900/5 backdrop-blur-sm dark:bg-zinc-800/90 dark:text-zinc-300 dark:ring-white/10"
            >
                <Avatar avatar={getImagePath(user?.avatar)} username={user?.username} size={32} />
            </button>
            {open && (
                <div
                    id="profile-dropdown"
                    className="absolute right-0 z-50 mt-2 w-40 rounded-lg bg-white shadow-lg ring-1 ring-zinc-900/5 dark:bg-zinc-800 dark:ring-white/10"
                >
                    <Link
                        to="/profile"
                        onClick={() => setOpen(false)}
                        className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    >
            Profile
                    </Link>
                    <button
                        onClick={() => {
                            setOpen(false);
                            onLogout();
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-zinc-100 dark:text-red-400 dark:hover:bg-zinc-700"
                    >
            Logout
                    </button>
                </div>
            )}
        </div>
    );
}

// Notification icon placeholder
function NotificationsIcon() {
    return (
        <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-zinc-600 shadow-lg ring-1 shadow-zinc-800/5 ring-zinc-900/5 backdrop-blur-sm hover:ring-zinc-800/10 dark:bg-zinc-800/90 dark:text-zinc-300 dark:ring-white/10 dark:hover:ring-white/20"
        >
            <BellIcon className="h-5 w-5" />
        </button>
    );
}

export type NavbarProps = {
  isLoggedIn: boolean;
  user?: { id: number; admin?: boolean };
  onLogout: () => void;
  brand?: React.ReactNode;
  onOpenSidebar: () => void;
};

export default function Navbar({ isLoggedIn, user, onLogout, brand }: NavbarProps) {
    // compute navigation based on login state
    const navItems = useMemo(() => useAppNav(isLoggedIn, user?.admin), [isLoggedIn, user]);
    return (
        <header className="sticky top-0 z-50 flex justify-between items-center gap-4 bg-transparent px-4 py-4 backdrop-blur-md">
            {/* Brand on the left */}
            <div className="flex items-center">
                {brand || <></>}
            </div>
            {/* Center navigation: mobile popover and desktop list */}
            <div className="flex flex-1 justify-end md:justify-center">
                <MobileNavigation items={navItems} />
                <DesktopNavigation items={navItems} />
            </div>
            {/* Right-hand actions: theme toggle, notifications, profile or login buttons */}
            <div className="flex items-center gap-2">
                <ThemeToggleButton />
                {isLoggedIn ? (
                    <>
                        <NotificationsIcon />
                        <UserMenu onLogout={onLogout} />
                    </>
                ) : (
                    <div className="flex items-center gap-2">
                        <Link
                            to="/login"
                            className="rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-zinc-800 shadow-lg ring-1 shadow-zinc-800/5 ring-zinc-900/5 backdrop-blur-sm hover:ring-zinc-900/10 dark:bg-zinc-800/90 dark:text-zinc-200 dark:ring-white/10 dark:hover:ring-white/20"
                        >
                            Login
                        </Link>
                        <Link
                            to="/sign-up"
                            className="rounded-full bg-teal-500 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:bg-teal-600 dark:hover:bg-teal-500"
                        >
                            Register
                        </Link>
                    </div>
                )}
            </div>
        </header>
    );
}