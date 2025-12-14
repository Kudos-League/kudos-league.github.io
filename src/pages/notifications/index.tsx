import React, { useCallback, useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Filter, MessageSquare, Handshake, MessageCircle, X, MoreHorizontal } from 'lucide-react';

import Spinner from '@/components/common/Spinner';
import Alert from '@/components/common/Alert';
import { apiGet } from '@/shared/api/apiClient';
import {
    NotificationRecord,
    NotificationType,
    NotificationsHistoryResponse
} from '@/shared/api/types';
import { routes } from '@/routes';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useAuth } from '@/contexts/useAuth';
import UserCard from '@/components/users/UserCard';
import { getImagePath } from '@/shared/api/config';
import HandshakeCard from '@/components/handshakes/HandshakeCard';
import type { HandshakeDTO } from '@/shared/api/types';
import { useCachedHandshake, useCachedUser } from '@/contexts/DataCacheContext';

const PAGE_SIZE = 20;
const historyQueryKey = ['notifications', 'history', PAGE_SIZE] as const;

function HandshakeNotificationCard({
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

    // Determine the other user ID
    const otherUserID = handshake
        ? (handshake.senderID === userID ? handshake.receiverID : handshake.senderID)
        : undefined;

    const { user: otherUser } = useCachedUser(otherUserID);

    if (loading) {
        return (
            <div className='text-sm text-zinc-600 dark:text-zinc-400 py-2'>
                Loading handshake...
            </div>
        );
    }

    if (error || !handshake) {
        return (
            <div className='text-sm text-red-600 dark:text-red-400 py-2'>
                Failed to load handshake details
            </div>
        );
    }

    const postTitle = handshake.post?.title || 'Post';
    const postType = handshake.post?.type || 'request';

    let descriptionText = '';
    if (notificationType === NotificationType.HANDSHAKE_CREATED) {
        descriptionText = postType === 'request' ? 'wants to help with' : 'wants to request';
    }
    else if (notificationType === NotificationType.HANDSHAKE_ACCEPTED) {
        descriptionText = 'accepted your handshake on';
    }
    else if (notificationType === NotificationType.HANDSHAKE_COMPLETED) {
        descriptionText = 'completed handshake on';
    }
    else if (notificationType === NotificationType.HANDSHAKE_CANCELLED) {
        descriptionText = 'cancelled handshake on';
    }

    return (
        <div onClick={(e) => e.stopPropagation()}>
            {/* Descriptive header */}
            {otherUser && (
                <div className='mb-3 text-sm text-zinc-700 dark:text-zinc-300'>
                    <span
                        className='font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer'
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/user/${otherUser.id}`);
                        }}
                    >
                        {otherUser.displayName || otherUser.username || 'User'}
                    </span>
                    {' '}{descriptionText}{' '}
                    <span
                        className='font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer'
                        onClick={(e) => {
                            e.stopPropagation();
                            if (handshake.post?.id) navigate(`/post/${handshake.post.id}`);
                        }}
                    >
                        &quot;{postTitle}&quot;
                    </span>
                </div>
            )}

            {/* Full handshake card */}
            <HandshakeCard
                handshake={handshake}
                userID={userID}
                showPostDetails={false}
            />
        </div>
    );
}

function describeNotification(notification: NotificationRecord) {
    switch (notification.type) {
    case NotificationType.DIRECT_MESSAGE: {
        const author =
            notification.message?.author?.username || 'Someone';
        return {
            title: `Direct message from ${author}`,
            description: notification.message?.content || ''
        };
    }
    case NotificationType.POST_REPLY:
        return {
            title: 'Reply to your post',
            description: notification.message?.content || ''
        };
    case NotificationType.POST_AUTO_CLOSE: {
        const closeAt =
            (notification as any).closeAt || (notification as any).closedAt;
        const when =
            typeof closeAt === 'string' && closeAt
                ? new Date(closeAt).toLocaleString()
                : null;
        return {
            title: 'Post auto-close',
            description: when
                ? `Closed at ${when}`
                : 'Closed due to inactivity.'
        };
    }
    case NotificationType.PAST_GIFT:
        return {
            title: 'Past gift logged',
            description: 'Open to view details.'
        };
    case NotificationType.BUG_REPORT: {
        const feedbackID =
            'feedbackID' in notification ? notification.feedbackID : undefined;
        return {
            title: 'New bug report submitted',
            description: feedbackID
                ? `Feedback #${feedbackID}`
                : 'Review in the admin dashboard.'
        };
    }
    case NotificationType.SITE_FEEDBACK: {
        const feedbackID =
            'feedbackID' in notification ? notification.feedbackID : undefined;
        return {
            title: 'New site feedback submitted',
            description: feedbackID
                ? `Feedback #${feedbackID}`
                : 'Review in the admin dashboard.'
        };
    }
    case NotificationType.HANDSHAKE_CREATED:
        return {
            title: 'New handshake request',
            description: 'Someone wants to handshake on your post.'
        };
    case NotificationType.HANDSHAKE_ACCEPTED:
        return {
            title: 'Handshake accepted',
            description: 'Your handshake request was accepted!'
        };
    case NotificationType.HANDSHAKE_COMPLETED:
        return {
            title: 'Handshake completed',
            description: 'The transaction has been completed.'
        };
    case NotificationType.HANDSHAKE_CANCELLED: {
        const noShow = 'noShowReported' in notification ? notification.noShowReported : false;
        return {
            title: 'Handshake cancelled',
            description: noShow
                ? 'The handshake was cancelled due to a no-show.'
                : 'The handshake was cancelled.'
        };
    }
    default:
        return {
            title: 'Notification',
            description: ''
        };
    }
}

function formatCreatedAt(value?: string) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString();
}

