'use client';

import React, { Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Dialog, DialogBackdrop, DialogPanel, TransitionChild } from '@headlessui/react';
import {
    XMarkIcon,
    HomeIcon,
    EnvelopeIcon,
    InformationCircleIcon,
    ArrowRightOnRectangleIcon,
    UserPlusIcon,
} from '@heroicons/react/24/outline';

type NavItem = {
  name: string;
  to: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

export type AppSidebarProps = {
  open: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  isAdmin?: boolean;
  onLinkClick?: () => void;
  brand?: React.ReactNode;
};

function classNames(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

function useAppNav(isLoggedIn: boolean, isAdmin?: boolean): NavItem[] {
    const base: NavItem[] = [{ name: 'Main', to: '/', icon: HomeIcon }];

    if (isLoggedIn) {
        base.push(
            { name: 'DMs', to: '/dms', icon: EnvelopeIcon },
            { name: 'Create Gift / Request', to: '/create-post', icon: InformationCircleIcon },
            { name: 'Donate', to: '/donate', icon: InformationCircleIcon },
            { name: 'Leaderboard', to: '/leaderboard', icon: InformationCircleIcon },
            { name: 'Forum', to: '/chat', icon: InformationCircleIcon },
            { name: 'Events', to: '/events', icon: InformationCircleIcon },
        );
        if (isAdmin) {
            base.push({ name: 'Admin Dashboard', to: '/admin', icon: InformationCircleIcon });
        }
    }
    else {
        base.push(
            { name: 'About', to: '/about', icon: InformationCircleIcon },
            { name: 'Login', to: '/login', icon: ArrowRightOnRectangleIcon },
            { name: 'Register', to: '/sign-up', icon: UserPlusIcon },
        );
    }

    return base;
}

function NavList({
    items,
    currentPath,
    onClick,
}: {
  items: NavItem[];
  currentPath: string;
  onClick?: () => void;
}) {
    const isActive = (to: string) => (to === '/' ? currentPath === '/' : currentPath.startsWith(to));

    return (
        <ul role="list" className="-mx-2 space-y-1">
            {items.map(item => {
                const active = isActive(item.to);
                return (
                    <li key={item.name}>
                        <Link
                            to={item.to}
                            onClick={onClick}
                            className={classNames(
                                active
                                    ? 'bg-gray-50 text-indigo-600 dark:bg-white/5 dark:text-white'
                                    : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
                                'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                            )}
                        >
                            <item.icon
                                aria-hidden="true"
                                className={classNames(
                                    active
                                        ? 'text-indigo-600 dark:text-white'
                                        : 'text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-white',
                                    'size-6 shrink-0',
                                )}
                            />
                            {item.name}
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}

export default function AppSidebar({
    open,
    onClose,
    isLoggedIn,
    isAdmin,
    onLinkClick,
    brand,
}: AppSidebarProps) {
    const location = useLocation();
    const nav = useAppNav(isLoggedIn, isAdmin);

    return (
        <>
            {/* Mobile sidebar */}
            <Dialog open={open} onClose={onClose} className="relative z-50 lg:hidden">
                {/* Backdrop with fade */}
                <TransitionChild
                    as={Fragment}
                    enter="transition-opacity ease-linear duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="transition-opacity ease-linear duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <DialogBackdrop className="fixed inset-0 bg-gray-900/80" />
                </TransitionChild>

                <div className="fixed inset-0 flex">
                    {/* Panel with slide-in from left */}
                    <TransitionChild
                        as={Fragment}
                        enter="transform transition ease-in-out duration-300"
                        enterFrom="-translate-x-full"
                        enterTo="translate-x-0"
                        leave="transform transition ease-in-out duration-300"
                        leaveFrom="translate-x-0"
                        leaveTo="-translate-x-full"
                    >
                        <DialogPanel className="relative mr-16 flex w-full max-w-xs flex-1">
                            {/* Close button area can also fade if you want */}
                            <TransitionChild
                                as={Fragment}
                                enter="transition-opacity ease-in-out duration-300 delay-75"
                                enterFrom="opacity-0"
                                enterTo="opacity-100"
                                leave="transition-opacity ease-in-out duration-200"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                            >
                                <div className="absolute top-0 left-full flex w-16 justify-center pt-5">
                                    <button type="button" onClick={onClose} className="-m-2.5 p-2.5">
                                        <span className="sr-only">Close sidebar</span>
                                        <XMarkIcon aria-hidden="true" className="size-6 text-white" />
                                    </button>
                                </div>
                            </TransitionChild>

                            <div className="relative flex grow flex-col gap-y-5 overflow-y-auto px-6 pb-4
                        bg-white dark:bg-gray-900
                        dark:ring dark:ring-white/10
                        dark:before:pointer-events-none dark:before:absolute dark:before:inset-0 dark:before:bg-black/10">
                                <div className="relative flex h-16 shrink-0 items-center">
                                    {brand ?? (
                                        <>
                                            <img alt="Logo" src="/logo-light.svg" className="h-8 w-auto dark:hidden" />
                                            <img alt="Logo" src="/logo-dark.svg" className="hidden h-8 w-auto dark:block" />
                                        </>
                                    )}
                                </div>
                                <nav className="relative flex flex-1 flex-col">
                                    <NavList items={nav} currentPath={location.pathname} onClick={onLinkClick ?? onClose} />
                                </nav>
                            </div>
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </Dialog>

            {/* Desktop sidebar */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-72 lg:flex-col">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto px-6
                        border-r border-gray-200 dark:border-white/10
                        bg-white dark:bg-gray-900">
                    <div className="flex h-16 shrink-0 items-center">
                        {brand ?? (
                            <>
                                <img alt="Logo" src="/logo-light.svg" className="h-8 w-auto dark:hidden" />
                                <img alt="Logo" src="/logo-dark.svg" className="hidden h-8 w-auto dark:block" />
                            </>
                        )}
                    </div>
                    <nav className="flex flex-1 flex-col">
                        <NavList items={nav} currentPath={location.pathname} />
                    </nav>
                </div>
            </div>
        </>
    );
}