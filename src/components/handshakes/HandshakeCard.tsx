import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/solid';

import { apiGet, apiMutate } from '@/shared/api/apiClient';
import { useCompleteHandshake, useCreateOffer } from '@/shared/api/mutations/handshakes';
import type { HandshakeDTO, UserDTO, MessageDTO, ChannelDTO } from '@/shared/api/types';
import UserCard from '@/components/users/UserCard';
import { useAuth } from '@/contexts/useAuth';
import { getEndpointUrl } from '@/shared/api/config';
// import ChatModal from '@/components/messages/ChatModal';
import Button from '../common/Button';
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
}

const HandshakeCard: React.FC<Props> = ({
    handshake,
    userID,
    showPostDetails,
    onDelete,
    showSenderOrReceiver = 'receiver'
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
    const [senderUser, setSenderUser] = useState<UserDTO | null>(null);
    const [receiverUser, setReceiverUser] = useState<UserDTO | null>(null);
    const [imgError, setImgError] = useState(false);
    const [lastMessage, setLastMessage] = useState<MessageDTO | null>(null);
    const [loadingMessage, setLoadingMessage] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showNoShowModal, setShowNoShowModal] = useState(false);
    const [showAcceptedWarningModal, setShowAcceptedWarningModal] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [toastType, setToastType] = useState<'success' | 'error'>('success');

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
        const fetchSender = async () => {
            try {
                const sender = await apiGet<UserDTO>(`/users/${handshake.senderID}`);
                setSenderUser(sender);
            }
            catch (err) {
                console.error('Error loading user info', err);
                setError('Error loading user info');
            }
        };
        fetchSender();
    }, [handshake]);

    useEffect(() => {
        const fetchReceiver = async () => {
            try {
                const receiver = await apiGet<UserDTO>(`/users/${handshake.receiverID}`);
                setReceiverUser(receiver);
            }
            catch (err) {
                console.error('Error loading user info', err);
                setError('Error loading user info');
            }
        };
        fetchReceiver();
    }, [handshake]);

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
            <div className="border border-gray-200 p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 space-y-4">
                {/* Header: User + Status Badge */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="font-semibold flex-1 min-w-0">
                        <UserCard user={showSenderOrReceiver === 'receiver' ? receiverUser : senderUser} large={!showPostDetails} />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Status badge */}
                        <span
                            className={`text-xs font-medium px-3 py-1 rounded-full text-white shadow-sm whitespace-nowrap ${
                                status === 'new'
                                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                                    : status === 'accepted'
                                        ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                                        : status === 'completed'
                                            ? 'bg-gradient-to-r from-green-500 to-green-600'
                                            : 'bg-gradient-to-r from-gray-400 to-gray-500'
                            }`}
                        >
                            {status === 'new'
                                ? 'Pending'
                                : status.charAt(0).toUpperCase() +
                                  status.slice(1)}
                        </span>

                        {canCancel && !stage.postIsPast && (
                            <Button
                                variant="danger"
                                onClick={handleCancelHandshake}
                                disabled={cancelling}
                                className="text-xs px-3 py-2 whitespace-nowrap"
                            >
                                {cancelling ? 'Cancelling…' : 'Cancel'}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Post Details Section */}
                {showPostDetails && (
                    <div className="space-y-3">
                        <div className="flex gap-3 sm:gap-4">
                            {/* Post Image/Preview */}
                            <div
                                onClick={() => navigate(`/post/${handshake.postID}`)}
                                className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity duration-200"
                            >
                                {showBodyInImageBox ? (
                                    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 text-xs text-gray-600 rounded-lg flex items-center justify-center text-center p-2 overflow-hidden border">
                                        {handshake.post.body.slice(0, 60)}…
                                    </div>
                                ) : (
                                    <img
                                        src={imageSrc}
                                        alt={handshake.post.title}
                                        className="w-full h-full object-cover rounded-lg border"
                                        onError={() => setImgError(true)}
                                    />
                                )}
                            </div>

                            {/* Post Info */}
                            <div className="flex flex-col justify-between flex-1 min-w-0">
                                <div>
                                    <span
                                        className="text-blue-600 hover:text-blue-800 underline cursor-pointer font-medium text-sm break-words"
                                        onClick={() => navigate(`/post/${handshake.postID}`)}
                                    >
                                        {handshake.post.title}
                                    </span>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Created: {new Date(handshake.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Last message preview */}
                        {(status === 'accepted' || status === 'completed') && isParticipant && (
                            <div
                                className="p-2 sm:p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 cursor-pointer transition-colors duration-200"
                                onClick={() => setIsChatOpen(true)}
                            >
                                {loadingMessage ? (
                                    <div className="flex items-center space-x-2">
                                        <div className="w-3 h-3 bg-gray-300 rounded-full animate-pulse"></div>
                                        <span className="text-xs text-gray-500">
                                            Loading last message...
                                        </span>
                                    </div>
                                ) : lastMessage ? (
                                    <div className="flex items-start space-x-2">
                                        <ChatBubbleLeftIcon className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs text-gray-700 break-words">
                                                {formatMessagePreview(lastMessage.content)}
                                            </p>
                                        </div>
                                        <span className="text-xs text-blue-500 font-medium whitespace-nowrap">
                                            Click to chat
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center space-x-2">
                                            <ChatBubbleLeftIcon className="w-3 h-3 text-gray-400" />
                                            <span className="text-xs text-gray-500">
                                                No messages yet
                                            </span>
                                        </div>
                                        <span className="text-xs text-blue-500 font-medium whitespace-nowrap">
                                            Start chat
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Unified Accept/Undo Button */}
                {((canAccept && !stage.postIsPast && userID === handshake.receiverID && handshake.status === 'new') ||
                  (canUndoAccept && !stage.postIsPast)) && (
                    <Button
                        className={`
                            w-full sm:w-auto relative overflow-hidden font-medium text-sm px-6 py-3 rounded-lg text-white
                            transition-all duration-200 transform hover:scale-105 active:scale-95
                            shadow-lg hover:shadow-xl
                            ${
                    processing
                        ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed'
                        : canUndoAccept
                            ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700'
                            : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
                    }
                            before:absolute before:inset-0 before:bg-white before:opacity-0
                            hover:before:opacity-10 before:transition-opacity before:duration-200
                        `}
                        onClick={canUndoAccept ? handleUndoAccept : handleAccept}
                        disabled={processing}
                    >
                        <span
                            className={`transition-opacity duration-200 ${processing ? 'opacity-0' : 'opacity-100'}`}
                        >
                            {canUndoAccept ? 'Undo Accept' : 'Accept Offer'}
                        </span>
                        {processing && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span className="ml-2 text-sm">
                                    {canUndoAccept ? 'Undoing...' : 'Accepting...'}
                                </span>
                            </div>
                        )}
                    </Button>
                )}

                {/* Kudos Assignment */}
                {canComplete && (
                    <div className="space-y-3 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                        <label className="block text-sm font-medium text-green-800">
                            When you receive the item assign Kudos to Complete
                        </label>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="number"
                                value={kudosValue}
                                onChange={(e) => setKudosValue(e.target.value)}
                                className="border border-green-300 rounded-lg flex-1 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="Enter kudos amount"
                            />
                            <Button
                                onClick={handleKudosSubmit}
                                disabled={submitting}
                                className={`
                                    w-full sm:w-auto px-6 py-2 rounded-lg text-white font-medium text-sm
                                    transition-all duration-200 transform hover:scale-105 active:scale-95
                                    shadow-md hover:shadow-lg whitespace-nowrap
                                    ${submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'}
                                `}
                            >
                                {submitting ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Sending...
                                    </div>
                                ) : (
                                    'Submit'
                                )}
                            </Button>
                        </div>
                        {error && (
                            <p className="text-sm text-red-600 flex items-center">
                                <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2">
                                    !
                                </span>
                                {error}
                            </p>
                        )}
                    </div>
                )}

                {canUndoAccept && status === 'accepted' && !stage.postIsPast && (
                    <div>
                        <p className="text-sm text-gray-600">
                            Waiting for the user to receive the item so you can get kudos
                        </p>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700 flex items-center">
                            <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2 text-red-600 flex-shrink-0">
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
