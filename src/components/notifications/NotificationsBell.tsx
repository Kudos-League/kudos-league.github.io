import { useNotifications } from '@/contexts/NotificationsContext';
import { NotificationRecord } from '@/shared/api/types';
import { BellIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { routes } from '@/routes';
import UserCard from '../users/UserCard';
import { useAuth } from '@/contexts/useAuth';
import { useCachedHandshake, useCachedPost, useCachedUser } from '@/contexts/DataCacheContext';

// Compact handshake preview for dropdown notifications
function HandshakeNotificationPreview({
    handshakeID,
    userID,
    notificationType
}: {
    handshakeID: number;
    userID?: number;
    notificationType: string;
}) {
    const navigate = useNavigate();
    const { handshake, loading, error } = useCachedHandshake(handshakeID);

    // Determine other user ID
    const otherUserID = handshake
        ? handshake.senderID === userID
            ? handshake.receiverID
            : handshake.senderID
        : undefined;

    const { user: otherUser } = useCachedUser(otherUserID);

    if (loading) {
        return (
            <div className='text-sm text-zinc-600 dark:text-zinc-400'>
                Loading...
            </div>
        );
    }

    if (error || !handshake) {
        return (
            <div className='text-sm text-red-600 dark:text-red-400'>
                Failed to load handshake details
            </div>
        );
    }

    const postTitle = handshake.post?.title || 'Post';
    const postType = handshake.post?.type || 'request';

    // Determine user's help action context
    const userHelpAction: 'receiving' | 'giving' | null =
        userID === handshake.receiverID
            ? postType === 'request'
                ? 'receiving'
                : 'giving'
            : userID === handshake.senderID
                ? postType === 'request'
                    ? 'giving'
                    : 'receiving'
                : null;

    let statusMessage = '';
    let statusColor = 'text-zinc-700 dark:text-zinc-300';

    if (notificationType === 'handshake-created') {
        statusMessage =
            postType === 'request' ? 'wants to help with' : 'wants to request';
        statusColor = 'text-blue-700 dark:text-blue-300';
    }
    else if (notificationType === 'handshake-accepted') {
        statusMessage = 'accepted your help offer on';
        statusColor = 'text-green-700 dark:text-green-300';
    }
    else if (notificationType === 'handshake-completed') {
        statusMessage =
            userHelpAction === 'receiving'
                ? 'received help on'
                : 'completed helping on';
        statusColor = 'text-emerald-700 dark:text-emerald-300';
    }
    else if (notificationType === 'handshake-cancelled') {
        statusMessage =
            userHelpAction === 'receiving'
                ? 'stopped receiving help on'
                : 'stopped helping on';
        statusColor = 'text-red-700 dark:text-red-300';
    }

    return (
        <div
            className='cursor-pointer'
            onClick={() => {
                if (handshake.post?.id) navigate(`/post/${handshake.post.id}`);
            }}
        >
            {otherUser && (
                <div className='mb-2 flex items-start gap-2'>
                    <div onClick={(e) => e.stopPropagation()}>
                        <UserCard user={otherUser} />
                    </div>
                    <div className='flex-1 min-w-0'>
                        <div className='text-sm'>
                            <span
                                className='font-semibold hover:underline'
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/user/${otherUser.id}`);
                                }}
                            >
                                {otherUser.displayName || otherUser.username}
                            </span>{' '}
                            <span className={statusColor}>{statusMessage}</span>
                        </div>
                        <div className='text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline truncate'>
                            &quot;{postTitle}&quot;
                        </div>
                        {(() => {
                            const creator = handshake.post?.sender?.displayName || handshake.post?.sender?.username;
                            return creator ? (
                                <div className='text-xs text-zinc-500 dark:text-zinc-400'>
                                    by {creator}
                                </div>
                            ) : null;
                        })()}
                        <div className='mt-1 text-xs text-zinc-500 dark:text-zinc-400'>
                            Status:{' '}
                            <span className='font-semibold capitalize'>
                                {handshake.status}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function PostReplyBellItem({
    n,
    formatTimeAgo
}: {
    n: any;
    formatTimeAgo: (n: any) => string;
}) {
    const navigate = useNavigate();
    const postID = 'postID' in n ? n.postID : undefined;
    const { post } = useCachedPost(postID || 0);

    return (
        <div>
            <div className='flex items-start justify-between gap-2 mb-1.5 md:mb-1'>
                <div className='text-sm md:text-sm font-medium pr-12'>
                    <UserCard user={n.message?.author} triggerVariant='name' />{' '}
                    replied to{post ? (
                        <>
                            {' '}
                            <span
                                className='font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer'
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/post/${post.id}`);
                                }}
                            >
                                &quot;{post.title}&quot;
                            </span>
                            {(post.sender?.displayName || post.sender?.username) && (
                                <span className='font-normal text-zinc-500 dark:text-zinc-400'>
                                    {' '}by {post.sender.displayName || post.sender.username}
                                </span>
                            )}
                        </>
                    ) : ' your post'}
                </div>
                <div className='text-xs text-zinc-500 dark:text-zinc-500 whitespace-nowrap mt-0.5'>
                    {formatTimeAgo(n)}
                </div>
            </div>
            <div className='line-clamp-2 md:truncate text-sm text-zinc-600 dark:text-zinc-400'>
                {n.message?.content}
            </div>
        </div>
    );
}

