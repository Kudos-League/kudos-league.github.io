import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Tippy from '@tippyjs/react';
import { XMarkIcon } from '@heroicons/react/24/solid';

import {
    getUserDetails,
    updateHandshake,
    createRewardOffer,
    deleteHandshake
} from '@/shared/api/actions';
import type { HandshakeDTO, UserDTO } from '@/shared/api/types';
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

    const imageSrc = handshake.post.images?.[0]
        ? getEndpointUrl() + handshake.post.images[0]
        : undefined;

    const showBodyInImageBox =
    imgError || !handshake.post.images?.length || !imageSrc;

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

    const handleAccept = async () => {
        if (status !== 'new') return;
        setProcessing(true);
        try {
            await updateHandshake(handshake.id, { status: 'accepted' }, token);
            setStatus('accepted');
            setIsChatOpen(true);
        }
        catch (err) {
            console.error(err);
            setError(err.toString());
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
                kudos: Number(kudosValue)
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

    return (
        <>
            <div className={`border p-4 rounded shadow bg-white ${showPostDetails && 'space-y-3'}`}>
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
                            className={`text-xs px-2 py-1 rounded-full text-white ${
                                status === 'new'
                                    ? 'bg-yellow-500'
                                    : status === 'accepted'
                                        ? 'bg-blue-600'
                                        : 'bg-green-600'
                            }`}
                        >
                            {status}
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
                                    className="text-red-600 hover:text-red-800"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </Tippy>
                        )}
                    </div>
                </div>

                <div className='flex items-start justify-between'>
                    {showPostDetails && (
                        <div className='flex space-x-4'>
                            <div
                                onClick={() => navigate(`/post/${handshake.postID}`)}
                                className='w-20 h-20 flex-shrink-0 cursor-pointer'
                            >
                                {showBodyInImageBox ? (
                                    <div className='w-full h-full bg-gray-100 text-xs text-gray-600 rounded flex items-center justify-center text-center p-2 overflow-hidden'>
                                        {handshake.post.body.slice(0, 60)}…
                                    </div>
                                ) : (
                                    <img
                                        src={imageSrc}
                                        alt={handshake.post.title}
                                        className='w-full h-full object-cover rounded'
                                        onError={() => setImgError(true)}
                                    />
                                )}
                            </div>

                            <div className='flex flex-col justify-between'>
                                <span
                                    className='text-blue-600 underline cursor-pointer'
                                    onClick={() => navigate(`/post/${handshake.postID}`)}
                                >
                                    {handshake.post.title}
                                </span>
                                <p className='text-sm text-gray-500'>
                                    Created: {new Date(handshake.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    )}

                    {userID === handshake.receiverID && status === 'new' && (
                        <button
                            className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ml-4 self-start'
                            onClick={async () => {
                                await handleAccept();
                                setIsChatOpen(true);
                            }}
                            disabled={processing}
                        >
                            {processing ? 'Accepting...' : 'Accept'}
                        </button>
                    )}
                </div>

                {status === 'accepted' &&
                ((handshake.post.type === 'request' && isSender) ||
                    (handshake.post.type === 'gift' &&
                        handshake.senderID === userID)) && (
                    <div className='space-y-2'>
                        <label className='block text-sm font-medium'>
                            Assign Kudos
                        </label>
                        <input
                            type='number'
                            value={kudosValue}
                            onChange={(e) => setKudosValue(e.target.value)}
                            className='border rounded w-full px-2 py-1'
                            placeholder='Enter kudos'
                        />
                        <button
                            onClick={handleKudosSubmit}
                            disabled={submitting}
                            className='bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700'
                        >
                            {submitting ? 'Submitting...' : 'Submit'}
                        </button>
                        {error && (
                            <p className='text-sm text-red-500'>{error}</p>
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
                        className='mt-2 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600'
                    >
                        Undo Accept
                    </button>
                )}
            </div>

            {isChatOpen && (
                <ChatModal
                    isChatOpen={isChatOpen}
                    setIsChatOpen={setIsChatOpen}
                    recipientID={handshake.receiverID}
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
