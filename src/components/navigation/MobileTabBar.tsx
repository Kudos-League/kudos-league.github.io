import React from 'react';
import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    HomeIcon,
    PlusCircleIcon,
    CalendarIcon,
    ChatBubbleLeftRightIcon,
    BellIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline';
import {
    HomeIcon as HomeIconSolid,
    PlusCircleIcon as PlusCircleIconSolid,
    CalendarIcon as CalendarIconSolid,
    ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
    BellIcon as BellIconSolid
} from '@heroicons/react/24/solid';
import { routes } from '@/routes';
import { useNotifications } from '@/contexts/NotificationsContext';
import clsx from 'clsx';

export default function MobileTabBar() {
    const location = useLocation();
    const { state: notificationsState } = useNotifications();

    // Count unread DM notifications
    const unreadDMs = useMemo(() => {
        return notificationsState.items.filter(
            (n) => n.type === 'direct-message' && !n.isRead
        ).length;
    }, [notificationsState.items]);

    // Count unread notifications excluding direct messages
    const unreadNotifications = useMemo(() => {
        return notificationsState.items.filter(
            (n) => n.type !== 'direct-message' && !n.isRead
        ).length;
    }, [notificationsState.items]);

    const tabs = [
        {
            name: 'Home',
            path: routes.home,
            icon: HomeIcon,
            iconSolid: HomeIconSolid,
            badge: 0
        },
        {
            name: 'Create',
            path: routes.createPost,
            icon: PlusCircleIcon,
            iconSolid: PlusCircleIconSolid,
            badge: 0
        },
        {
            name: 'Events',
            path: routes.events,
            icon: CalendarIcon,
            iconSolid: CalendarIconSolid,
            badge: 0
        },
        {
            name: 'Chat',
            path: routes.dms,
            icon: ChatBubbleLeftRightIcon,
            iconSolid: ChatBubbleLeftRightIconSolid,
            badge: unreadDMs
        },
        {
            name: 'Notifications',
            path: routes.notifications,
            icon: BellIcon,
            iconSolid: BellIconSolid,
            badge: unreadNotifications
        },
        {
            name: 'Groups',
            path: routes.communities,
            icon: UserGroupIcon,
            iconSolid: UserGroupIcon,
            badge: 0
        }
    ];

    const isActive = (path: string) => {
        if (path === routes.home) {
            return location.pathname === routes.home;
        }
        return location.pathname.startsWith(path);
    };

    return (
        <nav className='lg:hidden sticky-nav top-[64px] sm:top-[72px] z-40 px-2 sm:px-3 pt-2 pb-1.5'>
            <div className='flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-1.5 rounded-xl sm:rounded-2xl backdrop-blur-xl shadow-lg '>
                {tabs.map((tab) => {
                    const active = isActive(tab.path);
                    const Icon = active ? tab.iconSolid : tab.icon;

                    return (
                        <Link
                            key={tab.path}
                            to={tab.path}
                            onClick={(e) => {
                                if (active) {
                                    e.preventDefault();
                                    window.location.reload();
                                }
                            }}
                            className={clsx(
                                'relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 sm:py-2.5 px-0.5 rounded-lg sm:rounded-xl transition-all duration-300 ease-out group',
                                active
                                    ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 active:scale-95'
                            )}
                        >
                            <div className='relative'>
                                <Icon
                                    className={clsx(
                                        'h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300',
                                        active
                                            ? 'scale-110'
                                            : 'group-hover:scale-110'
                                    )}
                                />
                                {tab.badge > 0 && (
                                    <span className='absolute -top-1 -right-1 inline-flex h-3.5 min-w-[14px] sm:h-4 sm:min-w-[16px] items-center justify-center rounded-full bg-red-600 dark:bg-red-500 px-0.5 text-[8px] sm:text-[9px] font-bold text-white shadow-lg shadow-red-600/40 dark:shadow-red-500/30 ring-2 ring-white dark:ring-zinc-900 animate-pulse'>
                                        {tab.badge > 9 ? '9+' : tab.badge}
                                    </span>
                                )}
                            </div>
                            <span
                                className={clsx(
                                    'text-[9px] sm:text-[10px] font-semibold truncate max-w-full transition-all duration-300',
                                    active
                                        ? 'opacity-100'
                                        : 'opacity-80 group-hover:opacity-100'
                                )}
                            >
                                {tab.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
