import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Tippy from '@tippyjs/react';
import { XMarkIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/solid';

import {
    getUserDetails,
    updateHandshake,
    createRewardOffer,
    deleteHandshake,
    createDMChannel,
    getMessages
} from '@/shared/api/actions';
import type { HandshakeDTO, UserDTO, MessageDTO } from '@/shared/api/types';
import type { CreateRewardOfferDTO } from '@/shared/api/types';
import UserCard from '@/components/users/UserCard';
import { useAuth } from '@/hooks/useAuth';
import { getEndpointUrl } from '@/shared/api/config';
import ChatModal from '@/components/messages/ChatModal';

interface Props {
    handshake: HandshakeDTO;
    userID: number;
    onHandshakeCreated?: (handshake: HandshakeDTO) => void;
    showPostDetails?: boolean;
    onDelete?: (id: number) => void;
}

const HandshakeCard: React.FC<Props> = ({ handshake, userID, showPostDetails, onDelete }) => {
    const navigate = useNavigate();
    const { token } = useAuth();

    const isSender = handshake.senderID === userID;
    const [status, setStatus] = useState(handshake.status);
    const [processing, setProcessing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [kudosValue, setKudosValue] = useState('');
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [error, setError] = useState<string | null>();
    const [senderUser, setSenderUser] = useState<UserDTO | null>(null);
    const [imgError, setImgError] = useState(false);
    const [lastMessage, setLastMessage] = useState<MessageDTO | null>(null);
    const [loadingMessage, setLoadingMessage] = useState(false);

    const imageSrc = handshake.post.images?.[0]
        ? getEndpointUrl() + handshake.post.images[0]
        : undefined;
    const showBodyInImageBox = imgError || !handshake.post.images?.length || !imageSrc;
    
    // ─── who is receiving the item? ──────────────────────────────────────────────
    const canAccept = status === 'new' && userID === handshake.post.senderID;
    const itemReceiverID =
        handshake.post.type === 'gift'
            ? handshake.senderID            // a gift post: requester is handshake.sender
            : handshake.post.senderID;      // a request post: OP is the receiver

    const gifterID =
        handshake.post.type === 'gift'
            ? handshake.post.senderID       // giver = post owner
            : handshake.senderID;           // giver = handshake sender
    const userIsItemReceiver = userID === itemReceiverID;

    // Determine the other user in the conversation
    const otherUserID = userID === handshake.senderID ? handshake.post.senderID : handshake.senderID;

    useEffect(() => {
        const fetchSender = async () => {
            try {
                const sender = await getUserDetails(handshake.senderID, token);
                setSenderUser(sender);
            }
            catch (err) {
                console.error('Error loading user info', err);
                setError('Error loading user info');
            }
        };
        fetchSender();
    }, [handshake, token]);

    // Fetch last message if handshake is accepted
    useEffect(() => {
        const fetchLastMessage = async () => {
            if (status !== 'accepted' && status !== 'completed') return;
            
            setLoadingMessage(true);
            try {
                // Create or get DM channel between the two users
                const channel = await createDMChannel(userID, otherUserID, token);
                console.log('DM Channel:', channel);
                
                const messages = await getMessages(channel.id, token);
                console.log('All messages:', messages);
                
                // Get the last message from the other user
                const otherUserMessages = messages.filter((msg: MessageDTO) => msg.authorID === otherUserID);
                console.log('Other user messages:', otherUserMessages);
                
                const lastMsg = otherUserMessages[otherUserMessages.length - 1];
                console.log('Last message from other user:', lastMsg);
                
                setLastMessage(lastMsg || null);
            } catch (err) {
                console.error('Error fetching last message:', err);
                // Don't show error to user, just silently fail
            } finally {
                setLoadingMessage(false);
            }
        };

        fetchLastMessage();
    }, [status, userID, otherUserID, token]);

    const handleAccept = async (): Promise<boolean> => {
        setError(null);
        if (status !== 'new') return false;

        setProcessing(true);
        try {
            await updateHandshake(handshake.id, { status: 'accepted' }, token);
            setStatus('accepted');
            setIsChatOpen(true);
            return true;
        }
        catch (err) {
            console.error(err);
            setError('Could not accept handshake.');
            return false;
        }
        finally {
            setProcessing(false);
        }
    };

    const handleKudosSubmit = async () => {
        if (!kudosValue || isNaN(Number(kudosValue))) {
            setError('Enter a valid kudos number.');
            return;
        }

        setSubmitting(true);
        try {
            const dto: CreateRewardOfferDTO = {
                postID: handshake.postID,
                amount: Number(kudosValue),
                currency: 'kudos',
                kudos: Number(kudosValue),
                receiverID: gifterID
            };
            await createRewardOffer(dto, token);
            await updateHandshake(handshake.id, { status: 'completed' }, token);
            setStatus('completed');
            setKudosValue('');
        }
        catch (err) {
            console.error(err);
            setError('Failed to submit kudos.');
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

    const getTimeAgo = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - new Date(date).getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return new Date(date).toLocaleDateString();
    };

    return (
        <>
            <div className={`border border-gray-200 p-6 rounded-xl shadow-sm bg-white hover:shadow-md transition-shadow duration-200 ${showPostDetails && 'space-y-4'}`}>
                <div className='flex justify-between items-start'>
                    <div className='font-semibold'>
                        <UserCard
                            username={senderUser?.username}
                            avatar={senderUser?.avatar}
                            userID={senderUser?.id}
                            large={!showPostDetails}
                        />
                    </div>

                    <div className='flex items-start gap-2 ml-4'>
                        {/* Status badge */}
                        <span
                            className={`text-xs font-medium px-3 py-1 rounded-full text-white shadow-sm ${
                                status === 'new'
                                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                                    : status === 'accepted'
                                        ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                                        : 'bg-gradient-to-r from-green-500 to-green-600'
                            }`}
                        >
                            {status === 'new' ? 'Pending' : status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>

                        {isSender && status === 'new' && (
                            <Tippy content="Rescind Offer">
                                <button
                                    onClick={async () => {
                                        if (!confirm('Are you sure you want to rescind this handshake?')) return;

                                        try {
                                            await deleteHandshake(handshake.id, token);
                                            onDelete?.(handshake.id);
                                        }
                                        catch (err) {
                                            console.error('Failed to delete handshake', err);
                                            setError('Failed to delete handshake');
                                        }
                                    }}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-full transition-colors duration-200"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </Tippy>
                        )}
                    </div>
                </div>

                <div className='flex items-start justify-between'>
                    {showPostDetails && (
                        <div className='flex space-x-4 flex-1'>
                            <div
                                onClick={() => navigate(`/post/${handshake.postID}`)}
                                className='w-20 h-20 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity duration-200'
                            >
                                {showBodyInImageBox ? (
                                    <div className='w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 text-xs text-gray-600 rounded-lg flex items-center justify-center text-center p-2 overflow-hidden border'>
                                        {handshake.post.body.slice(0, 60)}…
                                    </div>
                                ) : (
                                    <img
                                        src={imageSrc}
                                        alt={handshake.post.title}
                                        className='w-full h-full object-cover rounded-lg border'
                                        onError={() => setImgError(true)}
                                    />
                                )}
                            </div>

                            <div className='flex flex-col justify-between flex-1 min-w-0'>
                                <div>
                                    <span
                                        className='text-blue-600 hover:text-blue-800 underline cursor-pointer font-medium text-sm'
                                        onClick={() => navigate(`/post/${handshake.postID}`)}
                                    >
                                        {handshake.post.title}
                                    </span>
                                    <p className='text-xs text-gray-500 mt-1'>
                                        Created: {new Date(handshake.createdAt).toLocaleDateString()}
                                    </p>
                                </div>

                                {/* Last message preview */}
                                {(status === 'accepted' || status === 'completed') && (
                                    <div 
                                        className='mt-2 p-2 bg-gray-50 rounded-lg border hover:bg-gray-100 cursor-pointer transition-colors duration-200'
                                        onClick={() => setIsChatOpen(true)}
                                    >
                                        {loadingMessage ? (
                                            <div className='flex items-center space-x-2'>
                                                <div className='w-3 h-3 bg-gray-300 rounded-full animate-pulse'></div>
                                                <span className='text-xs text-gray-500'>Loading last message...</span>
                                            </div>
                                        ) : lastMessage ? (
                                            <div className='flex items-start space-x-2'>
                                                <ChatBubbleLeftIcon className='w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0' />
                                                <div className='min-w-0 flex-1'>
                                                    <p className='text-xs text-gray-700 break-words'>
                                                        "{formatMessagePreview(lastMessage.content)}"
                                                    </p>
                                                    <span className='text-xs text-gray-400'>
                                                        {getTimeAgo(lastMessage.createdAt)}
                                                    </span>
                                                </div>
                                                <span className='text-xs text-blue-500 font-medium'>Click to chat</span>
                                            </div>
                                        ) : (
                                            <div className='flex items-center space-x-2'>
                                                <ChatBubbleLeftIcon className='w-3 h-3 text-gray-400' />
                                                <span className='text-xs text-gray-500'>No messages yet</span>
                                                <span className='text-xs text-blue-500 font-medium ml-auto'>Click to start chat</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {canAccept && (
                        <button
                            className={`
                                relative overflow-hidden font-medium text-sm px-6 py-3 rounded-lg text-white
                                transition-all duration-200 transform hover:scale-105 active:scale-95
                                shadow-lg hover:shadow-xl ml-4 mt-2 self-start min-w-[120px]
                                ${processing 
                                    ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed' 
                                    : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
                                }
                                before:absolute before:inset-0 before:bg-white before:opacity-0 
                                hover:before:opacity-10 before:transition-opacity before:duration-200
                            `}
                            onClick={handleAccept}
                            disabled={processing}
                        >
                            <span className={`transition-opacity duration-200 ${processing ? 'opacity-0' : 'opacity-100'}`}>
                                Accept Offer
                            </span>
                            {processing && (
                                <div className='absolute inset-0 flex items-center justify-center'>
                                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                                    <span className='ml-2 text-sm'>Accepting...</span>
                                </div>
                            )}
                        </button>
                    )}
                </div>

                {status === 'accepted' && userIsItemReceiver && (
                    <div className='space-y-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200'>
                        <label className='block text-sm font-medium text-green-800'>
                            Assign Kudos to Complete
                        </label>
                        <div className='flex space-x-3'>
                            <input
                                type='number'
                                value={kudosValue}
                                onChange={(e) => setKudosValue(e.target.value)}
                                className='border border-green-300 rounded-lg flex-1 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent'
                                placeholder='Enter kudos amount'
                            />
                            <button
                                onClick={handleKudosSubmit}
                                disabled={submitting}
                                className={`
                                    px-6 py-2 rounded-lg text-white font-medium text-sm
                                    transition-all duration-200 transform hover:scale-105 active:scale-95
                                    shadow-md hover:shadow-lg min-w-[100px]
                                    ${submitting
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                                    }
                                `}
                            >
                                {submitting ? (
                                    <div className='flex items-center justify-center'>
                                        <div className='w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2'></div>
                                        Sending...
                                    </div>
                                ) : (
                                    'Submit'
                                )}
                            </button>
                        </div>
                        {error && (
                            <p className='text-sm text-red-600 flex items-center'>
                                <span className='w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2'>!</span>
                                {error}
                            </p>
                        )}
                    </div>
                )}

                {!isSender && status === 'accepted' && (
                    <button
                        onClick={async () => {
                            try {
                                await updateHandshake(handshake.id, { status: 'new' }, token);
                                setStatus('new');
                            }
                            catch (err) {
                                console.error('Failed to undo accept', err);
                                setError('Failed to undo accept');
                            }
                        }}
                        className='bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg'
                    >
                        Undo Accept
                    </button>
                )}

                {error && (
                    <div className='p-3 bg-red-50 border border-red-200 rounded-lg'>
                        <p className='text-sm text-red-700 flex items-center'>
                            <span className='w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2 text-red-600'>!</span>
                            {error}
                        </p>
                    </div>
                )}
            </div>

            {isChatOpen && (
                <ChatModal
                    isChatOpen={isChatOpen}
                    setIsChatOpen={setIsChatOpen}
                    recipientID={otherUserID}
                    initialMessage={
                        handshake.post.type === 'gift'
                            ? "Hey I'd love to give you this, where can we meet?"
                            : "Hey thanks for offering this, where can we meet?"
                    }
                />
            )}
        </>
    );
};

export default HandshakeCard;
