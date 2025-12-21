import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Filter, Handshake, MessageCircle, MoreHorizontal, Check, ChevronDown, ChevronUp } from 'lucide-react';

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
import HandshakeCard from '@/components/handshakes/HandshakeCard';
import type { HandshakeDTO } from '@/shared/api/types';
import { useCachedHandshake, useCachedPost } from '@/contexts/DataCacheContext';

const PAGE_SIZE = 20;
const historyQueryKey = ['notifications', 'history', PAGE_SIZE] as const;

function HandshakeNotificationByPost({
    postID,
    userID,
    notificationType,
    onInteraction
}: {
    postID: number;
    userID: number;
    notificationType: string;
    onInteraction?: () => void;
}) {
    const { post, loading, error } = useCachedPost(postID);

    console.log('[HandshakeNotificationByPost] Using cached post:', { postID, userID, notificationType, post, loading, error });

    if (loading) {
        return (
            <div className='flex items-center justify-center py-8'>
                <Spinner text='Loading handshake...' />
            </div>
        );
    }

    if (error) {
        console.error('[HandshakeNotificationByPost] Error loading post:', error);
        return (
            <div className='text-center py-4'>
                <p className='text-sm text-red-600 dark:text-red-400'>
                    Failed to load handshake details: {error}
                </p>
            </div>
        );
    }

    if (!post) {
        console.error('[HandshakeNotificationByPost] Post not found:', { postID });
        return (
            <div className='text-center py-4'>
                <p className='text-sm text-red-600 dark:text-red-400'>
                    Post not found (ID: {postID})
                </p>
            </div>
        );
    }

    // Find the relevant handshake for this user
    const handshakes = post.handshakes || [];
    const relevantHandshake = handshakes.find((h: any) =>
        h.senderID === userID || h.receiverID === userID
    );

    console.log('[HandshakeNotificationByPost] Looking for handshake:', {
        userID,
        handshakesCount: handshakes.length,
        relevantHandshake
    });

    if (!relevantHandshake) {
        console.error('[HandshakeNotificationByPost] No handshake found for user:', { userID, handshakes });
        return (
            <div className='text-center py-4'>
                <p className='text-sm text-red-600 dark:text-red-400'>
                    Handshake not found
                </p>
            </div>
        );
    }

    console.log('[HandshakeNotificationByPost] Rendering HandshakeCard with:', relevantHandshake);

    return (
        <div>
            <HandshakeCard
                handshake={{ ...relevantHandshake, post }}
                userID={userID}
                showPostDetails={true}
                hideCardBorder={true}
                onInteraction={onInteraction}
            />
        </div>
    );
}

function HandshakePostReference({ postID }: { postID: number }) {
    const { post, loading } = useCachedPost(postID);

    if (loading || !post) {
        return null;
    }

    const postType = post.type === 'request' ? 'request' : 'gift';

    return (
        <p className='text-xs text-zinc-600 dark:text-zinc-400 mt-1 italic'>
            On your {postType}: &quot;{post.title}&quot;
        </p>
    );
}

function NotificationContentWrapper({
    notification,
    shouldShowHandshakeCard,
    renderContent
}: {
    notification: NotificationRecord;
    shouldShowHandshakeCard: boolean;
    renderContent: (notification: NotificationRecord, shouldShowHandshakeCard: boolean, handshake?: any) => React.ReactNode;
}) {
    const handshakeID = 'handshakeID' in notification ? notification.handshakeID : undefined;
    const { handshake } = useCachedHandshake(handshakeID || 0);

    // For handshake notifications, wait for handshake data if we have an ID
    const isHandshakeNotification =
        notification.type === NotificationType.HANDSHAKE_CREATED ||
        notification.type === NotificationType.HANDSHAKE_ACCEPTED ||
        notification.type === NotificationType.HANDSHAKE_COMPLETED ||
        notification.type === NotificationType.HANDSHAKE_CANCELLED;

    return <>{renderContent(notification, shouldShowHandshakeCard, isHandshakeNotification ? handshake : undefined)}</>;
}

