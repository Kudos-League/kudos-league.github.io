import { useNotifications } from '@/contexts/NotificationsContext';
import { NotificationPayload } from '@/shared/api/types';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotificationsBell() {
    const { state, markAllRead } = useNotifications();
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    const go = (n: NotificationPayload) => {
        if (n.type === 'direct-message') {
            navigate(`/dm/${n.message?.author?.id ?? ''}`);
        }
        else if (n.type === 'post-reply') {
            navigate(`/posts/${n.postID}`);
        }
        else if (n.type === 'post-auto-close') {
            navigate(`/posts/${n.postID}`);
        }
        setOpen(false);
    };

    return (
        <>
            <div className='relative'>
                <button
                    className='relative'
                    onClick={() => setOpen((v) => !v)}
                    aria-label='Notifications'
                >
                    🔔
                    {state.unread > 0 && (
                        <span className='absolute -top-2 -right-2 bg-red-600 text-white rounded-full px-2 text-xs'>
                            {state.unread}
                        </span>
                    )}
                </button>

                {open && (
                    <div className='absolute right-0 mt-2 w-80 max-h-96 overflow-auto bg-white shadow rounded z-50'>
                        <div className='flex justify-between items-center p-2 border-b'>
                            <span className='font-semibold'>Notifications</span>
                            <button
                                className='text-sm underline'
                                onClick={markAllRead}
                            >
                                Mark all read
                            </button>
                        </div>
                        <ul>
                            {!state.loaded ? (
                                <li className='p-3 text-sm text-gray-500'>
                                    Loading…
                                </li>
                            ) : state.items.length === 0 ? (
                                <li className='p-3 text-sm text-gray-500'>
                                    No notifications yet
                                </li>
                            ) : (
                                state.items.map((n, i) => (
                                    <li
                                        key={i}
                                        className='p-3 hover:bg-gray-50 cursor-pointer'
                                        onClick={() => go(n)}
                                    >
                                        {n.type === 'direct-message' ? (
                                            <div>
                                                <div className='font-medium'>
                                                    New DM
                                                </div>
                                                <div className='text-sm text-gray-600 truncate'>
                                                    {n.message?.content}
                                                </div>
                                            </div>
                                        ) : n.type === 'post-reply' ? (
                                            <div>
                                                <div className='font-medium'>
                                                    Reply to your post
                                                </div>
                                                <div className='text-sm text-gray-600 truncate'>
                                                    {n.message?.content}
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className='font-medium'>Post auto-close</div>
                                                <div className='text-sm text-gray-600 truncate'>
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
