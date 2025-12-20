import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    HomeIcon,
    PlusCircleIcon,
    CalendarIcon,
    ChatBubbleLeftRightIcon,
    ChatBubbleBottomCenterTextIcon,
    BellIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline';
import {
    HomeIcon as HomeIconSolid,
    PlusCircleIcon as PlusCircleIconSolid,
    CalendarIcon as CalendarIconSolid,
    ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
    ChatBubbleBottomCenterTextIcon as ChatBubbleBottomCenterTextIconSolid,
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

    // Count total unread notifications
    const unreadNotifications = notificationsState.unread;

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
            icon:  UserGroupIcon,
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
        <nav className="lg:hidden sticky top-[64px] sm:top-[72px] z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center px-1 py-1">
                {tabs.map((tab) => {
                    const active = isActive(tab.path);
                    const Icon = active ? tab.iconSolid : tab.icon;

                    return (
                        <Link
                            key={tab.path}
                            to={tab.path}
                            className={clsx(
                                'relative flex flex-1 flex-col items-center justify-center py-2 transition-colors duration-150',
                                active
                                    ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400'
                            )}
                        >
                            <Icon className="h-6 w-6 mb-0.5" />
                            <span className="text-[10px] font-medium truncate">
                                {tab.name}
                            </span>

                            {tab.badge > 0 && (
                                <span className="absolute top-1.5 right-4 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-semibold text-white">
                                    {tab.badge > 9 ? '9+' : tab.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>

    );
}