type NotificationFilter = 'all' | 'messages' | 'handshakes' | 'comments' | 'other';

export default function NotificationsPage() {
    const navigate = useNavigate();
    const { markActed, acknowledgeAll } = useNotifications();
    const { user } = useAuth();
    const [filter, setFilter] = useState<NotificationFilter>('all');

    const {
        data,
        error,
        isLoading,
        isFetchingNextPage,
        fetchNextPage,
        hasNextPage,
        refetch
    } = useInfiniteQuery({
        queryKey: historyQueryKey,
        queryFn: async ({ pageParam }) =>
            apiGet<NotificationsHistoryResponse>('/notifications/history', {
                params: {
                    limit: PAGE_SIZE,
                    cursor: pageParam
                }
            }),
        initialPageParam: undefined as number | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        staleTime: 60_000
    });

    const pages = data?.pages ?? [];
    const allItems = useMemo(
        () => pages.flatMap((page) => page.items),
        [pages]
    );

    const items = useMemo(() => {
        if (filter === 'all') return allItems;

        return allItems.filter((item) => {
            if (filter === 'messages') {
                return item.type === NotificationType.DIRECT_MESSAGE;
            }
            if (filter === 'handshakes') {
                return (
                    item.type === NotificationType.HANDSHAKE_CREATED ||
                    item.type === NotificationType.HANDSHAKE_ACCEPTED ||
                    item.type === NotificationType.HANDSHAKE_COMPLETED ||
                    item.type === NotificationType.HANDSHAKE_CANCELLED
                );
            }
            if (filter === 'comments') {
                return item.type === NotificationType.POST_REPLY;
            }
            if (filter === 'other') {
                return (
                    item.type !== NotificationType.DIRECT_MESSAGE &&
                    item.type !== NotificationType.POST_REPLY &&
                    item.type !== NotificationType.HANDSHAKE_CREATED &&
                    item.type !== NotificationType.HANDSHAKE_ACCEPTED &&
                    item.type !== NotificationType.HANDSHAKE_COMPLETED &&
                    item.type !== NotificationType.HANDSHAKE_CANCELLED
                );
            }
            return true;
        });
    }, [allItems, filter]);

    const handleOpen = useCallback(
        (notification: NotificationRecord) => {
            if (notification.type === NotificationType.DIRECT_MESSAGE) {
                navigate(
                    `/dms/${notification.message?.author?.id ?? ''}`
                );
            }
            else if (notification.type === NotificationType.POST_REPLY) {
                navigate(`/post/${notification.postID}`);
            }
            else if (notification.type === NotificationType.POST_AUTO_CLOSE) {
                navigate(`/post/${notification.postID}`);
            }
            else if (notification.type === NotificationType.PAST_GIFT) {
                navigate(`/post/${notification.postID}`);
            }
            else if (
                notification.type === NotificationType.BUG_REPORT ||
                notification.type === NotificationType.SITE_FEEDBACK
            ) {
                navigate(routes.admin);
            }
            else if (
                notification.type === NotificationType.HANDSHAKE_CREATED ||
                notification.type === NotificationType.HANDSHAKE_ACCEPTED ||
                notification.type === NotificationType.HANDSHAKE_COMPLETED ||
                notification.type === NotificationType.HANDSHAKE_CANCELLED
            ) {
                navigate(`/post/${notification.postID}`);
            }

            if (!notification.isActedOn) {
                markActed(notification.id).catch((err) => {
                    console.error(
                        'Failed to mark notification acted from history view',
                        err
                    );
                    refetch();
                });
            }
            else if (!notification.isRead) {
                refetch();
            }
        },
        [markActed, navigate, refetch]
    );

    const errorMessage = error
        ? error instanceof Error
            ? error.message
            : 'Something went wrong while loading notifications.'
        : '';

    const renderNotificationContent = (notification: NotificationRecord) => {
        const createdAt = formatCreatedAt(notification.createdAt);

        // Direct Message
        if (notification.type === NotificationType.DIRECT_MESSAGE) {
            const author = notification.message?.author;
            return (
                <div className='flex items-start gap-3'>
                    {author && (
                        <div onClick={(e) => e.stopPropagation()}>
                            <UserCard user={author} disableTooltip={true} />
                        </div>
                    )}
                    <div className='flex-1 min-w-0'>
                        <p className='text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
                            Sent you a message
                        </p>
                        {notification.message?.content && (
                            <p className='text-sm text-zinc-700 dark:text-zinc-300 line-clamp-2 mt-1'>
                                &quot;{notification.message.content}&quot;
                            </p>
                        )}
                        {createdAt && (
                            <time className='text-xs text-zinc-500 dark:text-zinc-400 mt-1 block'>
                                {createdAt}
                            </time>
                        )}
                    </div>
                </div>
            );
        }

        // Comment/Post Reply
        if (notification.type === NotificationType.POST_REPLY) {
            const author = notification.message?.author;
            return (
                <div className='flex items-start gap-3'>
                    {author && (
                        <div onClick={(e) => e.stopPropagation()}>
                            <UserCard user={author} disableTooltip={true} />
                        </div>
                    )}
                    <div className='flex-1 min-w-0'>
                        <p className='text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
                            Reply to your post
                        </p>
                        {notification.message?.content && (
                            <p className='text-sm text-zinc-700 dark:text-zinc-300 line-clamp-2 mt-1'>
                                &quot;{notification.message.content}&quot;
                            </p>
                        )}
                        {createdAt && (
                            <time className='text-xs text-zinc-500 dark:text-zinc-400 mt-1 block'>
                                {createdAt}
                            </time>
                        )}
                    </div>
                </div>
            );
        }

        // Handshake notifications
        if (
            notification.type === NotificationType.HANDSHAKE_CREATED ||
            notification.type === NotificationType.HANDSHAKE_ACCEPTED ||
            notification.type === NotificationType.HANDSHAKE_COMPLETED ||
            notification.type === NotificationType.HANDSHAKE_CANCELLED
        ) {
            const handshakeID = 'handshakeID' in notification ? notification.handshakeID : undefined;
            if (handshakeID) {
                return <HandshakeNotificationCard handshakeID={handshakeID} userID={user?.id} notificationType={notification.type} />;
            }

            // Fallback if no handshakeID
            const meta = describeNotification(notification);
            return (
                <div className='flex items-start gap-3'>
                    <div className='flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center'>
                        <Handshake className='w-5 h-5 text-blue-600 dark:text-blue-400' />
                    </div>
                    <div className='flex-1 min-w-0'>
                        <p className='text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
                            {meta.title}
                        </p>
                        {meta.description && (
                            <p className='text-sm text-zinc-700 dark:text-zinc-300 mt-1'>
                                {meta.description}
                            </p>
                        )}
                        {createdAt && (
                            <time className='text-xs text-zinc-500 dark:text-zinc-400 mt-1 block'>
                                {createdAt}
                            </time>
                        )}
                    </div>
                </div>
            );
        }

        // Default/Other notifications
        const meta = describeNotification(notification);
        return (
            <div className='flex flex-col gap-2'>
                <div className='flex items-start justify-between gap-3'>
                    <div className='flex-1 min-w-0'>
                        <p className='text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
                            {meta.title}
                        </p>
                        {meta.description && (
                            <p className='text-sm text-zinc-700 dark:text-zinc-300 line-clamp-2 mt-1'>
                                {meta.description}
                            </p>
                        )}
                    </div>
                    {createdAt && (
                        <time className='flex-shrink-0 text-xs text-zinc-500 dark:text-zinc-400'>
                            {createdAt}
                        </time>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className='mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8'>
            {/* Filter buttons */}
            <div className="w-full mb-2">
                <div className="flex w-full border-b border-zinc-200 dark:border-zinc-700">
                    {[
                        { key: 'all', label: 'All', Icon: Filter },
                        { key: 'messages', label: 'Messages', Icon: MessageSquare },
                        { key: 'handshakes', label: 'Handshakes', Icon: Handshake },
                        { key: 'comments', label: 'Comments', Icon: MessageCircle },
                        { key: 'other', label: 'Other', Icon: MoreHorizontal},
                    ].map(({ key, label, Icon }) => {
                        const isActive = filter === key

                        return (
                            <button
                                key={key}
                                onClick={() => setFilter(key as NotificationFilter)}
                                className={`
                        group
                        flex flex-1
                        flex-col sm:flex-row
                        items-center justify-center
                        gap-1 sm:gap-2
                        py-2 sm:py-2.5
                        text-xs sm:text-sm
                        font-medium
                        transition-colors
                        border-b-2
                        -mb-px

                        ${isActive
                                ? 'border-brand-600 text-brand-600 dark:border-brand-300 dark:text-brand-300'
                                : 'border-transparent text-zinc-500 hover:text-brand-600 dark:text-zinc-400 dark:hover:text-brand-300'}
                    `}
                            >
                                {Icon && (
                                    <Icon
                                        className={`
                                w-5 h-5 sm:w-4 sm:h-4
                                transition-opacity
                                ${isActive ? 'opacity-100' : 'opacity-70'}
                            `}
                                    />
                                )}

                                {/* Label */}
                                <span
                                    className="
                            leading-none
                            sm:inline
                            hidden xs:inline
                        "
                                >
                                    {label}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>


            
            <button
                onClick={acknowledgeAll}
                className="
                    w-full mb-3
                    text-xs font-medium
                    text-zinc-500 dark:text-zinc-400
                    hover:text-zinc-700 dark:hover:text-zinc-200
                    hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50
                    py-2 rounded-md
                    transition
                "
            >
                Mark all as read
            </button>



            {isLoading ? (
                <div className='mt-8'>
                    <Spinner text='Loading notifications...' />
                </div>
            ) : error ? (
                <div className='mt-6 space-y-4'>
                    <Alert
                        type='danger'
                        title='Unable to load notifications'
                        message={errorMessage}
                    />
                    <div>
                        <button
                            type='button'
                            onClick={() => refetch()}
                            className='rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-500 dark:bg-brand-400 dark:hover:bg-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-600 dark:focus:ring-brand-300 focus:ring-offset-2 dark:focus:ring-offset-zinc-900'
                        >
                            Try again
                        </button>
                    </div>
                </div>
            ) : items.length === 0 ? (
                <div className='mt-6'>
                    <Alert
                        type='info'
                        title='You are all caught up'
                        message='There are no notifications to show yet.'
                    />
                </div>
            ) : (
                <>
                    <ul className='mt-6 space-y-3 mb-8'>
                        {items.map((notification) => {
                            const highlight = !notification.isRead
                                ? 'border-l-4 border-l-brand-600 dark:border-l-brand-400 bg-brand-50/80 dark:bg-brand-900/30 shadow-md'
                                : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900';

                            const isHandshake =
                                notification.type === NotificationType.HANDSHAKE_CREATED ||
                                notification.type === NotificationType.HANDSHAKE_ACCEPTED ||
                                notification.type === NotificationType.HANDSHAKE_COMPLETED ||
                                notification.type === NotificationType.HANDSHAKE_CANCELLED;

                            return (
                                <li key={notification.id}>
                                    {isHandshake ? (
                                        <div className={`w-full rounded-lg border px-4 py-4 transition hover:shadow-lg ${highlight}`}>
                                            {renderNotificationContent(notification)}
                                            {!notification.isRead && (
                                                <div className='mt-3'>
                                                    <span className='inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold bg-brand-600 text-white dark:bg-brand-500'>
                                                        NEW
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <button
                                            type='button'
                                            onClick={() => handleOpen(notification)}
                                            className={`w-full rounded-lg border px-4 py-4 text-left transition hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-600 dark:focus:ring-brand-300 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 ${highlight}`}
                                        >
                                            {renderNotificationContent(notification)}
                                            {!notification.isRead && (
                                                <div className='mt-3'>
                                                    <span className='inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold bg-brand-600 text-white dark:bg-brand-500'>
                                                        NEW
                                                    </span>
                                                </div>
                                            )}
                                        </button>
                                    )}
                                </li>
                            );
                        })}
                    </ul>

                    <div className='mt-6 flex items-center justify-center'>
                        {hasNextPage ? (
                            <button
                                type='button'
                                onClick={() => fetchNextPage()}
                                disabled={isFetchingNextPage}
                                className='inline-flex items-center rounded-md border border-transparent bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-600 dark:focus:ring-brand-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600 dark:focus:ring-offset-zinc-900'
                            >
                                {isFetchingNextPage
                                    ? 'Loading…'
                                    : 'Load more'}
                            </button>
                        ) : (
                            <span className='text-sm text-zinc-500 dark:text-zinc-400'>
                                You have reached the end of your
                                notifications.
                            </span>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
