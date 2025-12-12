import React, { useCallback, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

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

const PAGE_SIZE = 20;
const historyQueryKey = ['notifications', 'history', PAGE_SIZE] as const;

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

export default function NotificationsPage() {
    const navigate = useNavigate();
    const { markActed } = useNotifications();

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
    const items = useMemo(
        () => pages.flatMap((page) => page.items),
        [pages]
    );

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

    return (
        <div className='mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8'>
            <h1 className='text-2xl font-semibold text-zinc-900 dark:text-zinc-100'>
                Notifications
            </h1>
            <p className='mt-1 text-sm text-zinc-600 dark:text-zinc-400'>
                Review every notification, including those you have already
                acknowledged.
            </p>

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
                    <ul className='mt-6 space-y-3'>
                        {items.map((notification) => {
                            const meta = describeNotification(notification);
                            const createdAt = formatCreatedAt(
                                notification.createdAt
                            );
                            const highlight = notification.isRead
                                ? 'border-zinc-200/70 bg-white dark:border-zinc-700/60 dark:bg-zinc-900/60'
                                : 'border-brand-300/70 bg-brand-50/70 dark:border-brand-900/50 dark:bg-brand-900/40';

                            return (
                                <li key={notification.id}>
                                    <button
                                        type='button'
                                        onClick={() => handleOpen(notification)}
                                        className={`w-full rounded-lg border px-4 py-4 text-left transition hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-600 dark:focus:ring-brand-300 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 ${highlight}`}
                                    >
                                        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                                            <div className='flex-1 min-w-0'>
                                                <div className='text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
                                                    {meta.title}
                                                </div>
                                                {meta.description && (
                                                    <div className='mt-1 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2'>
                                                        {meta.description}
                                                    </div>
                                                )}
                                            </div>
                                            {createdAt && (
                                                <time className='flex-shrink-0 text-xs font-medium text-zinc-500 dark:text-zinc-400 sm:ml-4'>
                                                    {createdAt}
                                                </time>
                                            )}
                                        </div>
                                        <div className='mt-3 flex flex-wrap gap-2'>
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                    notification.isRead
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                        : 'bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300'
                                                }`}
                                            >
                                                {notification.isRead
                                                    ? 'Read'
                                                    : 'Unread'}
                                            </span>
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                    notification.isActedOn
                                                        ? 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700/70 dark:text-zinc-100'
                                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                                }`}
                                            >
                                                {notification.isActedOn
                                                    ? 'Completed'
                                                    : 'Pending'}
                                            </span>
                                        </div>
                                    </button>
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
