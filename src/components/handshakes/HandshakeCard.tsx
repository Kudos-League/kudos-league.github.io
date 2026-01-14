import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/solid';

import { apiGet, apiMutate } from '@/shared/api/apiClient';
import {
    useCompleteHandshake,
    useCreateOffer
} from '@/shared/api/mutations/handshakes';
import type { HandshakeDTO, MessageDTO, ChannelDTO } from '@/shared/api/types';
import UserCard from '@/components/users/UserCard';
import { useAuth } from '@/contexts/useAuth';
import { getEndpointUrl } from '@/shared/api/config';
import { useCachedUser } from '@/contexts/DataCacheContext';
// import ChatModal from '@/components/messages/ChatModal';
import Button from '../common/Button';
import Pill from '../common/Pill';
import { getHandshakeStage } from '@/shared/handshakeUtils';
import ConfirmationModal from '../ConfirmationModal';
import { pushAlert } from '../common/alertBus';
import { current } from '@reduxjs/toolkit';

interface Props {
    handshake: HandshakeDTO;
    userID?: number;
    onHandshakeCreated?: (handshake: HandshakeDTO) => void;
    showPostDetails?: boolean;
    onDelete?: (id: number) => void;
    showSenderOrReceiver?: 'sender' | 'receiver';
    hideCardBorder?: boolean;
    compact?: boolean;
    onInteraction?: () => void;
    showUserKudos?: boolean;
}