export default function NotificationsBell() {
    const { state, acknowledgeAll, markActed } = useNotifications();
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const hasLoggedMount = useRef(false);
    if (!hasLoggedMount.current) {
        hasLoggedMount.current = true;
    }
    const debug = useMemo(
        () =>
            (...args: unknown[]) =>
                console.debug('[NotificationsBell]', ...args),
        []
    );
    const { items, unread, loaded } = state;

    // Calculate unread count excluding direct messages
    const unreadCountWithoutDMs = useMemo(() => {
        return items.filter(
            (item) => item.type !== 'direct-message' && !item.isRead
        ).length;
    }, [items]);

    // Sort notifications by timestamp (most recent first), excluding direct messages
    const sortedItems = useMemo(() => {
        // Filter out direct messages - they should only appear in the messages section
        const itemsWithoutDMs = items.filter(
            (item) => item.type !== 'direct-message'
        );

        return [...itemsWithoutDMs].sort((a, b) => {
            // Try different possible timestamp field names
            const getTimestamp = (n: any) => {
                const timestamp =
                    n.createdAt ||
                    n.timestamp ||
                    n.created ||
                    n.date ||
                    n.updatedAt;
                return timestamp ? new Date(timestamp).getTime() : 0;
            };

            const timeA = getTimestamp(a);
            const timeB = getTimestamp(b);

            // If no timestamps, sort by ID (higher ID = more recent)
            if (!timeA && !timeB) {
                return (b.id || 0) - (a.id || 0);
            }

            return timeB - timeA; // Descending order (newest first)
        });
    }, [items]);

    const displayNotifications = useMemo(() => {
        const unreadItems = sortedItems.filter((n) => !n.isRead);
        const readItems = sortedItems.filter((n) => n.isRead);

        if (unreadItems.length >= 10) {
            // Show all unread notifications if 10 or more
            return unreadItems;
        }
        else if (unreadItems.length > 0) {
            // Show unread on top, then fill with read items to make at least 5 total
            const totalNeeded = Math.max(5, unreadItems.length);
            const readNeeded = totalNeeded - unreadItems.length;
            return [...unreadItems, ...readItems.slice(0, readNeeded)];
        }
        else {
            // No unread - show 5 most recent notifications
            return sortedItems.slice(0, 5);
        }
    }, [sortedItems]);

    // Check if there are any recent notifications (within last week) or any unread notifications
    const hasRecentNotifications = useMemo(() => {
        if (items.length === 0) return false;

        // If there are any unread notifications, consider them as "recent" regardless of timestamp
        const hasUnread = sortedItems.some((n) => !n.isRead);
        if (hasUnread) return true;

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        return sortedItems.some((n) => {
            const timestamp =
                n.createdAt || (n as any).created || (n as any).date;
            if (!timestamp) return false;
            return new Date(timestamp) > oneWeekAgo;
        });
    }, [items.length, sortedItems]);

    // Format relative time (e.g., "2m ago", "1h ago")
    const formatTimeAgo = (notification: NotificationRecord) => {
        // Try different possible timestamp field names
        const timestamp =
            notification.createdAt ||
            (notification as any).created ||
            (notification as any).date;

        if (!timestamp) return '';

        const now = new Date();
        const then = new Date(timestamp);
        const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        return then.toLocaleDateString();
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
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

    const go = (n: NotificationRecord) => {
        // Extract postID from various possible locations
        const postID =
            ('postID' in n ? n.postID : null) || (n as any)?.post?.id;

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

        if (n.type === 'post-reply') {
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
                console.error(
                    'No postID found for post-auto-close notification',
                    n
                );
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
        else if (
            n.type === 'handshake-created' ||
            n.type === 'handshake-accepted' ||
            n.type === 'handshake-completed' ||
            n.type === 'handshake-cancelled'
        ) {
            if (postID) {
                navigate(`/post/${postID}`);
            }
            else {
                console.error('No postID found for handshake notification', n);
            }
        }
        else if (n.type === 'event-user-joined') {
            const eventID = 'eventID' in n ? n.eventID : null;
            if (eventID) {
                navigate(`/event/${eventID}`);
            }
            else {
                console.error(
                    'No eventID found for event-user-joined notification',
                    n
                );
            }
        }
        setOpen(false);
    };

    return (
        <>
            <div className='relative' ref={dropdownRef}>
                <button
                    type='button'
                    aria-label='Notifications'
                    onClick={() => setOpen((prev) => !prev)}
                    className='relative flex h-9 w-9 sm:h-10 sm:w-10 lg:h-12 lg:w-12 items-center justify-center rounded-lg bg-white/90 text-zinc-800 shadow-lg ring-1 shadow-zinc-800/5 ring-zinc-900/5 backdrop-blur-sm hover:ring-zinc-800/10 dark:bg-zinc-800/90 dark:text-zinc-200 dark:ring-white/10 dark:hover:ring-white/20'
                >
                    <BellIcon
                        className='h-5 w-5 sm:h-6 sm:w-6 lg:h-6 lg:w-6'
                        aria-hidden='true'
                    />
                    {unreadCountWithoutDMs > 0 && (
                        <span
                            className='absolute -top-1 -right-1 sm:-top-2 sm:-right-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-semibold leading-none text-white shadow-sm'
                            aria-label={`${unreadCountWithoutDMs} unread notifications`}
                        >
                            {unreadCountWithoutDMs > 9
                                ? '9+'
                                : unreadCountWithoutDMs}
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
                                    No new notifications
                                </li>
                            ) : !hasRecentNotifications ? (
                                <li className='p-4 md:p-3 text-sm text-zinc-600 dark:text-zinc-400'>
                                    No recent notifications
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
                                            ${n.isRead ? 'opacity-90' : 'bg-brand-50/60 dark:bg-brand-900/30'}
                                        `}
                                        onClick={() => go(n)}
                                    >
                                        {n.type === 'post-reply' ? (
                                            <PostReplyBellItem
                                                n={n}
                                                formatTimeAgo={formatTimeAgo}
                                            />
                                        ) : n.type === 'past-gift' ? (
                                            <div>
                                                <div className='flex items-start justify-between gap-2 mb-1'>
                                                    <div className='text-sm md:text-sm font-medium'>
                                                        Past gift logged
                                                    </div>
                                                    <div className='text-xs text-zinc-500 dark:text-zinc-500 whitespace-nowrap mt-0.5'>
                                                        {formatTimeAgo(n)}
                                                    </div>
                                                </div>
                                                <div className='line-clamp-2 md:truncate text-sm text-zinc-600 dark:text-zinc-400'>
                                                    Open to view details
                                                </div>
                                            </div>
                                        ) : n.type === 'bug-report' ? (
                                            <div>
                                                <div className='flex items-start justify-between gap-2 mb-1'>
                                                    <div className='text-sm md:text-sm font-medium'>
                                                        New bug report
                                                    </div>
                                                    <div className='text-xs text-zinc-500 dark:text-zinc-500 whitespace-nowrap mt-0.5'>
                                                        {formatTimeAgo(n)}
                                                    </div>
                                                </div>
                                                <div className='line-clamp-2 md:truncate text-sm text-zinc-600 dark:text-zinc-400'>
                                                    Feedback #
                                                    {'feedbackID' in n
                                                        ? n.feedbackID
                                                        : ''}
                                                </div>
                                            </div>
                                        ) : n.type === 'site-feedback' ? (
                                            <div>
                                                <div className='flex items-start justify-between gap-2 mb-1'>
                                                    <div className='text-sm md:text-sm font-medium'>
                                                        New site feedback
                                                    </div>
                                                    <div className='text-xs text-zinc-500 dark:text-zinc-500 whitespace-nowrap mt-0.5'>
                                                        {formatTimeAgo(n)}
                                                    </div>
                                                </div>
                                                <div className='line-clamp-2 md:truncate text-sm text-zinc-600 dark:text-zinc-400'>
                                                    Feedback #
                                                    {'feedbackID' in n
                                                        ? n.feedbackID
                                                        : ''}
                                                </div>
                                            </div>
                                        ) : n.type === 'handshake-created' ? (
                                            <div>
                                                <div className='flex items-start justify-between gap-2 mb-2'>
                                                    <div className='text-sm md:text-sm font-medium text-blue-700 dark:text-blue-300'>
                                                        New handshake request
                                                    </div>
                                                    <div className='text-xs text-zinc-500 dark:text-zinc-500 whitespace-nowrap mt-0.5'>
                                                        {formatTimeAgo(n)}
                                                    </div>
                                                </div>
                                                {'handshakeID' in n &&
                                                n.handshakeID ? (
                                                        <HandshakeNotificationPreview
                                                            handshakeID={
                                                                n.handshakeID
                                                            }
                                                            userID={user?.id}
                                                            notificationType={
                                                                n.type
                                                            }
                                                        />
                                                    ) : (
                                                        <div className='text-sm text-zinc-600 dark:text-zinc-400'>
                                                        Someone wants to
                                                        handshake on your post
                                                        </div>
                                                    )}
                                            </div>
                                        ) : n.type === 'handshake-accepted' ? (
                                            <div>
                                                <div className='flex items-start justify-between gap-2 mb-2'>
                                                    <div className='text-sm md:text-sm font-medium text-green-700 dark:text-green-300'>
                                                        Handshake accepted
                                                    </div>
                                                    <div className='text-xs text-zinc-500 dark:text-zinc-500 whitespace-nowrap mt-0.5'>
                                                        {formatTimeAgo(n)}
                                                    </div>
                                                </div>
                                                {'handshakeID' in n &&
                                                n.handshakeID ? (
                                                        <HandshakeNotificationPreview
                                                            handshakeID={
                                                                n.handshakeID
                                                            }
                                                            userID={user?.id}
                                                            notificationType={
                                                                n.type
                                                            }
                                                        />
                                                    ) : (
                                                        <div className='text-sm text-zinc-600 dark:text-zinc-400'>
                                                        Your handshake request
                                                        was accepted!
                                                        </div>
                                                    )}
                                            </div>
                                        ) : n.type === 'handshake-completed' ? (
                                            <div>
                                                <div className='flex items-start justify-between gap-2 mb-2'>
                                                    <div className='text-sm md:text-sm font-medium text-emerald-700 dark:text-emerald-300'>
                                                        Handshake completed
                                                    </div>
                                                    <div className='text-xs text-zinc-500 dark:text-zinc-500 whitespace-nowrap mt-0.5'>
                                                        {formatTimeAgo(n)}
                                                    </div>
                                                </div>
                                                {'handshakeID' in n &&
                                                n.handshakeID ? (
                                                        <HandshakeNotificationPreview
                                                            handshakeID={
                                                                n.handshakeID
                                                            }
                                                            userID={user?.id}
                                                            notificationType={
                                                                n.type
                                                            }
                                                        />
                                                    ) : (
                                                        <div className='text-sm text-zinc-600 dark:text-zinc-400'>
                                                        The transaction has been
                                                        completed
                                                        </div>
                                                    )}
                                            </div>
                                        ) : n.type === 'handshake-cancelled' ? (
                                            <div>
                                                <div className='flex items-start justify-between gap-2 mb-2'>
                                                    <div className='text-sm md:text-sm font-medium text-red-700 dark:text-red-300'>
                                                        Handshake cancelled
                                                    </div>
                                                    <div className='text-xs text-zinc-500 dark:text-zinc-500 whitespace-nowrap mt-0.5'>
                                                        {formatTimeAgo(n)}
                                                    </div>
                                                </div>
                                                {'handshakeID' in n &&
                                                n.handshakeID ? (
                                                        <HandshakeNotificationPreview
                                                            handshakeID={
                                                                n.handshakeID
                                                            }
                                                            userID={user?.id}
                                                            notificationType={
                                                                n.type
                                                            }
                                                        />
                                                    ) : (
                                                        <div className='text-sm text-zinc-600 dark:text-zinc-400'>
                                                            {'noShowReported' in
                                                            n &&
                                                        n.noShowReported
                                                                ? 'Cancelled due to no-show'
                                                                : 'The handshake was cancelled'}
                                                        </div>
                                                    )}
                                            </div>
                                        ) : n.type === 'event-user-joined' ? (
                                            <div>
                                                <div className='flex items-start justify-between gap-2 mb-1.5 md:mb-1'>
                                                    <div className='text-sm md:text-sm font-medium text-brand-700 dark:text-brand-300'>
                                                        Someone joined your
                                                        event
                                                    </div>
                                                    <div className='text-xs text-zinc-500 dark:text-zinc-500 whitespace-nowrap mt-0.5'>
                                                        {formatTimeAgo(n)}
                                                    </div>
                                                </div>
                                                {(() => {
                                                    const hasUser =
                                                        'user' in n && n.user;
                                                    console.log(
                                                        '[NotificationsBell] EVENT_USER_JOINED:',
                                                        {
                                                            notification: n,
                                                            hasUser,
                                                            user:
                                                                'user' in n
                                                                    ? n.user
                                                                    : undefined,
                                                            userID:
                                                                'userID' in n
                                                                    ? n.userID
                                                                    : undefined
                                                        }
                                                    );
                                                    return hasUser ? (
                                                        <div
                                                            className='mb-1'
                                                            onClick={(e) =>
                                                                e.stopPropagation()
                                                            }
                                                        >
                                                            <UserCard
                                                                user={n.user}
                                                                triggerVariant='avatar-name'
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className='text-sm text-zinc-600 dark:text-zinc-400 mb-1'>
                                                            Someone joined your
                                                            event
                                                        </div>
                                                    );
                                                })()}
                                                <div className='text-xs text-zinc-500 dark:text-zinc-400 italic'>
                                                    Click to view event
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className='flex items-start justify-between gap-2 mb-1'>
                                                    <div className='text-sm md:text-sm font-medium'>
                                                        Post auto-close
                                                    </div>
                                                    <div className='text-xs text-zinc-500 dark:text-zinc-500 whitespace-nowrap mt-0.5'>
                                                        {formatTimeAgo(n)}
                                                    </div>
                                                </div>
                                                <div className='line-clamp-2 md:truncate text-sm text-zinc-600 dark:text-zinc-400'>
                                                    Due to inactivity
                                                </div>
                                            </div>
                                        )}
                                    </li>
                                ))
                            )}
                        </ul>
                        <div className='sticky bottom-0 border-t border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-900 p-3 space-y-2'>
                            <button
                                onClick={() => {
                                    navigate(routes.notifications);
                                    setOpen(false);
                                }}
                                className='block w-full text-center py-2.5 px-4 text-sm font-medium rounded-lg text-white bg-brand-600 hover:bg-brand-500 dark:bg-brand-400 dark:hover:bg-brand-300 transition-colors'
                            >
                                View all notifications
                            </button>
                            <button
                                onClick={() => {
                                    acknowledgeAll();
                                    setOpen(false);
                                }}
                                className='block w-full text-center py-2 px-4 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors'
                            >
                                Mark all as read
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
