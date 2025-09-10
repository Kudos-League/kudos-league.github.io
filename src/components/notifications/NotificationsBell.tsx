import { useNotifications } from '@/contexts/NotificationsContext';
import { NotificationPayload } from '@/shared/api/types';
import { BellIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotificationsBell() {
    const { state, markAllRead } = useNotifications();
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef<HTMLDivElement>(null); // Add ref


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

    const go = (n: NotificationPayload) => {
        if (n.type === 'direct-message') {
            navigate(`/dm/${n.message?.author?.id ?? ''}`);
        }
        else if (n.type === 'post-reply') {
            navigate(`/post/${n.postID}`);
        }
        else if (n.type === 'post-auto-close') {
            navigate(`/post/${n.postID}`);
        }
        else if (n.type === 'past-gift') {
            navigate(`/post/${n.postID}`);
        }
        setOpen(false);
    };

    return (
        <>
            <div className='relative' ref={dropdownRef}>
                <button
                    type='button'
                    aria-label='Notifications'
                    onClick={() => setOpen((v) => !v)}
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
                    <div className='absolute right-0 mt-2 w-80 max-h-96 overflow-auto rounded-lg border border-zinc-200 bg-white text-zinc-800 shadow-xl dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200'>
                        <div className='flex items-center justify-between border-b border-zinc-200 px-3 py-2 dark:border-white/10'>
                            <span className='text-sm font-semibold'>Notifications</span>
                            <button
                                className='text-xs font-medium text-teal-600 hover:underline dark:text-teal-400'
                                onClick={markAllRead}
                            >
                                Mark all read
                            </button>
                        </div>
                        <ul>
                            {!state.loaded ? (
                                <li className='p-3 text-sm text-zinc-600 dark:text-zinc-400'>
                                    Loading…
                                </li>
                            ) : state.items.length === 0 ? (
                                <li className='p-3 text-sm text-zinc-600 dark:text-zinc-400'>
                                    No notifications yet
                                </li>
                            ) : (
                                state.items.map((n, i) => (
                                    <li
                                        key={i}
                                        className='cursor-pointer p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                                        onClick={() => go(n)}
                                    >
                                        {n.type === 'direct-message' ? (
                                            <div>
                                                <div className='text-sm font-medium'>New DM</div>
                                                <div className='truncate text-sm text-zinc-600 dark:text-zinc-400'>
                                                    {n.message?.content}
                                                </div>
                                            </div>
                                        ) : n.type === 'post-reply' ? (
                                            <div>
                                                <div className='text-sm font-medium'>Reply to your post</div>
                                                <div className='truncate text-sm text-zinc-600 dark:text-zinc-400'>
                                                    {n.message?.content}
                                                </div>
                                            </div>
                                        ) : n.type === 'past-gift' ? (
                                            <div>
                                                <div className='text-sm font-medium'>Past gift logged</div>
                                                <div className='truncate text-sm text-zinc-600 dark:text-zinc-400'>
                                                    Open to view details
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className='text-sm font-medium'>Post auto-close</div>
                                                <div className='truncate text-sm text-zinc-600 dark:text-zinc-400'>
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
                    </div>
                )}
            </div>
        </>
    );
}
