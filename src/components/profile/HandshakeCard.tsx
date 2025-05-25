import React, { useEffect, useState } from 'react';
import {
    getUserDetails,
    updateHandshake,
    createRewardOffer
} from 'shared/api/actions';
import type { HandshakeDTO, UserDTO } from 'shared/api/types';
import type { CreateRewardOfferDTO } from 'shared/api/types';
import { useNavigate } from 'react-router-dom';

interface Props {
    handshake: HandshakeDTO;
    userId: string;
    token: string;
}

const HandshakeCard: React.FC<Props> = ({ handshake, userId, token }) => {
    const navigate = useNavigate();

    const isSender = handshake.senderID.toString() === userId;
    const [status, setStatus] = useState(handshake.status);
    const [processing, setProcessing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [kudosValue, setKudosValue] = useState('');
    const [error, setError] = useState<string | null>(null);

    const [senderUser, setSenderUser] = useState<UserDTO | null>(null);
    const [receiverUser, setReceiverUser] = useState<UserDTO | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const [sender, receiver] = await Promise.all([
                    getUserDetails(handshake.senderID.toString(), token),
                    getUserDetails(handshake.receiverID.toString(), token)
                ]);
                setSenderUser(sender);
                setReceiverUser(receiver);
            }
            catch (err) {
                console.error('Error loading user info', err);
            }
        };
        fetchUsers();
    }, [handshake, token]);

    const handleAccept = async () => {
        if (status !== 'new') return;
        setProcessing(true);
        try {
            await updateHandshake(handshake.id, { status: 'accepted' }, token);
            setStatus('accepted');
        }
        catch (err) {
            console.error(err);
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
        <div className='border p-4 rounded shadow bg-white space-y-3'>
            <div className='flex justify-between'>
                <span className='font-semibold'>
                    {isSender ? 'You sent to' : 'Received from'}{' '}
                    {isSender ? receiverUser?.username : senderUser?.username}
                </span>
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
            </div>

            <div>
                <span
                    className='text-blue-600 underline cursor-pointer'
                    onClick={() => navigate(`/post/${handshake.postID}`)}
                >
                    View Post
                </span>
                <p className='text-sm text-gray-500'>
                    Created:{' '}
                    {new Date(handshake.createdAt).toLocaleDateString()}
                </p>
            </div>

            {!isSender && status === 'new' && (
                <button
                    className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'
                    onClick={handleAccept}
                    disabled={processing}
                >
                    {processing ? 'Accepting...' : 'Accept'}
                </button>
            )}

            {status === 'accepted' &&
                ((handshake.post.type === 'request' && isSender) ||
                    (handshake.post.type === 'gift' &&
                        handshake.senderID.toString() === userId)) && (
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
        </div>
    );
};

export default HandshakeCard;
