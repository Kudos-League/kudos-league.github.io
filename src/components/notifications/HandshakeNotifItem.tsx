import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    useCachedHandshake,
    useCachedPost,
    useCachedUser
} from '@/contexts/DataCacheContext';
import { getHandshakeStage } from '@/shared/handshakeUtils';
import { apiMutate } from '@/shared/api/apiClient';
import { getEndpointUrl } from '@/shared/api/config';
import {
    useCompleteHandshake,
    useCreateOffer,
    useUndoAcceptHandshake
} from '@/shared/api/mutations/handshakes';
import UserCard from '@/components/users/UserCard';
import Button from '@/components/common/Button';
import ConfirmationModal from '@/components/ConfirmationModal';
import { pushAlert } from '@/components/common/alertBus';

interface Props {
    handshakeID?: number;
    postID?: number;
    userID?: number;
    notificationType: string;
    createdAt?: string;
    onInteraction?: () => void;
}

const EVENT_META: Record<string, { label: string; bgClass: string; textClass: string }> = {
    'handshake-created': {
        label: 'New offer to help',
        bgClass: 'bg-blue-100 dark:bg-blue-900/30',
        textClass: 'text-blue-700 dark:text-blue-300',
    },
    'handshake-accepted': {
        label: 'Offer accepted',
        bgClass: 'bg-green-100 dark:bg-green-900/30',
        textClass: 'text-green-700 dark:text-green-300',
    },
    'handshake-completed': {
        label: 'Help completed',
        bgClass: 'bg-emerald-100 dark:bg-emerald-900/30',
        textClass: 'text-emerald-700 dark:text-emerald-300',
    },
    'handshake-cancelled': {
        label: 'Help cancelled',
        bgClass: 'bg-red-100 dark:bg-red-900/30',
        textClass: 'text-red-700 dark:text-red-300',
    },
    'handshake-undo-accepted': {
        label: 'Acceptance withdrawn',
        bgClass: 'bg-orange-100 dark:bg-orange-900/30',
        textClass: 'text-orange-700 dark:text-orange-300',
    },
    'post-closed-by-other-handshake': {
        label: 'Post closed',
        bgClass: 'bg-zinc-100 dark:bg-zinc-800',
        textClass: 'text-zinc-700 dark:text-zinc-300',
    },
    'post-reopened': {
        label: 'Post reopened',
        bgClass: 'bg-brand-100 dark:bg-brand-900/30',
        textClass: 'text-brand-700 dark:text-brand-300',
    },
};

function buildSentence(
    type: string,
    otherUser: any,
    currentUserID: number | undefined,
    handshake: any
): string {
    const name = otherUser?.displayName || otherUser?.username || 'Someone';
    const postType = handshake?.post?.type ?? 'request';

    switch (type) {
    case 'handshake-created':
        return postType === 'gift'
            ? `${name} requested your gift`
            : `${name} offered to help with your post`;
    case 'handshake-accepted':
        if (handshake && currentUserID) {
            if (handshake.receiverID === currentUserID)
                return `You accepted ${name}'s offer`;
            return `${name} accepted your offer`;
        }
        return `${name} accepted the help offer`;
    case 'handshake-completed': {
        if (!handshake || !currentUserID) return 'Help interaction completed';
        const isDigitalGift = handshake?.post?.giftType === 'digital';
        const isSender = handshake.senderID === currentUserID;

        if (isDigitalGift) {
            return isSender
                ? `You gave kudos to ${name} for sharing their digital resource`
                : `${name} gave you kudos for sharing your digital resource`;
        }

        const userReceived =
                (postType === 'request' && !isSender) ||
                (postType === 'gift' && isSender);
        return userReceived
            ? `${name} helped you — interaction complete!`
            : `You helped ${name} — interaction complete!`;

    }
    case 'handshake-cancelled':
        if (handshake && currentUserID) {
            if (handshake.cancelledByUserID === currentUserID)
                return 'You cancelled this help offer';
            return `${name} cancelled the help offer`;
        }
        return 'Help offer cancelled';
    case 'handshake-undo-accepted':
        return `${name} withdrew their acceptance`;
    case 'post-closed-by-other-handshake':
        return 'Another person completed a handshake — this post is now closed';
    case 'post-reopened':
        return 'A handshake was cancelled — this post is available again';
    default:
        return 'Handshake update';
    }
}