function PreviousNotificationItem({
    notification,
    isDifferentHandshake,
    userID
}: {
    notification: NotificationRecord;
    isDifferentHandshake: boolean;
    userID?: number;
}) {
    const handshakeID = 'handshakeID' in notification ? notification.handshakeID : undefined;
    const { handshake } = useCachedHandshake(handshakeID || 0);

    const prevMeta = describeNotification(notification, false, userID, handshake);
    const prevCreatedAt = formatCreatedAt(notification.createdAt);

    return (
        <div className='text-xs'>
            <p className='font-semibold text-zinc-700 dark:text-zinc-300'>
                {prevMeta.title}
                {isDifferentHandshake && (
                    <span className='ml-2 text-zinc-500 dark:text-zinc-400 font-normal'>
                        (different handshake)
                    </span>
                )}
            </p>
            {prevCreatedAt && (
                <time className='text-zinc-500 dark:text-zinc-400'>
                    {prevCreatedAt}
                </time>
            )}
        </div>
    );
}

function HandshakeNotificationCard({
    handshakeID,
    userID,
    notificationType,
    onInteraction
}: {
    handshakeID: number;
    userID?: number;
    notificationType: string;
    onInteraction?: () => void;
}) {
    const { handshake, loading, error } = useCachedHandshake(handshakeID);

    if (loading) {
        return (
            <div className='flex items-center justify-center py-8'>
                <Spinner text='Loading handshake...' />
            </div>
        );
    }

    if (error) {
        console.error('[HandshakeNotificationCard] Error loading handshake:', error);
        return (
            <div className='text-center py-4'>
                <p className='text-sm text-red-600 dark:text-red-400'>
                    Failed to load handshake details: {error}
                </p>
            </div>
        );
    }

    if (!handshake) {
        console.error('[HandshakeNotificationCard] Handshake not found:', { handshakeID });
        return (
            <div className='text-center py-4'>
                <p className='text-sm text-red-600 dark:text-red-400'>
                    Handshake not found (ID: {handshakeID})
                </p>
            </div>
        );
    }

    return (
        <div>
            <HandshakeCard
                handshake={handshake}
                userID={userID}
                showPostDetails={true}
                hideCardBorder={true}
                onInteraction={onInteraction}
            />
        </div>
    );
}

