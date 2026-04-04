import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
    useRef,
    memo
} from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
    Filter,
    Handshake,
    MessageCircle,
    MoreHorizontal,
    ChevronDown,
    ChevronUp
} from 'lucide-react';

import Spinner from '@/components/common/Spinner';
import Alert from '@/components/common/Alert';
import { apiGet } from '@/shared/api/apiClient';
import {
    NotificationRecord,
    NotificationType,
    NotificationsHistoryResponse
} from '@/shared/api/types';
import { routes, withQuery } from '@/routes';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useAuth } from '@/contexts/useAuth';
import UserCard from '@/components/users/UserCard';
import { useCachedHandshake, useCachedPost } from '@/contexts/DataCacheContext';
import HandshakeNotifItem from '@/components/notifications/HandshakeNotifItem';

const PAGE_SIZE = 20;
const historyQueryKey = ['notifications', 'history'] as const;

// Simple UserCard wrapper (delays removed to fix staggering loading)
const DelayedUserCard = memo(
    ({ user, triggerVariant }: { user: any; triggerVariant: string }) => {
        return <UserCard user={user} triggerVariant={triggerVariant as any} />;
    }
);

DelayedUserCard.displayName = 'DelayedUserCard';


function PostReplyNotificationContent({
    notification,
    currentUserID,
    createdAt
}: {
    notification: NotificationRecord & { type: typeof NotificationType.POST_REPLY; postID: number };
    currentUserID?: number;
    createdAt: string;
}) {
    const { post } = useCachedPost(notification.postID);
    const author = notification.message?.author;
    const isCurrentUser = author && currentUserID && author.id === currentUserID;
    const hasUsername = author?.username || author?.displayName;

    return (
        <div className='flex items-start gap-3'>
            {isCurrentUser ? (
                <div className='flex-shrink-0'>
                    <span className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                        You
                    </span>
                </div>
            ) : hasUsername ? (
                <div onClick={(e) => e.stopPropagation()} className='flex-shrink-0'>
                    <DelayedUserCard user={author} triggerVariant='avatar-name' />
                </div>
            ) : (
                <div className='flex-shrink-0'>
                    <span className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                        Someone
                    </span>
                </div>
            )}
            <div className='flex-1 min-w-0'>
                <p className='text-sm text-zinc-600 dark:text-zinc-400 mb-1'>
                    replied to{post ? (
                        <>
                            {' '}<span className='font-medium text-zinc-800 dark:text-zinc-200 italic'>&quot;{post.title}&quot;</span>
                            {(post.sender?.displayName || post.sender?.username) && (
                                <span className='text-zinc-500 dark:text-zinc-500'>{' '}by {post.sender.displayName || post.sender.username}</span>
                            )}
                        </>
                    ) : ' your post'}
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

function MessageReplyNotificationContent({
    notification,
    currentUserID,
    createdAt
}: {
    notification: NotificationRecord & { type: typeof NotificationType.MESSAGE_REPLY };
    currentUserID?: number;
    createdAt: string;
}) {
    const author = notification.message?.author;
    const isCurrentUser = author && currentUserID && author.id === currentUserID;
    const hasUsername = author?.username || author?.displayName;

    return (
        <div className='flex items-start gap-3'>
            {isCurrentUser ? (
                <div className='flex-shrink-0'>
                    <span className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                        You
                    </span>
                </div>
            ) : hasUsername ? (
                <div onClick={(e) => e.stopPropagation()} className='flex-shrink-0'>
                    <DelayedUserCard user={author} triggerVariant='avatar-name' />
                </div>
            ) : (
                <div className='flex-shrink-0'>
                    <span className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                        Someone
                    </span>
                </div>
            )}
            <div className='flex-1 min-w-0'>
                <p className='text-sm text-zinc-600 dark:text-zinc-400 mb-1'>
                    replied to your message
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

function NotificationContentWrapper({
    notification,
    shouldShowHandshakeCard,
    renderContent
}: {
    notification: NotificationRecord;
    shouldShowHandshakeCard: boolean;
    renderContent: (
        notification: NotificationRecord,
        shouldShowHandshakeCard: boolean,
        handshake?: any
    ) => React.ReactNode;
}) {
    const handshakeID =
        'handshakeID' in notification ? notification.handshakeID : undefined;
    const { handshake, loading } = useCachedHandshake(handshakeID || 0);

    // For handshake notifications, wait for handshake data if we have an ID
    const isHandshakeNotification =
        notification.type === NotificationType.HANDSHAKE_CREATED ||
        notification.type === NotificationType.HANDSHAKE_ACCEPTED ||
        notification.type === NotificationType.HANDSHAKE_UNDO_ACCEPTED ||
        notification.type === NotificationType.HANDSHAKE_COMPLETED ||
        notification.type === NotificationType.HANDSHAKE_CANCELLED ||
        notification.type === NotificationType.POST_CLOSED_BY_OTHER_HANDSHAKE ||
        notification.type === NotificationType.POST_REOPENED;

    // If it's a handshake notification and we have a handshake ID but it's still loading,
    // show a brief loading state to prevent "Someone" from flashing
    if (isHandshakeNotification && handshakeID && loading && !handshake) {
        return (
            <div className='flex items-center gap-2 py-2'>
                <div className='h-4 w-4 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin' />
                <span className='text-sm text-zinc-500 dark:text-zinc-400'>
                    Loading...
                </span>
            </div>
        );
    }

    return (
        <>
            {renderContent(
                notification,
                shouldShowHandshakeCard,
                isHandshakeNotification ? handshake : undefined
            )}
        </>
    );
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
    const handshakeID =
        'handshakeID' in notification ? notification.handshakeID : undefined;
    const { handshake } = useCachedHandshake(handshakeID || 0);

    const prevMeta = describeNotification(
        notification,
        false,
        userID,
        handshake
    );
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

// Helper to get display name - "you" if current user, otherwise username
const getNotificationDisplayName = (
    user: any,
    currentUserID?: number,
    capitalize = false
) => {
    if (!user?.username) return capitalize ? 'Someone' : 'someone';
    if (currentUserID && user.id === currentUserID)
        return capitalize ? 'You' : 'you';
    return user.username;
};

// Helper to get user from notification or handshake with better fallback logic
const getUserFromNotificationOrHandshake = (
    notification: NotificationRecord,
    handshake?: any,
    currentUserID?: number
) => {
    // First, try to get user from notification
    let user = null;
    if ('user' in notification) user = (notification as any).user;
    else if ('sender' in notification) user = (notification as any).sender;

    // If we got a user with a username and they are NOT the current user, use it
    if (user?.username && !(currentUserID && user.id === currentUserID)) {
        return user;
    }

    // Otherwise, try to extract from handshake if available
    if (handshake) {
        // Try to find the "other" user (not the current user)
        if (
            handshake.sender &&
            handshake.sender.id !== currentUserID &&
            handshake.sender.username
        ) {
            return handshake.sender;
        }
        if (
            handshake.receiver &&
            handshake.receiver.id !== currentUserID &&
            handshake.receiver.username
        ) {
            return handshake.receiver;
        }
        // If we couldn't find the "other" user, try sender first, then receiver
        if (handshake.sender?.username) {
            return handshake.sender;
        }
        if (handshake.receiver?.username) {
            return handshake.receiver;
        }
    }

    // Last resort: return the user we found (even without username) or null
    return user;
};

function describeNotification(
    notification: NotificationRecord,
    showingHandshakeCard = true,
    userID?: number,
    handshake?: any
) {
    switch (notification.type) {
    case NotificationType.MESSAGE_REPLY:
        return {
            title: 'Reply to your message',
            description: notification.message?.content || ''
        };
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
                'feedbackID' in notification
                    ? notification.feedbackID
                    : undefined;
        return {
            title: 'New bug report submitted',
            description: feedbackID
                ? `Feedback #${feedbackID}`
                : 'Review in the admin dashboard.'
        };
    }
    case NotificationType.SITE_FEEDBACK: {
        const feedbackID =
                'feedbackID' in notification
                    ? notification.feedbackID
                    : undefined;
        return {
            title: 'New site feedback submitted',
            description: feedbackID
                ? `Feedback #${feedbackID}`
                : 'Review in the admin dashboard.'
        };
    }
    case NotificationType.HANDSHAKE_CREATED: {
        const user = getUserFromNotificationOrHandshake(
            notification,
            handshake,
            userID
        );
        const username = getNotificationDisplayName(user, userID, true);
        return {
            title: 'New offer to help',
            description: showingHandshakeCard
                ? `${username} wants to help with your post. Click to view details.`
                : `${username} wants to help with your post.`
        };
    }
    case NotificationType.HANDSHAKE_ACCEPTED: {
        // Determine who accepted based on post ownership
        const user = getUserFromNotificationOrHandshake(
            notification,
            handshake,
            userID
        );
        const username = getNotificationDisplayName(user, userID);
        const usernameCapitalized = getNotificationDisplayName(
            user,
            userID,
            true
        );

        let title = 'Help offer accepted';
        let description = showingHandshakeCard
            ? 'The help offer was accepted! You can now coordinate.'
            : 'The help offer was accepted!';

        if (userID && handshake) {
            if (handshake.senderID === userID) {
                // Current user sent the request, so the other person accepted
                title = `${usernameCapitalized} accepted your help offer`;
                description = showingHandshakeCard
                    ? `${usernameCapitalized} accepted your help offer! You can now coordinate.`
                    : `${usernameCapitalized} accepted your help offer!`;
            }
            else if (
                handshake.receiverID === userID ||
                    handshake.recipientID === userID
            ) {
                // Current user is the post owner/receiver, so they accepted
                title = `You accepted ${username}'s help offer`;
                description = showingHandshakeCard
                    ? `You accepted ${username}'s help offer. You can now coordinate.`
                    : `You accepted ${username}'s help offer.`;
            }
        }

        return { title, description };
    }
    case NotificationType.HANDSHAKE_COMPLETED: {
        let title = 'Help completed';
        let description = showingHandshakeCard
            ? 'The help exchange has been completed successfully.'
            : 'The help exchange has been completed successfully.';

        if (userID && handshake) {
            // Determine current user's role in the handshake
            const postType = handshake.post?.type;
            const isSender = handshake.senderID === userID;
            const isReceiver =
                    handshake.receiverID === userID ||
                    handshake.recipientID === userID;

            // Pick the correct "other user" based on current user's role:
            // - handshake sender's counterpart is the receiver (= post creator)
            // - handshake receiver's counterpart is the sender
            const otherUser = isSender
                ? (handshake.receiver ?? handshake.post?.sender)
                : handshake.sender;

            const username = getNotificationDisplayName(otherUser, userID);
            const usernameCapitalized = getNotificationDisplayName(
                otherUser,
                userID,
                true
            );

            // For request posts: receiver (post creator) receives help, sender gives it
            // For gift posts: sender (handshake initiator) receives the gift, receiver gives it
            const userWasReceivingHelp =
                    (postType === 'request' && isReceiver) ||
                    (postType === 'gift' && isSender);

            if (isSender) {
                title = userWasReceivingHelp
                    ? `You received help from ${username}`
                    : `You helped ${username}`;
                description = userWasReceivingHelp
                    ? `You received help from ${username}.`
                    : `You helped ${username}.`;
            }
            else if (isReceiver) {
                title = userWasReceivingHelp
                    ? `${usernameCapitalized} helped you`
                    : `${usernameCapitalized} received help from you`;
                description = showingHandshakeCard
                    ? userWasReceivingHelp
                        ? `${usernameCapitalized} helped you. The exchange is complete.`
                        : `${usernameCapitalized} received help from you. The exchange is complete.`
                    : userWasReceivingHelp
                        ? `${usernameCapitalized} helped you.`
                        : `${usernameCapitalized} received help from you.`;
            }
        }

        return { title, description };
    }
    case NotificationType.HANDSHAKE_CANCELLED: {
        const noShow =
                'noShowReported' in notification
                    ? notification.noShowReported
                    : false;
        const user = getUserFromNotificationOrHandshake(
            notification,
            handshake,
            userID
        );

        let title = 'Help cancelled';
        let description = noShow
            ? 'The help was cancelled due to a no-show.'
            : 'The help was cancelled.';

        if (userID && handshake && !noShow) {
            const cancelledByUserID = handshake.cancelledByUserID;
            const postType = handshake.post?.type;
            const isReceiver =
                    handshake.receiverID === userID ||
                    handshake.recipientID === userID;
            const isSender = handshake.senderID === userID;
            const userWasReceivingHelp =
                    (postType === 'request' && isReceiver) ||
                    (postType === 'gift' && isSender);

            if (cancelledByUserID === userID) {
                title = userWasReceivingHelp
                    ? 'You stopped receiving help'
                    : 'You stopped giving help';
                description = userWasReceivingHelp
                    ? 'You stopped receiving help.'
                    : 'You stopped giving help.';
            }
            else if (cancelledByUserID) {
                const usernameCapitalized = getNotificationDisplayName(
                    user,
                    userID,
                    true
                );
                title = `${usernameCapitalized} stopped helping`;
                description = `${usernameCapitalized} stopped helping.`;
            }
        }

        return { title, description };
    }
    case NotificationType.POST_CLOSED_BY_OTHER_HANDSHAKE: {
        return {
            title: 'Post closed',
            description: showingHandshakeCard
                ? 'Another person completed a handshake on this post. The post is no longer available.'
                : 'Another person completed a handshake on this post.'
        };
    }
    case NotificationType.POST_REOPENED: {
        return {
            title: 'Post reopened',
            description: showingHandshakeCard
                ? 'A completed handshake was cancelled. The post is available again!'
                : 'The post is available again!'
        };
    }
    case NotificationType.EVENT_USER_JOINED: {
        const user = 'user' in notification ? notification.user : null;
        const username = getNotificationDisplayName(user, userID, true);
        return {
            title: `${username} joined your event`,
            description: 'Click to view event details.'
        };
    }
    case NotificationType.EVENT_INVITE: {
        const user = 'user' in notification ? notification.user : null;
        const username = getNotificationDisplayName(user, userID, true);
        return {
            title: `${username} invited you to an event`,
            description: 'Click to view event details.'
        };
    }
    case NotificationType.HANDSHAKE_UNDO_ACCEPTED: {
        const user = getUserFromNotificationOrHandshake(
            notification,
            handshake,
            userID
        );
        const usernameCapitalized = getNotificationDisplayName(
            user,
            userID,
            true
        );
        return {
            title: 'Help offer acceptance withdrawn',
            description: showingHandshakeCard
                ? `${usernameCapitalized} withdrew their acceptance of the help offer.`
                : `${usernameCapitalized} withdrew their acceptance.`
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

type NotificationFilter = 'all' | 'help' | 'comments' | 'other';

type GroupedNotification = {
    latest: NotificationRecord;
    previous: NotificationRecord[];
    postID: number;
    handshakeIDs: number[];
};

type NotificationItem = NotificationRecord | GroupedNotification;

function isGroupedNotification(
    item: NotificationItem
): item is GroupedNotification {
    return 'latest' in item && 'previous' in item && 'handshakeIDs' in item;
}

export default function NotificationsPage() {
    const navigate = useNavigate();
    const {
        markActed,
        acknowledgeAll,
        hasNewNotifications,
        clearNewNotifications
    } = useNotifications();
    const { user } = useAuth();
    const [filter, setFilter] = useState<NotificationFilter>('all');
    const markedAsReadRef = useRef<Set<number>>(new Set());
    const [expandedGroups, setExpandedGroups] = useState<Set<number>>(
        new Set()
    );
    const [showLoadingSpinner, setShowLoadingSpinner] = useState(false);
    const [showEmptyState, setShowEmptyState] = useState(false);

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
        queryFn: async ({ pageParam }) => {
            const response = await apiGet<NotificationsHistoryResponse>(
                '/notifications/history',
                {
                    params: {
                        limit: PAGE_SIZE,
                        cursor: pageParam
                    }
                }
            );
            console.log('[NotificationsPage] API Response:', {
                itemsCount: response.items.length,
                types: response.items.map((item) => item.type),
                hasEventUserJoined: response.items.some(
                    (item) => item.type === 'event-user-joined'
                ),
                hasMessageReply: response.items.some(
                    (item) => item.type === NotificationType.MESSAGE_REPLY
                ),
                hasEventReply: response.items.some(
                    (item) => item.type === 'event-reply'
                )
            });
            return response;
        },
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
        const itemsWithoutDMs = allItems.filter(
            (item) => item.type !== NotificationType.DIRECT_MESSAGE
        );

        // Debug: Log all notification types
        console.log('[NotificationsPage] All notification types:', {
            total: allItems.length,
            types: allItems.map((item) => item.type),
            eventUserJoined: allItems.filter(
                (item) => item.type === NotificationType.EVENT_USER_JOINED
            ).length,
            eventReply: allItems.filter(
                (item) => item.type === NotificationType.EVENT_REPLY
            ).length
        });

        const filtered =
            filter === 'all'
                ? itemsWithoutDMs
                : itemsWithoutDMs.filter((item) => {
                    if (filter === 'help') {
                        return (
                            item.type ===
                                  NotificationType.HANDSHAKE_CREATED ||
                              item.type ===
                                  NotificationType.HANDSHAKE_ACCEPTED ||
                              item.type ===
                                  NotificationType.HANDSHAKE_COMPLETED ||
                              item.type ===
                                  NotificationType.HANDSHAKE_CANCELLED ||
                              item.type ===
                                  NotificationType.POST_CLOSED_BY_OTHER_HANDSHAKE ||
                              item.type === NotificationType.POST_REOPENED
                        );
                    }
                    if (filter === 'comments') {
                        return (
                            item.type === NotificationType.MESSAGE_REPLY ||
                            item.type === NotificationType.POST_REPLY ||
                              item.type === NotificationType.EVENT_REPLY
                        );
                    }
                    if (filter === 'other') {
                        return (
                            item.type !== NotificationType.MESSAGE_REPLY &&
                            item.type !== NotificationType.POST_REPLY &&
                              item.type !== NotificationType.EVENT_REPLY &&
                              item.type !==
                                  NotificationType.HANDSHAKE_CREATED &&
                              item.type !==
                                  NotificationType.HANDSHAKE_ACCEPTED &&
                              item.type !==
                                  NotificationType.HANDSHAKE_COMPLETED &&
                              item.type !==
                                  NotificationType.HANDSHAKE_CANCELLED &&
                              item.type !==
                                  NotificationType.POST_CLOSED_BY_OTHER_HANDSHAKE &&
                              item.type !== NotificationType.POST_REOPENED
                        );
                    }
                    return true;
                });

        // Group handshake notifications by postID + handshakeID
        const handshakeGroups = new Map<string, NotificationRecord[]>();
        const nonHandshakeItems: NotificationRecord[] = [];

        filtered.forEach((item) => {
            const isHandshake =
                item.type === NotificationType.HANDSHAKE_CREATED ||
                item.type === NotificationType.HANDSHAKE_ACCEPTED ||
                item.type === NotificationType.HANDSHAKE_COMPLETED ||
                item.type === NotificationType.HANDSHAKE_CANCELLED ||
                item.type === NotificationType.POST_CLOSED_BY_OTHER_HANDSHAKE ||
                item.type === NotificationType.POST_REOPENED;

            if (
                isHandshake &&
                'postID' in item &&
                item.postID &&
                'handshakeID' in item &&
                item.handshakeID
            ) {
                const groupKey = `${item.postID}-${item.handshakeID}`;
                if (!handshakeGroups.has(groupKey)) {
                    handshakeGroups.set(groupKey, []);
                }
                const group = handshakeGroups.get(groupKey);
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
        handshakeGroups.forEach((notifications, groupKey) => {
            if (notifications.length === 1) {
                // Single notification, don't group
                result.push(notifications[0]);
            }
            else {
                // Multiple notifications, create a group
                // Sort by createdAt descending (most recent first)
                const sorted = [...notifications].sort((a, b) => {
                    const dateA = a.createdAt
                        ? new Date(a.createdAt).getTime()
                        : 0;
                    const dateB = b.createdAt
                        ? new Date(b.createdAt).getTime()
                        : 0;
                    return dateB - dateA;
                });

                // Get postID from the first notification (all should have the same)
                const postID =
                    'postID' in sorted[0] &&
                    typeof sorted[0].postID === 'number'
                        ? sorted[0].postID
                        : 0;

                // Collect all unique handshake IDs
                const handshakeIDs = Array.from(
                    new Set(
                        sorted
                            .filter(
                                (
                                    n
                                ): n is NotificationRecord & {
                                    handshakeID: number;
                                } =>
                                    'handshakeID' in n &&
                                    typeof n.handshakeID === 'number'
                            )
                            .map((n) => n.handshakeID)
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
                    return item.latest.createdAt
                        ? new Date(item.latest.createdAt).getTime()
                        : 0;
                }
                return item.createdAt ? new Date(item.createdAt).getTime() : 0;
            };
            return getLatestDate(b) - getLatestDate(a);
        });
    }, [allItems, filter]);

    // Delayed loading spinner to prevent flickering
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (isLoading) {
            timer = setTimeout(() => {
                setShowLoadingSpinner(true);
            }, 500);
        }
        else {
            setShowLoadingSpinner(false);
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [isLoading]);

    // Delayed empty state to prevent flashing
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (!isLoading && items.length === 0) {
            timer = setTimeout(() => {
                setShowEmptyState(true);
            }, 300);
        }
        else {
            setShowEmptyState(false);
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [isLoading, items.length]);

    // Auto-mark completed/cancelled handshake notifications as read when visible
    useEffect(() => {
        const notificationsToMark: NotificationRecord[] = [];

        items.forEach((item) => {
            if (isGroupedNotification(item)) {
                // For grouped notifications, check all notifications in the group
                const allNotifs = [item.latest, ...item.previous];
                allNotifs.forEach((notif) => {
                    if (
                        !notif.isActedOn &&
                        (notif.type === NotificationType.HANDSHAKE_COMPLETED ||
                            notif.type ===
                                NotificationType.HANDSHAKE_CANCELLED ||
                            notif.type ===
                                NotificationType.POST_CLOSED_BY_OTHER_HANDSHAKE ||
                            notif.type === NotificationType.POST_REOPENED)
                    ) {
                        notificationsToMark.push(notif);
                    }
                });
            }
            else {
                // For single notifications
                if (
                    !item.isActedOn &&
                    (item.type === NotificationType.HANDSHAKE_COMPLETED ||
                        item.type === NotificationType.HANDSHAKE_CANCELLED ||
                        item.type ===
                            NotificationType.POST_CLOSED_BY_OTHER_HANDSHAKE ||
                        item.type === NotificationType.POST_REOPENED)
                ) {
                    notificationsToMark.push(item);
                }
            }
        });

        if (notificationsToMark.length > 0) {
            const markAllAsync = async () => {
                const toMark = notificationsToMark.filter(
                    (notification) =>
                        !markedAsReadRef.current.has(notification.id)
                );

                if (toMark.length === 0) return;

                // Add all to the ref to prevent duplicate attempts
                toMark.forEach((notification) =>
                    markedAsReadRef.current.add(notification.id)
                );

                try {
                    await Promise.all(
                        toMark.map((notification) => markActed(notification.id))
                    );
                    // No need to refetch here - markActed invalidates the query in NotificationsContext
                }
                catch (err) {
                    console.error(
                        'Failed to auto-mark handshake notifications as read:',
                        err
                    );
                    // Remove from ref on failure so they can be retried
                    toMark.forEach((notification) =>
                        markedAsReadRef.current.delete(notification.id)
                    );
                }
            };

            markAllAsync();
        }
    }, [items, markActed]);

    const handleOpen = useCallback(
        (item: NotificationItem) => {
            const notification = isGroupedNotification(item)
                ? item.latest
                : item;

            if (notification.type === NotificationType.POST_REPLY) {
                navigate(`/post/${notification.postID}`);
            }
            else if (notification.type === NotificationType.MESSAGE_REPLY) {
                if ('postID' in notification && notification.postID) {
                    navigate(`/post/${notification.postID}`);
                }
                else if ('eventID' in notification && notification.eventID) {
                    navigate(`/event/${notification.eventID}`);
                }
                else if ('channelID' in notification && notification.channelID) {
                    const basePath =
                        'channelType' in notification &&
                        notification.channelType === 'dm'
                            ? routes.dms
                            : routes.chat;
                    navigate(
                        withQuery(basePath, {
                            channelID: notification.channelID
                        })
                    );
                }
            }
            else if (notification.type === NotificationType.EVENT_REPLY) {
                navigate(`/event/${notification.eventID}`);
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
                notification.type === NotificationType.HANDSHAKE_UNDO_ACCEPTED ||
                notification.type === NotificationType.HANDSHAKE_COMPLETED ||
                notification.type === NotificationType.HANDSHAKE_CANCELLED ||
                notification.type ===
                    NotificationType.POST_CLOSED_BY_OTHER_HANDSHAKE ||
                notification.type === NotificationType.POST_REOPENED
            ) {
                navigate(`/post/${notification.postID}`);
            }
            else if (
                notification.type === NotificationType.EVENT_USER_JOINED ||
                notification.type === NotificationType.EVENT_INVITE
            ) {
                navigate(`/event/${notification.eventID}`);
            }

            // Mark all notifications in group as acted
            const notificationsToMark = isGroupedNotification(item)
                ? [item.latest, ...item.previous]
                : [notification];

            const unactedNotifications = notificationsToMark.filter(
                (n) => !n.isActedOn
            );

            if (unactedNotifications.length > 0) {
                Promise.all(
                    unactedNotifications.map((n) => markActed(n.id))
                ).catch((err) => {
                    console.error(
                        'Failed to mark notification(s) acted from history view',
                        err
                    );
                });
                // No need to refetch - markActed invalidates the query
            }
        },
        [markActed, navigate]
    );

    const errorMessage = error
        ? error instanceof Error
            ? error.message
            : 'Something went wrong while loading notifications.'
        : '';

    const renderNotificationContent = (
        notification: NotificationRecord,
        shouldShowHandshakeCard: boolean,
        handshake?: any
    ) => {
        const createdAt = formatCreatedAt(notification.createdAt);

        if (notification.type === NotificationType.MESSAGE_REPLY) {
            return (
                <MessageReplyNotificationContent
                    notification={notification as any}
                    currentUserID={user?.id}
                    createdAt={createdAt}
                />
            );
        }

        if (notification.type === NotificationType.POST_REPLY) {
            return (
                <PostReplyNotificationContent
                    notification={notification as any}
                    currentUserID={user?.id}
                    createdAt={createdAt}
                />
            );
        }

        if (notification.type === NotificationType.EVENT_REPLY) {
            const author = notification.message?.author;
            const isCurrentUser = author && user?.id && author.id === user.id;
            const hasUsername = author?.username || author?.displayName;
            return (
                <div className='flex items-start gap-3'>
                    {isCurrentUser ? (
                        <div className='flex-shrink-0'>
                            <span className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                                You
                            </span>
                        </div>
                    ) : hasUsername ? (
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className='flex-shrink-0'
                        >
                            <DelayedUserCard
                                user={author}
                                triggerVariant='avatar-name'
                            />
                        </div>
                    ) : (
                        <div className='flex-shrink-0'>
                            <span className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                                Someone
                            </span>
                        </div>
                    )}
                    <div className='flex-1 min-w-0'>
                        <p className='text-sm text-zinc-600 dark:text-zinc-400 mb-1'>
                            Someone commented on your event
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
            notification.type === NotificationType.HANDSHAKE_UNDO_ACCEPTED ||
            notification.type === NotificationType.HANDSHAKE_COMPLETED ||
            notification.type === NotificationType.HANDSHAKE_CANCELLED ||
            notification.type ===
                NotificationType.POST_CLOSED_BY_OTHER_HANDSHAKE ||
            notification.type === NotificationType.POST_REOPENED
        ) {
            const handshakeID =
                'handshakeID' in notification
                    ? notification.handshakeID
                    : undefined;
            const postID =
                'postID' in notification ? notification.postID : undefined;

            const handleHandshakeInteraction = () => {
                if (!notification.isActedOn) {
                    markActed(notification.id).catch((err) => {
                        console.error(
                            'Failed to mark handshake notification as acted:',
                            err
                        );
                    });
                }
            };

            return (
                <HandshakeNotifItem
                    handshakeID={handshakeID}
                    postID={postID}
                    userID={user?.id}
                    notificationType={notification.type}
                    createdAt={createdAt}
                    onInteraction={handleHandshakeInteraction}
                />
            );
        }

        // Event user joined notifications
        if (notification.type === NotificationType.EVENT_USER_JOINED) {
            const eventUser =
                'user' in notification ? notification.user : undefined;
            const isCurrentUser =
                eventUser && user?.id && eventUser.id === user.id;
            const hasUsername = eventUser?.username || eventUser?.displayName;
            console.log('[NotificationsPage] EVENT_USER_JOINED notification:', {
                notification,
                eventUser,
                hasUser: !!eventUser,
                hasUsername,
                userID:
                    'userID' in notification ? notification.userID : undefined
            });
            return (
                <div className='flex flex-col gap-3'>
                    <div className='flex items-start justify-between gap-3'>
                        <div className='flex-1 min-w-0'>
                            <p className='text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2'>
                                Someone joined your event
                            </p>
                            {isCurrentUser ? (
                                <p className='text-sm text-zinc-700 dark:text-zinc-300'>
                                    You joined your event
                                </p>
                            ) : hasUsername ? (
                                <div onClick={(e) => e.stopPropagation()}>
                                    <DelayedUserCard
                                        user={eventUser}
                                        triggerVariant='avatar-name'
                                    />
                                </div>
                            ) : (
                                <p className='text-sm text-zinc-700 dark:text-zinc-300'>
                                    Someone joined your event
                                </p>
                            )}
                            <p className='text-xs text-zinc-500 dark:text-zinc-400 mt-2 italic'>
                                Click to view event details
                            </p>
                        </div>
                        {createdAt && (
                            <time className='flex-shrink-0 text-xs text-zinc-500 dark:text-zinc-400'>
                                {createdAt}
                            </time>
                        )}
                    </div>
                </div>
            );
        }

        // Event invite notifications
        if (notification.type === NotificationType.EVENT_INVITE) {
            const eventUser =
                'user' in notification ? notification.user : undefined;
            const isCurrentUser =
                eventUser && user?.id && eventUser.id === user.id;
            const hasUsername = eventUser?.username || eventUser?.displayName;
            return (
                <div className='flex flex-col gap-3'>
                    <div className='flex items-start justify-between gap-3'>
                        <div className='flex-1 min-w-0'>
                            <p className='text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2'>
                                Event invitation
                            </p>
                            {isCurrentUser ? (
                                <p className='text-sm text-zinc-700 dark:text-zinc-300'>
                                    You were invited to an event
                                </p>
                            ) : hasUsername ? (
                                <div onClick={(e) => e.stopPropagation()}>
                                    <DelayedUserCard
                                        user={eventUser}
                                        triggerVariant='avatar-name'
                                    />
                                </div>
                            ) : (
                                <p className='text-sm text-zinc-700 dark:text-zinc-300'>
                                    Someone invited you to an event
                                </p>
                            )}
                            <p className='text-xs text-zinc-500 dark:text-zinc-400 mt-2 italic'>
                                Click to view event details
                            </p>
                        </div>
                        {createdAt && (
                            <time className='flex-shrink-0 text-xs text-zinc-500 dark:text-zinc-400'>
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
            <div className='w-full mb-2'>
                <div className='flex w-full border-b border-zinc-200 dark:border-zinc-700'>
                    {[
                        { key: 'all', label: 'All', Icon: Filter },
                        {
                            key: 'help',
                            label: 'Help',
                            Icon: Handshake
                        },
                        {
                            key: 'comments',
                            label: 'Comments',
                            Icon: MessageCircle
                        },
                        { key: 'other', label: 'Other', Icon: MoreHorizontal }
                    ].map(({ key, label, Icon }) => {
                        const isActive = filter === key;

                        return (
                            <button
                                key={key}
                                onClick={() =>
                                    setFilter(key as NotificationFilter)
                                }
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

                        ${
                            isActive
                                ? 'border-brand-600 text-brand-600 dark:border-brand-300 dark:text-brand-300'
                                : 'border-transparent text-zinc-500 hover:text-brand-600 dark:text-zinc-400 dark:hover:text-brand-300'
                            }
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
                                    className='
                            leading-none
                            sm:inline
                            hidden xs:inline
                        '
                                >
                                    {label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <button
                onClick={async () => {
                    try {
                        // Mark ALL notifications as read on the server
                        await acknowledgeAll();
                    }
                    catch (err) {
                        console.error(
                            'Failed to mark all notifications as read:',
                            err
                        );
                    }
                }}
                className='
                    w-full mb-3
                    text-xs font-medium
                    text-zinc-500 dark:text-zinc-400
                    hover:text-zinc-700 dark:hover:text-zinc-200
                    hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50
                    py-2 rounded-md
                    transition
                '
            >
                Mark all as read
            </button>

            {showLoadingSpinner ? (
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
                showEmptyState ? (
                    <div
                        className='mt-6'
                        style={{ animation: 'fadeInSlow 0.4s ease-out both' }}
                    >
                        <Alert
                            type='info'
                            title='You are all caught up'
                            message='There are no notifications to show yet.'
                        />
                    </div>
                ) : null
            ) : (
                <>
                    <ul className='mt-6 space-y-3 mb-8'>
                        {items.map((item) => {
                            const isGrouped = isGroupedNotification(item);
                            const notification = isGrouped ? item.latest : item;
                            const allNotifications = isGrouped
                                ? [item.latest, ...item.previous]
                                : [item];
                            const hasUnread = allNotifications.some(
                                (n) => !n.isActedOn
                            );
                            const itemKey = isGrouped
                                ? `group-${item.postID}`
                                : `notif-${notification.id}`;
                            const isExpanded =
                                isGrouped && expandedGroups.has(item.postID);

                            const highlight = hasUnread
                                ? 'border-l-4 border-l-brand-600 dark:border-l-brand-400 bg-brand-50/80 dark:bg-brand-900/30 shadow-md'
                                : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900';

                            // For grouped notifications, always show the handshake card
                            // For single notifications, always show the card too (since we're grouping now)
                            const shouldShowHandshakeCard = true;

                            const handleMarkAsRead = async (
                                e: React.MouseEvent
                            ) => {
                                e.stopPropagation();

                                const notificationsToMark =
                                    allNotifications.filter(
                                        (n) => !n.isActedOn
                                    );

                                if (notificationsToMark.length > 0) {
                                    try {
                                        await Promise.all(
                                            notificationsToMark.map((n) =>
                                                markActed(n.id)
                                            )
                                        );
                                        // No need to refetch - markActed invalidates the query
                                    }
                                    catch (err) {
                                        console.error(
                                            'Failed to mark notification(s) as read:',
                                            err
                                        );
                                    }
                                }
                            };

                            const toggleExpanded = (e: React.MouseEvent) => {
                                e.stopPropagation();
                                if (isGrouped) {
                                    setExpandedGroups((prev) => {
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
                                        className={`w-full rounded-lg border px-4 py-4 text-left transition-all duration-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-600 dark:focus:ring-brand-300 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 ${highlight} overflow-hidden`}
                                        style={{
                                            animation: `fadeIn 600ms cubic-bezier(0.4, 0, 0.2, 1) both`
                                        }}
                                    >
                                        <NotificationContentWrapper
                                            notification={notification}
                                            shouldShowHandshakeCard={
                                                shouldShowHandshakeCard
                                            }
                                            renderContent={
                                                renderNotificationContent
                                            }
                                        />

                                        {/* Show count badge and expand button for grouped notifications */}
                                        {isGrouped &&
                                            item.previous.length > 0 &&
                                            (() => {
                                                const multipleHandshakes =
                                                    item.handshakeIDs.length >
                                                    1;

                                                return (
                                                    <div className='mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700'>
                                                        <button
                                                            type='button'
                                                            onClick={
                                                                toggleExpanded
                                                            }
                                                            className='flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 transition'
                                                        >
                                                            {isExpanded ? (
                                                                <ChevronUp className='w-4 h-4' />
                                                            ) : (
                                                                <ChevronDown className='w-4 h-4' />
                                                            )}
                                                            <span className='font-medium'>
                                                                +
                                                                {
                                                                    item
                                                                        .previous
                                                                        .length
                                                                }{' '}
                                                                earlier update
                                                                {item.previous
                                                                    .length !==
                                                                1
                                                                    ? 's'
                                                                    : ''}{' '}
                                                                about this{' '}
                                                                {multipleHandshakes
                                                                    ? 'post'
                                                                    : 'help request'}
                                                            </span>
                                                        </button>

                                                        {/* Expanded previous notifications */}
                                                        {isExpanded && (
                                                            <div className='mt-3 space-y-2 pl-6 border-l-2 border-zinc-300 dark:border-zinc-600'>
                                                                {item.previous.map(
                                                                    (
                                                                        prevNotif
                                                                    ) => {
                                                                        const prevHandshakeID =
                                                                            'handshakeID' in
                                                                            prevNotif
                                                                                ? prevNotif.handshakeID
                                                                                : null;
                                                                        const latestHandshakeID =
                                                                            'handshakeID' in
                                                                            item.latest
                                                                                ? item
                                                                                    .latest
                                                                                    .handshakeID
                                                                                : null;
                                                                        const isDifferentHandshake =
                                                                            multipleHandshakes &&
                                                                            prevHandshakeID !==
                                                                                latestHandshakeID;

                                                                        return (
                                                                            <PreviousNotificationItem
                                                                                key={
                                                                                    prevNotif.id
                                                                                }
                                                                                notification={
                                                                                    prevNotif
                                                                                }
                                                                                isDifferentHandshake={
                                                                                    isDifferentHandshake
                                                                                }
                                                                                userID={
                                                                                    user?.id
                                                                                }
                                                                            />
                                                                        );
                                                                    }
                                                                )}
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
                                {isFetchingNextPage ? 'Loading…' : 'Load more'}
                            </button>
                        ) : (
                            <span className='text-sm text-zinc-500 dark:text-zinc-400'>
                                You have reached the end of your notifications.
                            </span>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
