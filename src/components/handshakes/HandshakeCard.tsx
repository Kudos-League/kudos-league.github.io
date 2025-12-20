import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/solid';

import { apiGet, apiMutate } from '@/shared/api/apiClient';
import { useCompleteHandshake, useCreateOffer } from '@/shared/api/mutations/handshakes';
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
import Alert from '../common/Alert';
import { current } from '@reduxjs/toolkit';

interface Props {
    handshake: HandshakeDTO;
    userID?: number;
    onHandshakeCreated?: (handshake: HandshakeDTO) => void;
    showPostDetails?: boolean;
    onDelete?: (id: number) => void;
    showSenderOrReceiver?: 'sender' | 'receiver';
    hideCardBorder?: boolean;
}

const HandshakeCard: React.FC<Props> = ({
    handshake,
    userID,
    showPostDetails,
    onDelete,
    showSenderOrReceiver = 'receiver',
    hideCardBorder = false
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
    const [showAcceptedWarningModal, setShowAcceptedWarningModal] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [toastType, setToastType] = useState<'success' | 'error'>('success');

    // Use cached user data
    const { user: senderUser } = useCachedUser(handshake.senderID);
    const { user: receiverUser } = useCachedUser(handshake.receiverID);

    const imageSrc = handshake.post.images?.[0]
        ? getEndpointUrl() + handshake.post.images[0]
        : undefined;
    const showBodyInImageBox =
        imgError || !handshake.post.images?.length || !imageSrc;

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
                const channel = await apiMutate<ChannelDTO, any>('/channels', 'post', {
                    name: `DM: User ${userID} & User ${otherUserID}`,
                    channelType: 'dm',
                    userIDs: [userID, otherUserID]
                });

                const messages = await apiGet<MessageDTO[]>(`/channels/${channel.id}/messages`);

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

    useEffect(() => {
        if (!toastMessage) return;
        const t = setTimeout(() => setToastMessage(null), 3000);
        return () => clearTimeout(t);
    }, [toastMessage]);

    const handleAccept = async (): Promise<boolean> => {
        setError(null);
        if (status !== 'new') return false;

        setProcessing(true);
        try {
            await apiMutate(`/handshakes/${handshake.id}`, 'patch', { status: 'accepted' });
            setStatus('accepted');
            setIsChatOpen(true);
            setToastType('success');
            setToastMessage('Handshake accepted! You can now chat and coordinate the exchange.');
            return true;
        }
        catch (err) {
            console.error(err);
            setError('Could not accept handshake.');
            setToastType('error');
            setToastMessage('Failed to accept handshake. Please try again.');
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
            await apiMutate(`/handshakes/${handshake.id}`, 'patch', { status: 'new' });
            setStatus('new');
            setToastType('success');
            setToastMessage('Handshake acceptance undone. Status reverted to pending.');
        }
        catch (err) {
            console.error('Failed to undo accept', err);
            setError('Failed to undo accept');
            setToastType('error');
            setToastMessage('Failed to undo acceptance. Please try again.');
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
        const shouldAskNoShow = isValidTimestamp && Date.now() - createdTime >= twentyFourHoursMs;

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
            setToastType('success');
            setToastMessage('Handshake cancelled successfully.');
        }
        catch (err) {
            console.error('Failed to cancel handshake', err);
            setError('Failed to cancel handshake.');
            setToastType('error');
            setToastMessage('Failed to cancel handshake. Please try again.');
        }
        finally {
            setCancelling(false);
            setShowCancelModal(false);
            setShowNoShowModal(false);
            setShowAcceptedWarningModal(false);
        }
    };

    const handleKudosSubmit = async () => {
        if (!kudosValue || isNaN(Number(kudosValue))) {
            setError('Enter a valid kudos number.');
            setToastType('error');
            setToastMessage('Please enter a valid kudos amount.');
            return;
        }

        setSubmitting(true);
        try {
            const dto: any = {
                postID: handshake.postID,
                amount: Number(kudosValue),
                currency: 'kudos',
                kudos: Number(kudosValue),
                receiverID: gifterID
            };
            await createOfferMutation.mutateAsync(dto);
            await completeHandshakeMutation.mutateAsync(handshake.id);
            setStatus('completed');
            setKudosValue('');
            setToastType('success');
            setToastMessage(`Handshake completed! ${kudosValue} kudos sent successfully.`);
        }
        catch (err) {
            console.error(err);
            setError('Failed to submit kudos.');
            setToastType('error');
            setToastMessage('Failed to submit kudos. Please try again.');
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
                className={`${hideCardBorder ? '' : 'border border-gray-200 dark:border-gray-700'} p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 space-y-4 cursor-pointer`}
            >
                {/* Header: User + Status Badge */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="font-semibold flex-1 min-w-0">
                        <UserCard user={userID && handshake.senderID === userID ? receiverUser : userID && handshake.receiverID === userID ? senderUser : showSenderOrReceiver === 'receiver' ? receiverUser : senderUser} large={!showPostDetails} />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Status badge */}
                        <Pill
                            tone={
                                status === 'new' ? 'warning' :
                                    status === 'accepted' ? 'info' :
                                        status === 'completed' ? 'success' :
                                            'neutral'
                            }
                            className="uppercase font-semibold"
                        >
                            {status === 'new' ? 'Pending' : status}
                        </Pill>

                        {canCancel && !stage.postIsPast && (
                            <Button
                                variant="danger"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelHandshake();
                                }}
                                disabled={cancelling}
                                className="text-xs"
                            >
                                {cancelling ? 'Cancelling…' : 'Cancel'}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Content: Post Details + Message Preview */}
                {showPostDetails && (
                    <div className="space-y-3">
                        {/* Post Details - Optimized for Mobile */}
                        <div className="flex gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                            {/* Post Image/Preview - Larger on mobile */}
                            <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                                {showBodyInImageBox ? (
                                    <div className="w-full h-full bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400 rounded-lg flex items-center justify-center text-center p-2 overflow-hidden border border-gray-200 dark:border-gray-600">
                                        {handshake.post.body.slice(0, 60)}…
                                    </div>
                                ) : (
                                    <img
                                        src={imageSrc}
                                        alt={handshake.post.title}
                                        className="w-full h-full object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                                        onError={() => setImgError(true)}
                                    />
                                )}
                            </div>

                            {/* Post Info - Better spacing */}
                            <div className="flex flex-col justify-center flex-1 min-w-0">
                                <span className="text-blue-600 dark:text-blue-400 font-medium text-base sm:text-sm break-words line-clamp-2">
                                    {handshake.post.title}
                                </span>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {new Date(handshake.createdAt).toLocaleDateString()}
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
                <div className="space-y-3">
                    {/* Accept/Undo Button - Full width on mobile */}
                    {((canAccept && !stage.postIsPast && userID === handshake.receiverID && status === 'new') ||
                      (canUndoAccept && !stage.postIsPast)) && (
                        <Button
                            variant={canUndoAccept ? 'warning' : 'success'}
                            onClick={(e) => {
                                e.stopPropagation();
                                canUndoAccept ? handleUndoAccept() : handleAccept();
                            }}
                            disabled={processing}
                            className="w-full text-base py-3"
                        >
                            {processing ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    {canUndoAccept ? 'Undoing...' : 'Accepting...'}
                                </span>
                            ) : (
                                canUndoAccept ? 'Undo Accept' : 'Accept Offer'
                            )}
                        </Button>
                    )}

                    {/* Kudos Assignment - Better mobile layout */}
                    {canComplete && (
                        <div className="flex flex-col gap-3 p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                            <label className="text-base font-semibold text-green-800 dark:text-green-300">
                                Assign Kudos to Complete
                            </label>
                            <div className="flex gap-3">
                                <input
                                    type="number"
                                    value={kudosValue}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        setKudosValue(e.target.value);
                                    }}
                                    className="border border-green-300 dark:border-green-700 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-800 flex-1"
                                    placeholder="Enter amount"
                                />
                                <Button
                                    variant="success"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleKudosSubmit();
                                    }}
                                    disabled={submitting}
                                    className="px-6 py-3"
                                >
                                    {submitting ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Sending...
                                        </span>
                                    ) : (
                                        'Submit'
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Waiting Message - Full width */}
                    {canUndoAccept && status === 'accepted' && !stage.postIsPast && !canComplete && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-base text-blue-700 dark:text-blue-300 text-center">
                                ⏳ Waiting for the user to receive the item
                            </p>
                        </div>
                    )}
                </div>

                {/* Cancelled Message */}
                {status === 'cancelled' && handshake.cancelledByUserID && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            {handshake.cancelledByUserID === userID ? (
                                <>You&apos;ve cancelled handshake on &quot;<span className="font-semibold">{handshake.post?.title || 'this post'}</span>&quot;</>
                            ) : (
                                <>Handshake cancelled on &quot;<span className="font-semibold">{handshake.post?.title || 'this post'}</span>&quot;</>
                            )}
                            {handshake.noShowReported && (
                                <span className="block mt-1 text-xs text-red-600 dark:text-red-400">
                                    Reason: No-show reported
                                </span>
                            )}
                        </p>
                    </div>
                )}

                {/* Error Message */}
                {error && !canComplete && status !== 'cancelled' && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                            <span className="w-4 h-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center shrink-0">
                                !
                            </span>
                            <span className="break-words">{error}</span>
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
                        handshake.post.type === 'gift'
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
                title="Cancel Handshake"
                message="Are you sure you want to cancel this handshake? This action cannot be undone."
                confirmText="Yes, Cancel"
                cancelText="No, Keep It"
                variant="danger"
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
                title="Report No-Show"
                message="Did the other party fail to show up? This will be noted in the system."
                confirmText="Yes, No-Show"
                cancelText="No"
                variant="warning"
            />

            {/* Accepted State Warning Modal */}
            <ConfirmationModal
                isOpen={showAcceptedWarningModal}
                onClose={() => setShowAcceptedWarningModal(false)}
                onConfirm={() => {
                    setShowAcceptedWarningModal(false);
                    setShowCancelModal(true);
                }}
                title="Cancel Accepted Handshake"
                message="You both agreed to this exchange. Did you not receive the item? Canceling will end this handshake."
                confirmText="Yes, Cancel It"
                cancelText="No, Keep It"
                variant="warning"
            />

            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
                    <Alert
                        type={toastType === 'success' ? 'success' : 'danger'}
                        title={toastType === 'success' ? 'Success' : 'Error'}
                        message={toastMessage}
                        show={!!toastMessage}
                        onClose={() => setToastMessage(null)}
                        closable={true}
                    />
                </div>
            )}
        </>
    );
};

export default HandshakeCard;