function describeNotification(notification: NotificationRecord, showingHandshakeCard = true, userID?: number, handshake?: any) {
    switch (notification.type) {
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
            description: showingHandshakeCard
                ? 'Someone wants to handshake on your post. Click to view details.'
                : 'Someone wants to handshake on your post.'
        };
    case NotificationType.HANDSHAKE_ACCEPTED: {
        // Determine who accepted based on post ownership
        // If the current user is the sender of the handshake (requester), then the other user accepted
        // If the current user is the receiver (post owner), then they accepted
        let title = 'Handshake accepted';
        let description = showingHandshakeCard
            ? 'The handshake was accepted! You can now coordinate the exchange.'
            : 'The handshake was accepted!';

        if (userID && handshake) {
            if (handshake.senderID === userID) {
                // Current user sent the request, so the other person accepted
                title = 'The other user accepted your handshake';
                description = showingHandshakeCard
                    ? 'Your handshake request was accepted! You can now coordinate the exchange.'
                    : 'Your handshake request was accepted!';
            }
            else if (handshake.receiverID === userID || handshake.recipientID === userID) {
                // Current user is the post owner/receiver, so they accepted
                title = 'You accepted this handshake';
                description = showingHandshakeCard
                    ? 'You accepted the handshake request. You can now coordinate the exchange.'
                    : 'You accepted the handshake request.';
            }
        }

        return { title, description };
    }
    case NotificationType.HANDSHAKE_COMPLETED: {
        let title = 'Handshake completed';
        const description = showingHandshakeCard
            ? 'The transaction has been completed successfully.'
            : 'The transaction has been completed successfully.';

        if (userID && handshake) {
            if (handshake.senderID === userID) {
                title = 'You completed this handshake';
            }
            else if (handshake.receiverID === userID || handshake.recipientID === userID) {
                title = 'The other user completed this handshake';
            }
        }

        return { title, description };
    }
    case NotificationType.HANDSHAKE_CANCELLED: {
        const noShow = 'noShowReported' in notification ? notification.noShowReported : false;
        let title = 'Handshake cancelled';
        let description = noShow
            ? 'The handshake was cancelled due to a no-show.'
            : 'The handshake was cancelled.';

        if (userID && handshake && !noShow) {
            const cancelledByUserID = handshake.cancelledByUserID;
            if (cancelledByUserID === userID) {
                title = 'You cancelled this handshake';
                description = 'You cancelled the handshake.';
            }
            else if (cancelledByUserID) {
                title = 'The other user cancelled this handshake';
                description = 'The other user cancelled the handshake.';
            }
        }

        return { title, description };
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

type NotificationFilter = 'all' | 'handshakes' | 'comments' | 'other';

type GroupedNotification = {
    latest: NotificationRecord;
    previous: NotificationRecord[];
    postID: number;
    handshakeIDs: number[];
};

type NotificationItem = NotificationRecord | GroupedNotification;

function isGroupedNotification(item: NotificationItem): item is GroupedNotification {
    return 'latest' in item && 'previous' in item && 'handshakeIDs' in item;
}

export default function NotificationsPage() {
    const navigate = useNavigate();
    const { markActed, acknowledgeAll, hasNewNotifications, clearNewNotifications } = useNotifications();
    const { user } = useAuth();
    const [filter, setFilter] = useState<NotificationFilter>('all');
    const markedAsReadRef = useRef<Set<number>>(new Set());
    const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());

    // Clear the "new notifications" flag when component unmounts
    useEffect(() => {
        return () => {
            clearNewNotifications();
        };
    }, [clearNewNotifications]);

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
        // Filter out direct messages - they should only appear in the messages section
        const itemsWithoutDMs = allItems.filter((item) => item.type !== NotificationType.DIRECT_MESSAGE);

        const filtered = filter === 'all' ? itemsWithoutDMs : itemsWithoutDMs.filter((item) => {
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
                    item.type !== NotificationType.POST_REPLY &&
                    item.type !== NotificationType.HANDSHAKE_CREATED &&
                    item.type !== NotificationType.HANDSHAKE_ACCEPTED &&
                    item.type !== NotificationType.HANDSHAKE_COMPLETED &&
                    item.type !== NotificationType.HANDSHAKE_CANCELLED
                );
            }
            return true;
        });

        // Group handshake notifications by postID
        const handshakeGroups = new Map<number, NotificationRecord[]>();
        const nonHandshakeItems: NotificationRecord[] = [];

        filtered.forEach((item) => {
            const isHandshake =
                item.type === NotificationType.HANDSHAKE_CREATED ||
                item.type === NotificationType.HANDSHAKE_ACCEPTED ||
                item.type === NotificationType.HANDSHAKE_COMPLETED ||
                item.type === NotificationType.HANDSHAKE_CANCELLED;

            if (isHandshake && 'postID' in item && item.postID) {
                const postID = item.postID;
                if (!handshakeGroups.has(postID)) {
                    handshakeGroups.set(postID, []);
                }
                const group = handshakeGroups.get(postID);
                if (group) {
                    group.push(item);
                }
            }
            else {
                nonHandshakeItems.push(item);
            }
        });

        // Create grouped notifications
        const result: NotificationItem[] = [];

        // Add grouped handshake notifications
        handshakeGroups.forEach((notifications, postID) => {
            if (notifications.length === 1) {
                // Single notification, don't group
                result.push(notifications[0]);
            }
            else {
                // Multiple notifications, create a group
                // Sort by createdAt descending (most recent first)
                const sorted = [...notifications].sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return dateB - dateA;
                });

                // Collect all unique handshake IDs
                const handshakeIDs = Array.from(
                    new Set(
                        sorted
                            .filter((n): n is NotificationRecord & { handshakeID: number } => 'handshakeID' in n && typeof n.handshakeID === 'number')
                            .map(n => n.handshakeID)
                    )
                );

                result.push({
                    latest: sorted[0],
                    previous: sorted.slice(1),
                    postID,
                    handshakeIDs
                });
            }
        });

        // Add non-handshake notifications
        result.push(...nonHandshakeItems);

        // Sort all items by the most recent timestamp
        return result.sort((a, b) => {
            const getLatestDate = (item: NotificationItem) => {
                if (isGroupedNotification(item)) {
                    return item.latest.createdAt ? new Date(item.latest.createdAt).getTime() : 0;
                }
                return item.createdAt ? new Date(item.createdAt).getTime() : 0;
            };
            return getLatestDate(b) - getLatestDate(a);
        });
    }, [allItems, filter]);

    // Auto-mark completed/cancelled handshake notifications as read when visible
    useEffect(() => {
        const notificationsToMark: NotificationRecord[] = [];

        items.forEach((item) => {
            if (isGroupedNotification(item)) {
                // For grouped notifications, check all notifications in the group
                const allNotifs = [item.latest, ...item.previous];
                allNotifs.forEach((notif) => {
                    if (!notif.isActedOn &&
                        (notif.type === NotificationType.HANDSHAKE_COMPLETED ||
                         notif.type === NotificationType.HANDSHAKE_CANCELLED)) {
                        notificationsToMark.push(notif);
                    }
                });
            }
            else {
                // For single notifications
                if (!item.isActedOn &&
                    (item.type === NotificationType.HANDSHAKE_COMPLETED ||
                     item.type === NotificationType.HANDSHAKE_CANCELLED)) {
                    notificationsToMark.push(item);
                }
            }
        });

        if (notificationsToMark.length > 0) {
            const markAllAsync = async () => {
                const toMark = notificationsToMark.filter(
                    (notification) => !markedAsReadRef.current.has(notification.id)
                );

                if (toMark.length === 0) return;

                // Add all to the ref to prevent duplicate attempts
                toMark.forEach((notification) => markedAsReadRef.current.add(notification.id));

                try {
                    await Promise.all(toMark.map((notification) => markActed(notification.id)));
                    // Refetch to update the UI
                    refetch();
                }
                catch (err) {
                    console.error('Failed to auto-mark handshake notifications as read:', err);
                    // Remove from ref on failure so they can be retried
                    toMark.forEach((notification) => markedAsReadRef.current.delete(notification.id));
                }
            };

            markAllAsync();
        }
    }, [items, markActed, refetch]);

    const handleOpen = useCallback(
        (item: NotificationItem) => {
            const notification = isGroupedNotification(item) ? item.latest : item;

            if (notification.type === NotificationType.POST_REPLY) {
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

            // Mark all notifications in group as acted
            const notificationsToMark = isGroupedNotification(item)
                ? [item.latest, ...item.previous]
                : [notification];

            const unactedNotifications = notificationsToMark.filter(n => !n.isActedOn);

            if (unactedNotifications.length > 0) {
                Promise.all(unactedNotifications.map(n => markActed(n.id)))
                    .catch((err) => {
                        console.error(
                            'Failed to mark notification(s) acted from history view',
                            err
                        );
                    })
                    .finally(() => {
                        refetch();
                    });
            }
            else if (notificationsToMark.some(n => !n.isRead)) {
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

    const renderNotificationContent = (notification: NotificationRecord, shouldShowHandshakeCard: boolean, handshake?: any) => {
        const createdAt = formatCreatedAt(notification.createdAt);

        // Comment/Post Reply
        if (notification.type === NotificationType.POST_REPLY) {
            const author = notification.message?.author;
            const displayName = author?.displayName || author?.username || 'Someone';
            return (
                <div className='flex items-start gap-3'>
                    {author && (
                        <div onClick={(e) => e.stopPropagation()} className='flex-shrink-0'>
                            <UserCard user={author} triggerVariant='avatar-name' />
                        </div>
                    )}
                    <div className='flex-1 min-w-0'>
                        <p className='text-sm text-zinc-600 dark:text-zinc-400 mb-1'>
                            replied to your post
                        </p>
                        {notification.message?.content && (
                            <p className='text-sm text-zinc-900 dark:text-zinc-100 line-clamp-2 break-all bg-zinc-100 dark:bg-zinc-800 rounded-lg px-3 py-2'>
                                {notification.message.content}
                            </p>
                        )}
                        {createdAt && (
                            <time className='text-xs text-zinc-500 dark:text-zinc-400 mt-2 block'>
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
            const postID = 'postID' in notification ? notification.postID : undefined;
            const meta = describeNotification(notification, shouldShowHandshakeCard, user?.id, handshake);

            console.log('[renderNotificationContent] Handshake notification:', {
                type: notification.type,
                handshakeID,
                postID,
                userID: user?.id,
                notification
            });

            const handleHandshakeInteraction = () => {
                if (!notification.isActedOn) {
                    markActed(notification.id).catch((err) => {
                        console.error('Failed to mark handshake notification as acted:', err);
                    });
                }
            };

            const handshakeContent = shouldShowHandshakeCard ? (
                handshakeID ? (
                    <HandshakeNotificationCard
                        handshakeID={handshakeID}
                        userID={user?.id}
                        notificationType={notification.type}
                        onInteraction={handleHandshakeInteraction}
                    />
                ) : postID && user?.id ? (
                    <HandshakeNotificationByPost
                        postID={postID}
                        userID={user.id}
                        notificationType={notification.type}
                        onInteraction={handleHandshakeInteraction}
                    />
                ) : (
                    <div className='text-center py-4'>
                        <p className='text-sm text-red-600 dark:text-red-400'>
                            Missing handshake data. Notification: {JSON.stringify({
                                id: notification.id,
                                type: notification.type,
                                handshakeID: 'handshakeID' in notification ? notification.handshakeID : 'N/A',
                                postID: 'postID' in notification ? notification.postID : 'N/A'
                            })}
                        </p>
                    </div>
                )
            ) : null;

            return (
                <div className='flex flex-col gap-3'>
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
                            {!shouldShowHandshakeCard && postID && (
                                <HandshakePostReference postID={postID} />
                            )}
                        </div>
                        {createdAt && (
                            <time className='flex-shrink-0 text-xs text-zinc-500 dark:text-zinc-400'>
                                {createdAt}
                            </time>
                        )}
                    </div>
                    {handshakeContent && (
                        <div>
                            {handshakeContent}
                        </div>
                    )}
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
            {/* New notifications banner */}
            {hasNewNotifications && (
                <div className="mb-4">
                    <button
                        onClick={() => {
                            clearNewNotifications();
                        }}
                        className="
                            w-full
                            px-4 py-3
                            bg-brand-600 dark:bg-brand-500
                            hover:bg-brand-700 dark:hover:bg-brand-600
                            text-white
                            font-medium
                            rounded-lg
                            shadow-lg
                            transition-all
                            hover:shadow-xl
                            flex items-center justify-center gap-2
                        "
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        You have new notifications, click to show them
                    </button>
                </div>
            )}

            {/* Filter buttons */}
            <div className="w-full mb-2">
                <div className="flex w-full border-b border-zinc-200 dark:border-zinc-700">
                    {[
                        { key: 'all', label: 'All', Icon: Filter },
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
                onClick={async () => {
                    try {
                        // Mark ALL notifications as read on the server
                        // This will automatically invalidate the query and refetch
                        await acknowledgeAll();
                    }
                    catch (err) {
                        console.error('Failed to mark all notifications as read:', err);
                    }
                }}
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
                        {items.map((item) => {
                            const isGrouped = isGroupedNotification(item);
                            const notification = isGrouped ? item.latest : item;
                            const allNotifications = isGrouped ? [item.latest, ...item.previous] : [item];
                            const hasUnread = allNotifications.some(n => !n.isActedOn);
                            const itemKey = isGrouped ? `group-${item.postID}` : `notif-${notification.id}`;
                            const isExpanded = isGrouped && expandedGroups.has(item.postID);

                            const highlight = hasUnread
                                ? 'border-l-4 border-l-brand-600 dark:border-l-brand-400 bg-brand-50/80 dark:bg-brand-900/30 shadow-md'
                                : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900';

                            // For grouped notifications, always show the handshake card
                            // For single notifications, always show the card too (since we're grouping now)
                            const shouldShowHandshakeCard = true;

                            const handleMarkAsRead = async (e: React.MouseEvent) => {
                                e.stopPropagation();

                                const notificationsToMark = allNotifications.filter(n => !n.isActedOn);

                                if (notificationsToMark.length > 0) {
                                    try {
                                        await Promise.all(notificationsToMark.map(n => markActed(n.id)));
                                        refetch();
                                    }
                                    catch (err) {
                                        console.error('Failed to mark notification(s) as read:', err);
                                    }
                                }
                            };

                            const toggleExpanded = (e: React.MouseEvent) => {
                                e.stopPropagation();
                                if (isGrouped) {
                                    setExpandedGroups(prev => {
                                        const next = new Set(prev);
                                        if (next.has(item.postID)) {
                                            next.delete(item.postID);
                                        }
                                        else {
                                            next.add(item.postID);
                                        }
                                        return next;
                                    });
                                }
                            };

                            return (
                                <li key={itemKey} className='relative'>
                                    <button
                                        type='button'
                                        onClick={() => handleOpen(item)}
                                        className={`w-full rounded-lg border px-4 py-4 text-left transition hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-600 dark:focus:ring-brand-300 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 ${highlight}`}
                                    >
                                        <NotificationContentWrapper
                                            notification={notification}
                                            shouldShowHandshakeCard={shouldShowHandshakeCard}
                                            renderContent={renderNotificationContent}
                                        />

                                        {/* Show count badge and expand button for grouped notifications */}
                                        {isGrouped && item.previous.length > 0 && (() => {
                                            const multipleHandshakes = item.handshakeIDs.length > 1;

                                            return (
                                                <div className='mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700'>
                                                    <button
                                                        type='button'
                                                        onClick={toggleExpanded}
                                                        className='flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 transition'
                                                    >
                                                        {isExpanded ? <ChevronUp className='w-4 h-4' /> : <ChevronDown className='w-4 h-4' />}
                                                        <span className='font-medium'>
                                                            +{item.previous.length} earlier update{item.previous.length !== 1 ? 's' : ''} on this {multipleHandshakes ? 'post' : 'handshake'}
                                                        </span>
                                                    </button>

                                                    {/* Expanded previous notifications */}
                                                    {isExpanded && (
                                                        <div className='mt-3 space-y-2 pl-6 border-l-2 border-zinc-300 dark:border-zinc-600'>
                                                            {item.previous.map((prevNotif) => {
                                                                const prevHandshakeID = 'handshakeID' in prevNotif ? prevNotif.handshakeID : null;
                                                                const latestHandshakeID = 'handshakeID' in item.latest ? item.latest.handshakeID : null;
                                                                const isDifferentHandshake = multipleHandshakes && prevHandshakeID !== latestHandshakeID;

                                                                return (
                                                                    <PreviousNotificationItem
                                                                        key={prevNotif.id}
                                                                        notification={prevNotif}
                                                                        isDifferentHandshake={isDifferentHandshake}
                                                                        userID={user?.id}
                                                                    />
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}

                                        <div className='mt-3 flex items-center justify-between gap-2'>
                                            {hasUnread && (
                                                <span className='inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold bg-brand-600 text-white dark:bg-brand-500'>
                                                    NEW
                                                </span>
                                            )}
                                            <button
                                                type='button'
                                                onClick={handleMarkAsRead}
                                                className={`ml-auto inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition ${
                                                    !hasUnread
                                                        ? 'text-zinc-400 dark:text-zinc-500 cursor-default'
                                                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                                                }`}
                                                disabled={!hasUnread}
                                            >
                                                <Check className='w-3 h-3' />
                                                {!hasUnread ? 'Read' : isGrouped ? 'Mark all as read' : 'Mark as read'}
                                            </button>
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
