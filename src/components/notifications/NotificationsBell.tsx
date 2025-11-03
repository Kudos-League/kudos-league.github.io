import { useNotifications } from '@/contexts/NotificationsContext';
import { NotificationRecord } from '@/shared/api/types';
import { BellIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { routes } from '@/routes';
import UserCard from '../users/UserCard';

export default function NotificationsBell() {
    const { state, acknowledgeAll, markActed } = useNotifications();
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const hasLoggedMount = useRef(false);
    if (!hasLoggedMount.current) {
        hasLoggedMount.current = true;
    }
    const debug = useMemo(
        () => (...args: unknown[]) => console.debug('[NotificationsBell]', ...args),
        []
    );
    const { items, unread, loaded } = state;

    const displayNotifications = useMemo(() => {
        const unreadItems = items.filter(n => !n.isRead);
        const readItems = items.filter(n => n.isRead);
        
        if (unreadItems.length > 10) {
            // Show all unread notifications
            return unreadItems;
        }
        else if (unreadItems.length > 0) {
            // Show unread on top, then fill with read items up to 10 total
            const remainingSlots = 10 - unreadItems.length;
            return [...unreadItems, ...readItems.slice(0, remainingSlots)];
        }
        else {
            // No unread, just show last 10
            return items.slice(0, 10);
        }
    }, [items]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [open]);

    // Prevent body scroll when open on mobile
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        }
        else {
            document.body.style.overflow = '';
        }
        
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    useEffect(() => {
        if (!loaded) {
            debug('notifications not loaded yet');
            return;
        }
        debug('notifications updated', {
            items: items.length,
            unread
        });
    }, [debug, items, loaded, unread]);

    useEffect(() => {
        if (!open || unread === 0) return;
        debug('auto acknowledging new notifications while open', { unread });
        acknowledgeAll().catch((err) => {
            console.error('Failed to acknowledge notifications while open', err);
        });
    }, [acknowledgeAll, debug, open, unread]);

    const go = (n: NotificationRecord) => {
        // Extract postID from various possible locations
        const postID = ('postID' in n ? n.postID : null) 
            || (n as any)?.post?.id;

        debug('navigating from notification', {
            type: n.type,
            postID: postID,
            from: 'message' in n ? n.message?.author?.id : undefined,
            id: n.id,
            fullNotification: n
        });

        if (!n.isActedOn) {
            markActed(n.id).catch((err) => {
                console.error('Failed to mark notification acted', err);
            });
        }

        if (n.type === 'direct-message') {
            navigate(`/dms/${n.message?.author?.id ?? ''}`);
        }
        else if (n.type === 'post-reply') {
            if (postID) {
                navigate(`/post/${postID}`);
            }
            else {
                console.error('No postID found for post-reply notification', n);
            }
        }
        else if (n.type === 'post-auto-close') {
            if (postID) {
                navigate(`/post/${postID}`);
            }
            else {
                console.error('No postID found for post-auto-close notification', n);
            }
        }
        else if (n.type === 'past-gift') {
            if (postID) {
                navigate(`/post/${postID}`);
            }
            else {
                console.error('No postID found for past-gift notification', n);
            }
        }
        else if (n.type === 'bug-report' || n.type === 'site-feedback') {
            navigate(routes.admin);
        }
        setOpen(false);
    };

    return (
        <>
            <div className='relative' ref={dropdownRef}>
                <button
                    type='button'
                    aria-label='Notifications'
                    onClick={() =>
                        setOpen((prev) => {
                            const next = !prev;
                            debug('toggle dropdown', { from: prev, to: next, unread });
                            if (!prev && next && unread > 0) {
                                debug('acknowledging notifications on open', { pending: unread });
                                acknowledgeAll().catch((err) => {
                                    console.error('Failed to acknowledge notifications', err);
                                });
                            }
                            return next;
                        })
                    }
                    className='relative flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-zinc-800 shadow-lg ring-1 shadow-zinc-800/5 ring-zinc-900/5 backdrop-blur-sm hover:ring-zinc-800/10 dark:bg-zinc-800/90 dark:text-zinc-200 dark:ring-white/10 dark:hover:ring-white/20'
                >
                    <BellIcon className='h-5 w-5' aria-hidden='true' />
                    {state.unread > 0 && (
                        <span
                            className='absolute -top-2 -right-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-semibold leading-none text-white shadow-sm'
                            aria-label={`${state.unread} unread notifications`}
                        >
                            {state.unread > 9 ? '9+' : state.unread}
                        </span>
                    )}
                </button>

                {open && (
                    <div 
                        className='
                            fixed md:absolute 
                            inset-x-0 md:inset-x-auto
                            top-20 md:top-auto
                            md:right-0 
                            md:mt-2 
                            w-full md:w-80 
                            max-h-[calc(100vh-6rem)] md:max-h-96 
                            overflow-auto 
                            rounded-t-2xl md:rounded-lg 
                            border md:border 
                            border-zinc-200 
                            bg-white 
                            text-zinc-800 
                            shadow-xl 
                            dark:border-white/10 
                            dark:bg-zinc-900 
                            dark:text-zinc-200
                            z-[70]
                            flex flex-col
                        '
                    >
                        <ul className='flex-1 overflow-auto'>
                            {!state.loaded ? (
                                <li className='p-4 md:p-3 text-sm text-zinc-600 dark:text-zinc-400'>
                                    Loading…
                                </li>
                            ) : items.length === 0 ? (
                                <li className='p-4 md:p-3 text-sm text-zinc-600 dark:text-zinc-400'>
                                    No notifications yet
                                </li>
                            ) : (
                                displayNotifications.map((n) => (
                                    <li
                                        key={n.id}
                                        className={`
                                            relative cursor-pointer 
                                            p-4 md:p-3 
                                            hover:bg-zinc-50 
                                            dark:hover:bg-zinc-800/60 
                                            active:bg-zinc-100 dark:active:bg-zinc-800
                                            ${n.isRead ? 'opacity-90' : 'bg-teal-50/60 dark:bg-teal-900/30'}
                                        `}
                                        onClick={() => go(n)}
                                    >
                                        {!n.isRead && (
                                            <span className='absolute right-4 md:right-3 top-4 md:top-3 text-[10px] font-semibold uppercase tracking-wide text-teal-600 dark:text-teal-400'>
                                                New
                                            </span>
                                        )}
                                        {n.type === 'direct-message' ? (
                                            <div>
                                                <div className='text-sm md:text-sm font-medium mb-1.5 md:mb-1 pr-12'>
                                                    New DM from <UserCard user={n.message?.author} triggerVariant='name' />
                                                </div>
                                                <div className='line-clamp-2 md:truncate text-sm text-zinc-600 dark:text-zinc-400'>
                                                    {n.message?.content}
                                                </div>
                                            </div>
                                        ) : n.type === 'post-reply' ? (
                                            <div>
                                                <div className='text-sm md:text-sm font-medium mb-1.5 md:mb-1 pr-12'>
                                                    <UserCard user={n.message?.author} triggerVariant='name' /> replied to your post
                                                </div>
                                                <div className='line-clamp-2 md:truncate text-sm text-zinc-600 dark:text-zinc-400'>
                                                    {n.message?.content}
                                                </div>
                                            </div>
                                        ) : n.type === 'past-gift' ? (
                                            <div>
                                                <div className='text-sm md:text-sm font-medium'>Past gift logged</div>
                                                <div className='line-clamp-2 md:truncate text-sm text-zinc-600 dark:text-zinc-400'>
                                                    Open to view details
                                                </div>
                                            </div>
                                        ) : n.type === 'bug-report' ? (
                                            <div>
                                                <div className='text-sm md:text-sm font-medium'>New bug report</div>
                                                <div className='line-clamp-2 md:truncate text-sm text-zinc-600 dark:text-zinc-400'>
                                                    Feedback #{'feedbackID' in n ? n.feedbackID : ''}
                                                </div>
                                            </div>
                                        ) : n.type === 'site-feedback' ? (
                                            <div>
                                                <div className='text-sm md:text-sm font-medium'>New site feedback</div>
                                                <div className='line-clamp-2 md:truncate text-sm text-zinc-600 dark:text-zinc-400'>
                                                    Feedback #{'feedbackID' in n ? n.feedbackID : ''}
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className='text-sm md:text-sm font-medium'>Post auto-close</div>
                                                <div className='line-clamp-2 md:truncate text-sm text-zinc-600 dark:text-zinc-400'>
                                                    {('closeAt' in n && n.closeAt
                                                        ? new Date(n.closeAt).toLocaleString()
                                                        : 'Due to inactivity') as any}
                                                </div>
                                            </div>
                                        )}
                                    </li>
                                ))
                            )}
                        </ul>
                        <div className='sticky bottom-0 border-t border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-900 p-3'>
                            <Link
                                to={routes.notifications}
                                onClick={() => setOpen(false)}
                                className='block w-full text-center py-2.5 px-4 text-sm font-medium rounded-lg text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500 transition-colors'
                            >
                                View all notifications
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
