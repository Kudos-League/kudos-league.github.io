'use client';

import React, { Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { routes } from '@/routes';
import {
    Dialog,
    DialogBackdrop,
    DialogPanel,
    TransitionChild
} from '@headlessui/react';
import {
    XMarkIcon,
    HomeIcon,
    CalendarIcon,
    ChatBubbleBottomCenterTextIcon,
    InformationCircleIcon,
    ArrowRightOnRectangleIcon,
    UserPlusIcon,
    HeartIcon,
    TrophyIcon,
    FlagIcon,
    ShieldCheckIcon,
    ChatBubbleLeftRightIcon,
    PlusCircleIcon,
    UserGroupIcon
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

// Desktop sidebar items (only Home, Events, Forum for logged-in users)
function useDesktopSidebarItems(): NavItem[] {
    return [
        { name: 'Main', to: routes.home, icon: HomeIcon },
        { name: 'Events', to: routes.events, icon: CalendarIcon },
        { name: 'Forum', to: routes.chat, icon: ChatBubbleBottomCenterTextIcon },
        { name: 'Groups', to: routes.communities, icon: UserGroupIcon},
    ];
}

// Mobile hamburger menu items
function useMobileNav(isLoggedIn: boolean, isAdmin?: boolean): NavItem[] {
    if (isLoggedIn) {
        const items: NavItem[] = [
            { name: 'Main', to: routes.home, icon: HomeIcon },
            { name: 'Events', to: routes.events, icon: CalendarIcon },
            { name: 'Forum', to: routes.chat, icon: ChatBubbleBottomCenterTextIcon },
            { name: 'Groups', to: routes.communities, icon: UserGroupIcon},
            // { name: 'Leaderboard', to: routes.leaderboard, icon: TrophyIcon },
            // { name: 'Give Feedback', to: routes.feedback, icon: FlagIcon },
        ];
        if (isAdmin) {
            items.push({ name: 'Admin', to: routes.admin, icon: ShieldCheckIcon });
        }
        return items;
    }
    else {
        return [
            { name: 'About', to: routes.about, icon: InformationCircleIcon },
            { name: 'Login', to: routes.login, icon: ArrowRightOnRectangleIcon },
            { name: 'Register', to: routes.signUp, icon: UserPlusIcon }
        ];
    }
}

function NavList({
    items,
    currentPath,
    onClick
}: {
    items: NavItem[];
    currentPath: string;
    onClick?: () => void;
}) {
    const isActive = (to: string) => {
        if (to === routes.home) {
            return currentPath === routes.home;
        }
        return currentPath.startsWith(to);
    };

    return (
        <ul role='list' className='-mx-2 space-y-1'>
            {items.map((item) => {
                const active = isActive(item.to);
                return (
                    <li key={item.name}>
                        <Link
                            to={item.to}
                            onClick={onClick}
                            className={classNames(
                                active
                                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300'
                                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-brand-700 dark:text-zinc-400 dark:hover:bg-zinc-800/40 dark:hover:text-brand-300',
                                'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold'
                            )}
                        >
                            <item.icon
                                aria-hidden='true'
                                className={classNames(
                                    active
                                        ? 'text-brand-700 dark:text-brand-300'
                                        : 'text-zinc-400 group-hover:text-brand-700 dark:group-hover:text-brand-300',
                                    'size-6 shrink-0'
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
    brand
}: AppSidebarProps) {
    const location = useLocation();
    const mobileNav = useMobileNav(isLoggedIn, isAdmin);
    const desktopNav = useDesktopSidebarItems();

    return (
        <>
            {/* Mobile sidebar - slides from left with dimmed background */}
            <Dialog
                open={open}
                onClose={onClose}
                className='relative z-50 lg:hidden'
            >
                {/* Backdrop with dim effect */}
                <TransitionChild
                    as={Fragment}
                    enter='transition-opacity ease-linear duration-300'
                    enterFrom='opacity-0'
                    enterTo='opacity-100'
                    leave='transition-opacity ease-linear duration-200'
                    leaveFrom='opacity-100'
                    leaveTo='opacity-0'
                >
                    <DialogBackdrop className='fixed inset-0 bg-black/50' />
                </TransitionChild>

                <div className='fixed inset-0 flex'>
                    {/* Panel with slide-in from left */}
                    <TransitionChild
                        as={Fragment}
                        enter='transform transition ease-in-out duration-300'
                        enterFrom='-translate-x-full'
                        enterTo='translate-x-0'
                        leave='transform transition ease-in-out duration-300'
                        leaveFrom='translate-x-0'
                        leaveTo='-translate-x-full'
                    >
                        <DialogPanel className='relative mr-16 flex w-full max-w-xs flex-1'>
                            {/* Close button */}
                            <TransitionChild
                                as={Fragment}
                                enter='transition-opacity ease-in-out duration-300 delay-75'
                                enterFrom='opacity-0'
                                enterTo='opacity-100'
                                leave='transition-opacity ease-in-out duration-200'
                                leaveFrom='opacity-100'
                                leaveTo='opacity-0'
                            >
                                <div className='absolute top-0 left-full flex w-16 justify-center pt-5'>
                                    <button
                                        type='button'
                                        onClick={onClose}
                                        className='-m-2.5 p-2.5'
                                    >
                                        <span className='sr-only'>Close sidebar</span>
                                        <XMarkIcon
                                            aria-hidden='true'
                                            className='size-6 text-white'
                                        />
                                    </button>
                                </div>
                            </TransitionChild>

                            <div className='relative flex grow flex-col gap-y-5 overflow-y-auto px-6 pb-4 bg-white dark:bg-zinc-900'>
                                <div className='relative flex h-16 shrink-0 items-center'>
                                    {brand}
                                </div>
                                <nav className='relative flex flex-1 flex-col'>
                                    <NavList
                                        items={mobileNav}
                                        currentPath={location.pathname}
                                        onClick={onLinkClick ?? onClose}
                                    />
                                </nav>
                            </div>
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </Dialog>

            {/* Desktop sidebar - narrow permanent sidebar for logged-in users */}
            {isLoggedIn && (
                <div className='hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-20 lg:flex-col'>
                    <div className='flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-6'>
                        <nav className='flex flex-1 flex-col items-center gap-4'>
                            {desktopNav.map((item) => {
                                const Icon = item.icon;
                                // If item is home, only highlight when exactly on home
                                // For other items, highlight when path starts with item path
                                const active = item.to === routes.home
                                    ? location.pathname === routes.home
                                    : location.pathname.startsWith(item.to);

                                return (
                                    <Link
                                        key={item.name}
                                        to={item.to}
                                        className={classNames(
                                            'flex flex-col items-center justify-center gap-1 p-3 rounded-xl transition-all duration-200 w-16',
                                            active
                                                ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400'
                                                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800'
                                        )}
                                        title={item.name}
                                    >
                                        <Icon className={classNames(
                                            'h-6 w-6 transition-transform',
                                            active && 'scale-110'
                                        )} />
                                        <span className='text-xs font-medium'>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            )}
        </>
    );
}