export default function HandshakeNotifItem({
    handshakeID,
    postID: postIDProp,
    userID,
    notificationType,
    createdAt,
    onInteraction,
}: Props) {
    const navigate = useNavigate();

    const { handshake: directHandshake, loading: hsLoading, error: hsError } =
        useCachedHandshake(handshakeID ?? 0);
    const { post: cachedPost, loading: postLoading } =
        useCachedPost(!handshakeID && postIDProp ? postIDProp : 0);

    const handshake = useMemo(() => {
        if (directHandshake) return directHandshake;
        if (cachedPost) {
            const found = (cachedPost.handshakes ?? []).find(
                (h: any) => h.senderID === userID || h.receiverID === userID
            );
            return found ? { ...found, post: cachedPost } : null;
        }
        return null;
    }, [directHandshake, cachedPost, userID]);

    const loading = handshakeID ? hsLoading : postLoading;
    const fetchError = handshakeID ? hsError : null;

    const [status, setStatus] = useState<string>(handshake?.status ?? 'new');
    const [processing, setProcessing] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [kudosValue, setKudosValue] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);
    const [imgError, setImgError] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showNoShowModal, setShowNoShowModal] = useState(false);
    const [showAcceptedWarning, setShowAcceptedWarning] = useState(false);

    useEffect(() => {
        if (handshake?.status) setStatus(handshake.status);
    }, [handshake?.status]);

    const stage = useMemo(
        () => (handshake ? getHandshakeStage({ ...handshake, status }, userID) : null),
        [handshake, status, userID]
    );

    const otherUserID = stage?.otherUserID;
    const { user: otherUser } = useCachedUser(otherUserID);

    const canAccept =
        !!stage?.canAccept &&
        !stage.postIsPast &&
        userID === handshake?.receiverID &&
        status === 'new';
    const canUndoAccept = !!stage?.canUndoAccept && !stage.postIsPast;
    const canCancel = !!stage?.canCancel && !stage.postIsPast;
    const canComplete = !!stage?.canComplete && status !== 'completed';
    const gifterID = stage?.gifterID;

    const isPostClosedByOther = useMemo(() => {
        if (!handshake?.post) return false;
        const other = (handshake.post.handshakes ?? []).find(
            (h: any) => h.id !== handshake.id && h.status === 'completed'
        );
        const limit = handshake.post.itemsLimit;
        const acceptedCount = (handshake.post.handshakes ?? []).filter(
            (h: any) => h.status === 'accepted' || h.status === 'completed'
        ).length;
        const limitReached =
            limit &&
            acceptedCount >= limit &&
            status !== 'accepted' &&
            status !== 'completed';
        return (
            Boolean(other || limitReached || handshake.post.status === 'closed') &&
            (status === 'new' || status === 'accepted')
        );
    }, [handshake, status]);

    const postImageSrc = useMemo(() => {
        const img = handshake?.post?.images?.[0];
        return img ? getEndpointUrl() + img : null;
    }, [handshake?.post?.images]);

    const createOfferMutation = useCreateOffer();
    const completeHandshakeMutation = useCompleteHandshake();
    const undoAcceptMutation = useUndoAcceptHandshake();

    const handleAccept = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setLocalError(null);
        setProcessing(true);
        try {
            await apiMutate(`/handshakes/${handshake!.id}`, 'patch', { status: 'accepted' });
            setStatus('accepted');
            const name = otherUser?.displayName || otherUser?.username || 'them';
            pushAlert({ type: 'success', message: `Accepted! You can now coordinate with ${name}.` });
            onInteraction?.();
        }
        catch {
            setLocalError('Could not accept.');
            pushAlert({ type: 'danger', message: 'Failed to accept. Please try again.' });
        }
        finally {
            setProcessing(false);
        }
    };

    const handleUndoAccept = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setLocalError(null);
        setProcessing(true);
        try {
            await undoAcceptMutation.mutateAsync({
                handshakeID: handshake!.id,
                postID: handshake!.postID,
            });
            setStatus('new');
            pushAlert({ type: 'success', message: 'Acceptance withdrawn.' });
            onInteraction?.();
        }
        catch {
            setLocalError('Failed to undo acceptance.');
            pushAlert({ type: 'danger', message: 'Failed to undo acceptance. Please try again.' });
        }
        finally {
            setProcessing(false);
        }
    };

    const handleCancelClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (status === 'accepted') setShowAcceptedWarning(true);
        else setShowCancelModal(true);
    };

    const handleCancelConfirmed = async () => {
        const ms = handshake?.createdAt ? new Date(handshake.createdAt).getTime() : 0;
        if (ms && Date.now() - ms >= 24 * 60 * 60 * 1000) {
            setShowNoShowModal(true);
            return;
        }
        await performCancellation({ status: 'cancelled' });
    };

    const handleNoShowResponse = async (noShow: boolean) => {
        await performCancellation({ status: 'cancelled', noShowReported: noShow });
    };

    const performCancellation = async (payload: Record<string, any>) => {
        setCancelling(true);
        setLocalError(null);
        try {
            await apiMutate(`/handshakes/${handshake!.id}`, 'patch', payload);
            setStatus('cancelled');
            pushAlert({ type: 'success', message: 'Deleted.' });
            onInteraction?.();
        }
        catch {
            setLocalError('Failed to delete.');
            pushAlert({ type: 'danger', message: 'Failed to delete. Please try again.' });
        }
        finally {
            setCancelling(false);
            setShowCancelModal(false);
            setShowNoShowModal(false);
            setShowAcceptedWarning(false);
        }
    };

    const handleKudosSubmit = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (status === 'completed' || submitting) return;
        if (!kudosValue || isNaN(Number(kudosValue))) {
            setLocalError('Enter a valid kudos amount.');
            return;
        }
        setSubmitting(true);
        setLocalError(null);
        try {
            await createOfferMutation.mutateAsync({
                postID: handshake!.postID,
                kudos: Number(kudosValue),
                currency: 'kudos',
                receiverID: gifterID,
            } as any);
            await completeHandshakeMutation.mutateAsync({
                handshakeID: handshake!.id,
                postID: handshake!.postID
            });
            setStatus('completed');
            setKudosValue('');
            pushAlert({ type: 'success', message: `${kudosValue} kudos sent!` });
            onInteraction?.();
        }
        catch {
            setLocalError('Failed to submit kudos.');
            pushAlert({ type: 'danger', message: 'Failed to submit kudos. Please try again.' });
        }
        finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className='space-y-3 animate-pulse'>
                <div className='flex items-center justify-between'>
                    <div className='h-5 w-32 rounded-full bg-zinc-200 dark:bg-zinc-700' />
                    <div className='h-3 w-20 rounded-full bg-zinc-200 dark:bg-zinc-700' />
                </div>
                <div className='h-4 w-3/4 rounded-full bg-zinc-200 dark:bg-zinc-700' />
                <div className='flex gap-3'>
                    <div className='h-14 w-14 flex-shrink-0 rounded-md bg-zinc-200 dark:bg-zinc-700' />
                    <div className='flex-1 space-y-2 pt-1'>
                        <div className='h-4 w-2/3 rounded-full bg-zinc-200 dark:bg-zinc-700' />
                        <div className='h-3 w-full rounded-full bg-zinc-100 dark:bg-zinc-800' />
                        <div className='h-3 w-5/6 rounded-full bg-zinc-100 dark:bg-zinc-800' />
                    </div>
                </div>
                <div className='flex items-center gap-2'>
                    <div className='h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-700' />
                    <div className='h-3 w-24 rounded-full bg-zinc-200 dark:bg-zinc-700' />
                </div>
            </div>
        );
    }

    if (fetchError || !handshake) {
        return (
            <p className='text-sm text-red-600 dark:text-red-400'>
                {fetchError ? 'Could not load handshake details.' : 'Handshake not found.'}
            </p>
        );
    }

    const meta = EVENT_META[notificationType] ?? EVENT_META['handshake-created'];
    const sentence = buildSentence(notificationType, otherUser, userID, handshake);
    const otherName = otherUser?.displayName || otherUser?.username || 'the other person';
    const postType = handshake.post?.type ?? 'request';
    const isDigitalGift = handshake.post?.giftType === 'digital';
    const metaLabel =
        notificationType === 'handshake-completed' && isDigitalGift
            ? handshake.senderID === userID
                ? 'Kudos given'
                : 'Kudos received'
            : meta.label;
    const showImagePlaceholder = imgError || !postImageSrc;

    return (
        <>
            <div className='space-y-3'>
                {/* Badge + timestamp */}
                <div className='flex items-center justify-between gap-2'>
                    <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.bgClass} ${meta.textClass}`}
                    >
                        {metaLabel}
                    </span>
                    {createdAt && (
                        <time className='flex-shrink-0 text-xs text-zinc-400 dark:text-zinc-500'>
                            {createdAt}
                        </time>
                    )}
                </div>

                {/* Descriptive sentence */}
                <p className='text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug'>
                    {sentence}
                </p>

                {/* Person row: who acted */}
                {otherUser && (
                    <div
                        className='flex items-center gap-2'
                        onClick={(e) => e.stopPropagation()}
                    >
                        <UserCard user={otherUser} triggerVariant='avatar-name' compact />
                    </div>
                )}

                {/* Post mini-preview */}
                {handshake.post && (
                    <div
                        role='link'
                        className='flex gap-3 items-start rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 p-2.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors'
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/post/${handshake.post?.id ?? handshake.postID}`);
                        }}
                    >
                        {/* Thumbnail / placeholder */}
                        <div className='w-14 h-14 flex-shrink-0 rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-700'>
                            {showImagePlaceholder ? (
                                <div
                                    className={`w-full h-full flex items-center justify-center text-center p-1.5 leading-tight ${
                                        postType === 'gift'
                                            ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                                            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                    }`}
                                >
                                    <span className='text-[10px] font-semibold line-clamp-3'>
                                        {handshake.post.title ?? 'Post'}
                                    </span>
                                </div>
                            ) : (
                                <img
                                    src={postImageSrc!}
                                    alt={handshake.post.title ?? 'Post image'}
                                    className='w-full h-full object-cover'
                                    onError={() => setImgError(true)}
                                />
                            )}
                        </div>

                        {/* Title + description */}
                        <div className='flex-1 min-w-0'>
                            <div className='mb-0.5'>
                                <span
                                    className={`rounded px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide ${
                                        postType === 'gift'
                                            ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300'
                                            : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                                    }`}
                                >
                                    {postType}
                                </span>
                            </div>
                            <p className='text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate'>
                                {handshake.post.title ?? 'Untitled'}
                            </p>
                            {handshake.post.body && (
                                <p className='text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5'>
                                    {handshake.post.body}
                                </p>
                            )}
                        </div>
                    </div>
                )}



                {/* Status context */}
                {isPostClosedByOther ? (
                    <div className='rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 px-3 py-2 text-xs text-red-800 dark:text-red-300'>
                        This post is no longer available — another exchange was completed.
                    </div>
                ) : status === 'new' ? (
                    <div className='rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300'>
                        {userID === handshake.senderID
                            ? 'Waiting for the poster to accept your offer.'
                            : 'Review this offer and accept or decline.'}
                    </div>
                ) : status === 'accepted' && !canComplete ? (
                    <div className='rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10 px-3 py-2 text-xs text-blue-800 dark:text-blue-300'>
                        Offer accepted — coordinate with {otherName} to complete the exchange.
                    </div>
                ) : status === 'completed' && notificationType !== 'handshake-undo-accepted' ? (
                    <div className='rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-300'>
                        {isDigitalGift
                            ? handshake.senderID === userID
                                ? 'Kudos given!'
                                : 'Kudos received!'
                            : 'Interaction complete.'}
                    </div>
                ) : status === 'cancelled' ? (
                    <div className='rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400'>
                        {handshake.cancelledByUserID === userID
                            ? 'You cancelled this offer.'
                            : `${otherName} cancelled this offer.`}
                        {handshake.noShowReported && ' No-show reported.'}
                    </div>
                ) : null}

                {localError && (
                    <p className='text-xs text-red-600 dark:text-red-400'>{localError}</p>
                )}
            </div>

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
                onClose={() => { setShowNoShowModal(false); handleNoShowResponse(false); }}
                onConfirm={() => { setShowNoShowModal(false); handleNoShowResponse(true); }}
                title='Report No-Show'
                message='Did the other party fail to show up? This will be noted in the system.'
                confirmText='Yes, No-Show'
                cancelText='No'
                variant='warning'
            />
            <ConfirmationModal
                isOpen={showAcceptedWarning}
                onClose={() => setShowAcceptedWarning(false)}
                onConfirm={() => { setShowAcceptedWarning(false); setShowCancelModal(true); }}
                title='Delete?'
                message='You both agreed to this. Are you sure you want to delete it? This action cannot be undone.'
                confirmText='Yes, Delete'
                cancelText='No, Keep It'
                variant='warning'
            />
        </>
    );
}