const HandshakeCard: React.FC<Props> = ({
    handshake,
    userID,
    showPostDetails,
    onDelete,
    showSenderOrReceiver = 'receiver',
    hideCardBorder = false,
    compact = false,
    onInteraction,
    showUserKudos = false
}) => {
    const navigate = useNavigate();
    useAuth();

    const [status, setStatus] = useState(handshake.status);
    const [processing, setProcessing] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [kudosValue, setKudosValue] = useState('');
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [error, setError] = useState<string | null>();
    const [imgError, setImgError] = useState(false);
    const [lastMessage, setLastMessage] = useState<MessageDTO | null>(null);
    const [loadingMessage, setLoadingMessage] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showNoShowModal, setShowNoShowModal] = useState(false);
    const [showAcceptedWarningModal, setShowAcceptedWarningModal] =
        useState(false);

    // Use cached user data
    const { user: senderUser, loading: senderLoading } = useCachedUser(
        handshake.senderID
    );
    const { user: receiverUser, loading: receiverLoading } = useCachedUser(
        handshake.receiverID
    );

    // Delay showing user until data is loaded to prevent "Anonymous" flash
    const [showUser, setShowUser] = useState(false);
    const [fadeInUser, setFadeInUser] = useState(false);
    const [fadeInCard, setFadeInCard] = useState(false);

    // Sync internal status state with prop changes
    useEffect(() => {
        setStatus(handshake.status);
    }, [handshake.status]);

    useEffect(() => {
        // Only show user after data is loaded
        if (
            !senderLoading &&
            !receiverLoading &&
            (senderUser || receiverUser)
        ) {
            setShowUser(true);
            // Start fade-in animation after a brief delay
            setTimeout(() => setFadeInUser(true), 100);
        }
        else if (!senderUser && !receiverUser) {
            // Reset if users become null
            setShowUser(false);
            setFadeInUser(false);
        }
    }, [senderLoading, receiverLoading, senderUser, receiverUser]);

    // Trigger card fade-in AFTER user section is ready (or after loading completes)
    useEffect(() => {
        // Only fade in the card after:
        // 1. User section has faded in (fadeInUser is true), OR
        // 2. Loading is complete but there's no user to show
        if (fadeInUser) {
            // User section is ready, fade in card after a delay
            setTimeout(() => setFadeInCard(true), 150);
        }
        else if (!senderLoading && !receiverLoading) {
            // Loading complete but no users to show, fade in card
            setTimeout(() => setFadeInCard(true), 200);
        }
    }, [fadeInUser, senderLoading, receiverLoading]);

    const imageSrc = handshake.post?.images?.[0]
        ? getEndpointUrl() + handshake.post?.images[0]
        : undefined;
    const showBodyInImageBox =
        imgError || !handshake.post?.images?.length || !imageSrc;

    const stage = useMemo(() => {
        const handshakeForStage = { ...handshake, status } as typeof handshake;
        return getHandshakeStage(handshakeForStage, userID);
    }, [handshake, status, userID]);
    const canAccept = stage.canAccept;
    const canCancel = stage.canCancel;
    const canUndoAccept = stage.canUndoAccept;
    const canComplete = stage.canComplete;
    const gifterID = stage.gifterID;
    const userIsItemReceiver = stage.userIsItemReceiver;
    const isParticipant = stage.isParticipant;
    const otherUserID = stage.otherUserID;

    // Determine user's help action context
    const userHelpAction: 'receiving' | 'giving' | null =
        userID === handshake.receiverID
            ? handshake.post?.type === 'request'
                ? 'receiving'
                : 'giving'
            : userID === handshake.senderID
                ? handshake.post?.type === 'request'
                    ? 'giving'
                    : 'receiving'
                : null;

    // Get the other user's username for contextual messages
    const otherUser = userID === handshake.senderID ? receiverUser : senderUser;
    const otherUsername = otherUser?.username || 'the other user';

    // Helper to get display name - "you" if current user, otherwise username
    const getDisplayName = (
        user: typeof senderUser | typeof receiverUser,
        capitalize = false
    ) => {
        if (!user?.username) return user?.username || '';
        if (user.id === userID) return capitalize ? 'You' : 'you';
        return user.username;
    };

    // Check if another handshake on this post has been completed or if items limit reached
    const otherCompletedHandshake = useMemo(() => {
        if (!handshake.post?.handshakes) return null;
        return handshake.post.handshakes.find(
            (h) => h.id !== handshake.id && h.status === 'completed'
        );
    }, [handshake.post?.handshakes, handshake.id]);

    // Check if items limit has been reached
    const itemsLimitReached = useMemo(() => {
        if (!handshake.post?.handshakes || !handshake.post?.itemsLimit)
            return false;

        const acceptedOrCompletedCount = handshake.post.handshakes.filter(
            (h) => h.status === 'accepted' || h.status === 'completed'
        ).length;

        return acceptedOrCompletedCount >= handshake.post.itemsLimit;
    }, [handshake.post?.handshakes, handshake.post?.itemsLimit]);

    const isPostClosedByOther =
        (otherCompletedHandshake ||
            (itemsLimitReached &&
                status !== 'accepted' &&
                status !== 'completed') ||
            handshake.post?.status === 'closed') &&
        (status === 'new' || status === 'accepted');

    useEffect(() => {
        const fetchLastMessage = async () => {
            if (
                (status !== 'accepted' && status !== 'completed') ||
                !isParticipant ||
                userID == null ||
                otherUserID == null
            ) {
                setLoadingMessage(false);
                return;
            }

            setLoadingMessage(true);
            try {
                const channel = await apiMutate<ChannelDTO, any>(
                    '/channels',
                    'post',
                    {
                        name: `DM: User ${userID} & User ${otherUserID}`,
                        channelType: 'dm',
                        userIDs: [userID, otherUserID]
                    }
                );

                const messages = await apiGet<MessageDTO[]>(
                    `/channels/${channel.id}/messages`
                );

                const otherUserMessages = messages.filter(
                    (msg: MessageDTO) => msg.authorID === otherUserID
                );

                const lastMsg = otherUserMessages[otherUserMessages.length - 1];

                setLastMessage(lastMsg || null);
            }
            catch (err) {
                console.error('Error fetching last message:', err);
            }
            finally {
                setLoadingMessage(false);
            }
        };

        fetchLastMessage();
    }, [status, userID, otherUserID, isParticipant]);

    const handleAccept = async (): Promise<boolean> => {
        setError(null);
        if (status !== 'new') return false;

        setProcessing(true);
        try {
            await apiMutate(`/handshakes/${handshake.id}`, 'patch', {
                status: 'accepted'
            });
            setStatus('accepted');
            setIsChatOpen(true);
            pushAlert({
                type: 'success',
                message:
                    userHelpAction === 'receiving'
                        ? `You accepted ${otherUsername}'s offer! You can now coordinate.`
                        : `You accepted ${otherUsername}'s request! You can now coordinate.`
            });
            onInteraction?.();
            return true;
        }
        catch (err) {
            console.error(err);
            setError('Could not accept help offer.');
            pushAlert({
                type: 'danger',
                message: 'Failed to accept help offer. Please try again.'
            });
            return false;
        }
        finally {
            setProcessing(false);
        }
    };

    const handleUndoAccept = async () => {
        setError(null);
        setProcessing(true);
        try {
            await apiMutate(`/handshakes/${handshake.id}`, 'patch', {
                status: 'new'
            });
            setStatus('new');
            pushAlert({
                type: 'success',
                message:
                    userHelpAction === 'receiving'
                        ? 'Help acceptance cancelled. Status reverted to pending.'
                        : `Cancelled accepting ${otherUsername}'s request. Status reverted to pending.`
            });
            onInteraction?.();
        }
        catch (err) {
            console.error('Failed to undo accept', err);
            setError('Failed to undo accept');
            pushAlert({
                type: 'danger',
                message: 'Failed to undo acceptance. Please try again.'
            });
        }
        finally {
            setProcessing(false);
        }
    };

    const handleCancelHandshake = () => {
        if (cancelling || status === 'cancelled') return;

        // If status is accepted, show warning about item exchange first
        if (status === 'accepted') {
            setShowAcceptedWarningModal(true);
        }
        else {
            setShowCancelModal(true);
        }
    };

    const handleCancelConfirmed = async () => {
        const payload: Record<string, any> = { status: 'cancelled' };
        const createdAt = new Date(handshake.createdAt);
        const createdTime = createdAt.getTime();
        const isValidTimestamp = !Number.isNaN(createdTime);
        const twentyFourHoursMs = 24 * 60 * 60 * 1000;
        const shouldAskNoShow =
            isValidTimestamp && Date.now() - createdTime >= twentyFourHoursMs;

        if (shouldAskNoShow) {
            setShowNoShowModal(true);
            return;
        }

        await performCancellation(payload);
    };

    const handleNoShowResponse = async (noShow: boolean) => {
        const payload: Record<string, any> = {
            status: 'cancelled',
            noShowReported: noShow
        };
        await performCancellation(payload);
    };

    const performCancellation = async (payload: Record<string, any>) => {
        setCancelling(true);
        setError(null);
        try {
            await apiMutate(`/handshakes/${handshake.id}`, 'patch', payload);
            setStatus('cancelled');
            setIsChatOpen(false);
            onDelete?.(handshake.id);
            pushAlert({
                type: 'success',
                message: 'Deleted.'
            });
            onInteraction?.();
        }
        catch (err) {
            console.error('Failed to cancel handshake', err);
            setError('Failed to delete.');
            pushAlert({
                type: 'danger',
                message: 'Failed to delete. Please try again.'
            });
        }
        finally {
            setCancelling(false);
            setShowCancelModal(false);
            setShowNoShowModal(false);
            setShowAcceptedWarningModal(false);
        }
    };

    const handleKudosSubmit = async () => {
        // Prevent submission if already completed or submitting
        if (status === 'completed' || submitting) return;

        if (!kudosValue || isNaN(Number(kudosValue))) {
            setError('Enter a valid kudos number.');
            pushAlert({
                type: 'danger',
                message: 'Please enter a valid kudos amount.'
            });
            return;
        }

        setSubmitting(true);
        try {
            const dto: any = {
                postID: handshake.postID,
                kudos: Number(kudosValue),
                currency: 'kudos',
                receiverID: gifterID
            };
            await createOfferMutation.mutateAsync(dto);
            await completeHandshakeMutation.mutateAsync(handshake.id);
            setStatus('completed');
            setKudosValue('');
            pushAlert({
                type: 'success',
                message:
                    userHelpAction === 'receiving'
                        ? `${kudosValue} kudos sent successfully.`
                        : `You helped ${otherUsername}! Waiting for them to complete.`
            });
            onInteraction?.();
        }
        catch (err) {
            console.error(err);
            setError('Failed to submit kudos.');
            pushAlert({
                type: 'danger',
                message: 'Failed to submit kudos. Please try again.'
            });
        }
        finally {
            setSubmitting(false);
        }
    };

    const formatMessagePreview = (content: string) => {
        if (content.length > 50) {
            return content.substring(0, 50) + '...';
        }
        return content;
    };

    const createOfferMutation = useCreateOffer();
    const completeHandshakeMutation = useCompleteHandshake();

    return (
        <>
            <div
                onClick={() => navigate(`/post/${handshake.postID}`)}
                className={`${hideCardBorder ? '' : 'border border-gray-200 dark:border-gray-700'} ${compact ? 'p-3 sm:p-3' : 'p-4 sm:p-6'} rounded-xl shadow-sm hover:shadow-md transition-all duration-500 ease-out ${compact ? 'space-y-2' : 'space-y-4'} cursor-pointer ${fadeInCard ? 'opacity-100' : 'opacity-0'}`}
            >
                {/* Header: User + Status Badge */}
                <div className='flex items-center justify-between gap-2'>
                    <div
                        className={`font-semibold flex-1 min-w-0 transition-opacity duration-500 ease-out ${fadeInUser ? 'opacity-100' : 'opacity-0'}`}
                    >
                        {showUser ? (
                            <UserCard
                                user={
                                    showSenderOrReceiver === 'sender'
                                        ? senderUser
                                        : showSenderOrReceiver === 'receiver'
                                            ? receiverUser
                                            : userID &&
                                              handshake.senderID === userID
                                                ? receiverUser
                                                : userID &&
                                                handshake.receiverID === userID
                                                    ? senderUser
                                                    : senderUser
                                }
                                large={!showPostDetails && !compact}
                                showKudos={showUserKudos}
                                compact={compact}
                            />
                        ) : (
                            <div className='flex items-center gap-2'>
                                <div className='w-7 h-7 rounded-full bg-gray-300' />
                                <div className='w-24 h-4 bg-gray-300 rounded' />
                            </div>
                        )}
                    </div>

                    {/* Status badge */}
                    <Pill
                        tone={
                            status === 'new'
                                ? 'warning'
                                : status === 'accepted'
                                    ? 'info'
                                    : status === 'completed'
                                        ? 'success'
                                        : 'neutral'
                        }
                        className={`uppercase font-semibold ${compact ? 'text-xs' : ''} flex-shrink-0`}
                    >
                        {status === 'new' ? 'Pending' : status}
                    </Pill>
                </div>

                {/* Content: Post Details + Message Preview */}
                {showPostDetails && (
                    <div className='space-y-3'>
                        {/* Post Details - Optimized for Mobile */}
                        <div className='flex gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors'>
                            {/* Post Image/Preview - Larger on mobile */}
                            <div className='w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0'>
                                {showBodyInImageBox ? (
                                    <div className='w-full h-full bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400 rounded-lg flex items-center justify-center text-center p-2 overflow-hidden border border-gray-200 dark:border-gray-600'>
                                        {handshake.post?.body?.slice(0, 60) ||
                                            'No description'}
                                        …
                                    </div>
                                ) : (
                                    <img
                                        src={imageSrc}
                                        alt={
                                            handshake.post?.title ||
                                            'Post image'
                                        }
                                        className='w-full h-full object-cover rounded-lg border border-gray-200 dark:border-gray-700'
                                        onError={() => setImgError(true)}
                                    />
                                )}
                            </div>

                            {/* Post Info - Better spacing */}
                            <div className='flex flex-col justify-center flex-1 min-w-0'>
                                <span className='text-blue-600 dark:text-blue-400 font-medium text-base sm:text-sm break-words line-clamp-2'>
                                    {handshake.post?.title || 'Untitled post'}
                                </span>
                                <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                                    {new Date(
                                        handshake.createdAt
                                    ).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        {/* Last message preview - Compact on mobile */}
                        {/* {(status === 'accepted' || status === 'completed') && isParticipant && (
                            <div
                                className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/20 cursor-pointer transition-colors duration-200"
                                onClick={() => setIsChatOpen(true)}
                            >
                                {loadingMessage ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-blue-300 dark:bg-blue-700 rounded-full animate-pulse"></div>
                                        <span className="text-sm text-blue-700 dark:text-blue-300">
                                            Loading message...
                                        </span>
                                    </div>
                                ) : lastMessage ? (
                                    <div className="flex items-start gap-3">
                                        <ChatBubbleLeftIcon className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-700 dark:text-gray-300 break-words line-clamp-2 mb-1">
                                                {lastMessage.content}
                                            </p>
                                            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                                Tap to chat →
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <ChatBubbleLeftIcon className="w-5 h-5 text-blue-400 dark:text-blue-500" />
                                            <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                                                Start chat
                                            </span>
                                        </div>
                                        <span className="text-xl text-blue-500">→</span>
                                    </div>
                                )}
                            </div>
                        )} */}
                    </div>
                )}

                {/* Actions Row */}
                <div className={compact ? 'space-y-2' : 'space-y-3'}>
                    {/* Post Closed by Another Handshake Warning */}
                    {isPostClosedByOther && showUser && (
                        <div className='p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800'>
                            <p
                                className={`${compact ? 'text-sm' : 'text-base'} text-red-800 dark:text-red-300`}
                            >
                                <span className='font-semibold'>
                                    This post is no longer available.
                                </span>{' '}
                                Another person is{' '}
                                {handshake.post?.type === 'request'
                                    ? 'helping with this request'
                                    : handshake.post?.type === 'gift'
                                        ? 'receiving this item'
                                        : 'completing this exchange'}
                                .
                            </p>
                        </div>
                    )}

                    {/* Status Message */}
                    {status === 'new' && showUser && !isPostClosedByOther && (
                        <div className='p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800'>
                            <p
                                className={`${compact ? 'text-sm' : 'text-base'} text-amber-800 dark:text-amber-300`}
                            >
                                {userID === handshake.senderID ? (
                                    handshake.post?.type === 'request' ? (
                                        <>
                                            <span className='font-semibold'>
                                                You offered help to this user.
                                            </span>{' '}
                                            Waiting for the poster to accept.
                                        </>
                                    ) : (
                                        <>
                                            <span className='font-semibold'>
                                                You asked for help.
                                            </span>{' '}
                                            Waiting for the poster to accept.
                                        </>
                                    )
                                ) : userID === handshake.receiverID ? (
                                    handshake.post?.type === 'request' ? (
                                        <>
                                            <span className='font-semibold'>
                                                This user is offering help.
                                            </span>{' '}
                                            Accept to coordinate the exchange.
                                        </>
                                    ) : (
                                        <>
                                            <span className='font-semibold'>
                                                This user wants your help.
                                            </span>{' '}
                                            Accept to coordinate the exchange.
                                        </>
                                    )
                                ) : handshake.post?.type === 'request' ? (
                                    `${getDisplayName(senderUser, true)} is offering help to ${getDisplayName(receiverUser)}.`
                                ) : (
                                    `${getDisplayName(receiverUser, true)} wants this item from ${getDisplayName(senderUser)}.`
                                )}
                            </p>
                        </div>
                    )}

                    {status === 'accepted' &&
                        !canComplete &&
                        showUser &&
                        !isPostClosedByOther && (
                        <div className='p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800'>
                            <p
                                className={`${compact ? 'text-sm' : 'text-base'} text-blue-800 dark:text-blue-300`}
                            >
                                {userIsItemReceiver ? (
                                    <>
                                        <span className='font-semibold'>
                                                Exchange accepted!
                                        </span>{' '}
                                            Coordinate with {otherUsername} to
                                            complete the exchange. Once you
                                            receive help, you can assign kudos
                                            below.
                                    </>
                                ) : (
                                    <>
                                        <span className='font-semibold'>
                                                Exchange accepted!
                                        </span>{' '}
                                        {userID === handshake.senderID ||
                                            userID === handshake.receiverID
                                            ? `Waiting for ${otherUsername} to confirm they received the help.`
                                            : 'Both parties are coordinating the exchange.'}
                                    </>
                                )}
                            </p>
                        </div>
                    )}

                    {status === 'completed' && showUser && (
                        <div className='p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800'>
                            <p
                                className={`${compact ? 'text-sm' : 'text-base'} text-green-800 dark:text-green-300`}
                            >
                                {userHelpAction === 'receiving' ? (
                                    <>
                                        <span className='font-semibold'>
                                            You received help from{' '}
                                            {otherUsername}!
                                        </span>{' '}
                                        They received kudos from you.
                                    </>
                                ) : userHelpAction === 'giving' ? (
                                    <>
                                        <span className='font-semibold'>
                                            You helped {otherUsername}!
                                        </span>{' '}
                                        You received kudos from them.
                                    </>
                                ) : // For viewers: show who helped who based on post type
                                    handshake.post?.type === 'request' ? (
                                        <>
                                            <span className='font-semibold'>
                                                {getDisplayName(senderUser, true)}{' '}
                                            helped{' '}
                                                {getDisplayName(receiverUser)}!
                                            </span>{' '}
                                        The exchange is complete.
                                        </>
                                    ) : (
                                        <>
                                            <span className='font-semibold'>
                                                {getDisplayName(senderUser, true)}{' '}
                                            helped{' '}
                                                {getDisplayName(receiverUser)}!
                                            </span>{' '}
                                        The exchange is complete.
                                        </>
                                    )}
                            </p>
                        </div>
                    )}

                    {/* Action Buttons Row */}
                    {status !== 'completed' &&
                        !isPostClosedByOther &&
                        ((canAccept &&
                            !stage.postIsPast &&
                            userID === handshake.receiverID &&
                            status === 'new') ||
                            (canUndoAccept && !stage.postIsPast) ||
                            (canCancel && !stage.postIsPast)) && (
                        <div className='flex items-center gap-2'>
                            {/* Accept/Undo Button */}
                            {((canAccept &&
                                    !stage.postIsPast &&
                                    userID === handshake.receiverID &&
                                    status === 'new') ||
                                    (canUndoAccept && !stage.postIsPast)) && (
                                <Button
                                    variant={
                                        canUndoAccept
                                            ? 'warning'
                                            : 'success'
                                    }
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        canUndoAccept
                                            ? handleUndoAccept()
                                            : handleAccept();
                                    }}
                                    disabled={processing}
                                    className={`flex-1 ${compact ? 'text-sm py-3 px-4' : 'text-base py-3 px-6'}`}
                                >
                                    {processing ? (
                                        <span className='flex items-center justify-center gap-1'>
                                            <div
                                                className={`border-2 border-white border-t-transparent rounded-full animate-spin ${compact ? 'w-3 h-3' : 'w-5 h-5'}`}
                                            ></div>
                                            {compact
                                                ? canUndoAccept
                                                    ? 'Undoing'
                                                    : 'Accept'
                                                : canUndoAccept
                                                    ? 'Undoing...'
                                                    : 'Accepting...'}
                                        </span>
                                    ) : compact ? (
                                        canUndoAccept ? (
                                            'Undo'
                                        ) : (
                                            'Accept'
                                        )
                                    ) : canUndoAccept ? (
                                        'Undo Accept'
                                    ) : (
                                        'Accept Offer'
                                    )}
                                </Button>
                            )}

                            {/* Cancel Button */}
                            {canCancel && !stage.postIsPast && (
                                <Button
                                    variant='danger'
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCancelHandshake();
                                    }}
                                    disabled={cancelling}
                                    className={
                                        compact
                                            ? 'text-sm py-3 px-4'
                                            : 'text-base py-3 px-6'
                                    }
                                >
                                    {cancelling
                                        ? compact
                                            ? 'Deleting'
                                            : 'Deleting…'
                                        : 'Delete'}
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Kudos Assignment - Better mobile layout */}
                    {canComplete &&
                        status !== 'completed' &&
                        !isPostClosedByOther && (
                        <div
                            className={`flex flex-col ${compact ? 'gap-2 p-3' : 'gap-3 p-4'} bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800`}
                        >
                            <div className='space-y-1'>
                                <label
                                    className={`${compact ? 'text-sm' : 'text-base'} font-semibold text-green-800 dark:text-green-300 block`}
                                >
                                        Send Kudos to Complete Exchange
                                </label>
                                <p
                                    className={`${compact ? 'text-xs' : 'text-sm'} text-green-700 dark:text-green-400`}
                                >
                                        You&apos;ll receive help! Send kudos as
                                        a thank you to the{' '}
                                    {handshake.post?.type === 'request'
                                        ? 'giver'
                                        : 'poster'}{' '}
                                        once you receive it.
                                </p>
                            </div>
                            <div className='flex gap-2'>
                                <input
                                    type='number'
                                    value={kudosValue}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        setKudosValue(e.target.value);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    onFocus={(e) => e.stopPropagation()}
                                    className={`border border-green-300 dark:border-green-700 rounded-lg ${compact ? 'px-3 py-2 text-sm' : 'px-4 py-3 text-base'} focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-800 flex-1 min-w-0`}
                                    placeholder='Enter kudos amount'
                                />
                                <Button
                                    variant='success'
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleKudosSubmit();
                                    }}
                                    disabled={submitting}
                                    className={`${compact ? 'px-4 py-3 text-sm' : 'px-6 py-3'} flex-shrink-0`}
                                >
                                    {submitting ? (
                                        <span className='flex items-center gap-1'>
                                            <div
                                                className={`border-2 border-white border-t-transparent rounded-full animate-spin ${compact ? 'w-3 h-3' : 'w-4 h-4'}`}
                                            ></div>
                                            {compact
                                                ? 'Sending'
                                                : 'Sending...'}
                                        </span>
                                    ) : compact ? (
                                        'Send'
                                    ) : (
                                        'Send Kudos'
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Cancelled Message */}
                {status === 'cancelled' && handshake.cancelledByUserID && (
                    <div className='p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg'>
                        <p className='text-sm text-gray-700 dark:text-gray-300'>
                            {handshake.cancelledByUserID === userID ? (
                                userHelpAction === 'receiving' ? (
                                    <>
                                        You stopped receiving help on &quot;
                                        <span className='font-semibold'>
                                            {handshake.post?.title ||
                                                'this post'}
                                        </span>
                                        &quot;
                                    </>
                                ) : (
                                    <>
                                        You stopped giving help on &quot;
                                        <span className='font-semibold'>
                                            {handshake.post?.title ||
                                                'this post'}
                                        </span>
                                        &quot;
                                    </>
                                )
                            ) : (
                                <>
                                    {otherUsername} stopped helping on &quot;
                                    <span className='font-semibold'>
                                        {handshake.post?.title || 'this post'}
                                    </span>
                                    &quot;
                                </>
                            )}
                            {handshake.noShowReported && (
                                <span className='block mt-1 text-xs text-red-600 dark:text-red-400'>
                                    Reason: No-show reported
                                </span>
                            )}
                        </p>
                    </div>
                )}

                {/* Error Message */}
                {error && !canComplete && status !== 'cancelled' && (
                    <div className='p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg'>
                        <p className='text-sm text-red-700 dark:text-red-300 flex items-center gap-2'>
                            <span className='w-4 h-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center shrink-0'>
                                !
                            </span>
                            <span className='break-words'>{error}</span>
                        </p>
                    </div>
                )}
            </div>

            {/* Chat Modal */}
            {/* {isChatOpen && (
                <ChatModal
                    isChatOpen={isChatOpen}
                    setIsChatOpen={setIsChatOpen}
                    recipientID={otherUserID}
                    initialMessage={
                        handshake.post?.type === 'gift'
                            ? ""
                            : ''
                    }
                />
            )} */}

            {/* Confirmation Modals */}
            <ConfirmationModal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={handleCancelConfirmed}
                title='Delete?'
                message='Are you sure you want to delete this? This action cannot be undone.'
                confirmText='Yes, Delete'
                cancelText='No, Keep It'
                variant='danger'
            />

            <ConfirmationModal
                isOpen={showNoShowModal}
                onClose={() => {
                    setShowNoShowModal(false);
                    handleNoShowResponse(false);
                }}
                onConfirm={() => {
                    setShowNoShowModal(false);
                    handleNoShowResponse(true);
                }}
                title='Report No-Show'
                message='Did the other party fail to show up? This will be noted in the system.'
                confirmText='Yes, No-Show'
                cancelText='No'
                variant='warning'
            />

            {/* Accepted State Warning Modal */}
            <ConfirmationModal
                isOpen={showAcceptedWarningModal}
                onClose={() => setShowAcceptedWarningModal(false)}
                onConfirm={() => {
                    setShowAcceptedWarningModal(false);
                    setShowCancelModal(true);
                }}
                title='Delete?'
                message='You both agreed to this. Are you sure you want to delete it? This action cannot be undone.'
                confirmText='Yes, Delete'
                cancelText='No, Keep It'
                variant='warning'
            />
        </>
    );
};

export default HandshakeCard;
