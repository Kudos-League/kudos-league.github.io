import React from 'react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HandshakeDTO, PostDTO } from '@/shared/api/types';
import { getImagePath } from '@/shared/api/config';
import { timeAgoLabel } from '@/shared/timeAgoLabel';
import AvatarComponent from '@/components/users/Avatar';
import { useAuth } from '@/contexts/useAuth';
import { apiMutate } from '@/shared/api/apiClient';
import { getHandshakeStage } from '@/shared/handshakeUtils';
import { pushAlert } from '@/components/common/alertBus';
import { useCompleteHandshake, useCreateOffer } from '@/shared/api/mutations/handshakes';

interface MinimalHandshakeCardProps {
    handshake: HandshakeDTO;
    post?: PostDTO;
    onInteraction?: () => void;
}

export default function MinimalHandshakeCard({
    handshake,
    post,
    onInteraction
}: MinimalHandshakeCardProps) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const sender = handshake.sender;

    const [status, setStatus] = useState(handshake.status);
    const [processing, setProcessing] = useState(false);
    const [kudosValue, setKudosValue] = useState('');
    const [showKudosInput, setShowKudosInput] = useState(false);

    const createOfferMutation = useCreateOffer();
    const completeHandshakeMutation = useCompleteHandshake();

    const stage = useMemo(() => {
        const handshakeForStage = {
            ...handshake,
            status,
            post: post || handshake.post
        } as typeof handshake;
        return getHandshakeStage(handshakeForStage, user?.id);
    }, [handshake, status, post, user?.id]);

    const statusColors: Record<string, string> = {
        new: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
        accepted:
            'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
        completed:
            'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
        cancelled:
            'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
    };

    const handleAccept = async () => {
        if (processing || status !== 'new') return;
        setProcessing(true);
        try {
            await apiMutate(`/handshakes/${handshake.id}`, 'patch', {
                status: 'accepted'
            });
            setStatus('accepted');
            pushAlert({ type: 'success', message: 'Accepted!' });
            onInteraction?.();
        }
        catch (err) {
            console.error(err);
            pushAlert({ type: 'danger', message: 'Failed to accept' });
        }
        finally {
            setProcessing(false);
        }
    };

    const handleUndoAccept = async () => {
        if (processing) return;
        setProcessing(true);
        try {
            await apiMutate(`/handshakes/${handshake.id}`, 'patch', {
                status: 'new'
            });
            setStatus('new');
            pushAlert({ type: 'success', message: 'Undone' });
            onInteraction?.();
        }
        catch (err) {
            console.error(err);
            pushAlert({ type: 'danger', message: 'Failed to undo' });
        }
        finally {
            setProcessing(false);
        }
    };

    const handleCancel = async () => {
        if (processing) return;
        setProcessing(true);
        try {
            await apiMutate(`/handshakes/${handshake.id}`, 'patch', {
                status: 'cancelled'
            });
            setStatus('cancelled');
            pushAlert({ type: 'success', message: 'Cancelled' });
            onInteraction?.();
        }
        catch (err) {
            console.error(err);
            pushAlert({ type: 'danger', message: 'Failed to cancel' });
        }
        finally {
            setProcessing(false);
        }
    };

    const handleComplete = async () => {
        if (processing || status === 'completed') return;
        if (!kudosValue || isNaN(Number(kudosValue))) {
            pushAlert({ type: 'danger', message: 'Enter valid kudos amount' });
            return;
        }
        setProcessing(true);
        try {
            await createOfferMutation.mutateAsync({
                postID: handshake.postID,
                kudos: Number(kudosValue),
                currency: 'kudos',
                receiverID: stage.gifterID
            });
            await completeHandshakeMutation.mutateAsync({
                handshakeID: handshake.id,
                postID: handshake.postID
            });
            setStatus('completed');
            setKudosValue('');
            setShowKudosInput(false);
            pushAlert({ type: 'success', message: 'Completed!' });
            onInteraction?.();
        }
        catch (err) {
            console.error(err);
            pushAlert({ type: 'danger', message: 'Failed to complete' });
        }
        finally {
            setProcessing(false);
        }
    };

    const { canAccept, canUndoAccept, canCancel, canComplete, postIsPast } = stage;

    return (
        <div className='flex flex-col gap-1 py-1.5 px-3 bg-gray-50 dark:bg-slate-800/50 border-l-2 border-blue-400 dark:border-blue-500'>
            <div className='flex items-center gap-2'>
                {/* Avatar */}
                <div
                    className='cursor-pointer'
                    onClick={() => sender?.id && navigate(`/user/${sender.id}`)}
                >
                    <AvatarComponent
                        username={
                            sender?.displayName || sender?.username || 'Anonymous'
                        }
                        avatar={sender?.avatar ? getImagePath(sender.avatar) : null}
                        size={24}
                    />
                </div>

                {/* User info */}
                <div className='flex-1 min-w-0'>
                    <span
                        className='text-xs font-medium text-gray-700 dark:text-gray-300 hover:underline cursor-pointer'
                        onClick={() => sender?.id && navigate(`/user/${sender.id}`)}
                    >
                        {sender?.displayName || sender?.username || 'Anonymous'}
                    </span>
                </div>

                {/* Status */}
                <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${statusColors[status] || statusColors.new}`}
                >
                    {status === 'new' ? 'PENDING' : status.toUpperCase()}
                </span>

                {/* Time */}
                <span className='text-[10px] text-gray-400 dark:text-gray-500'>
                    {timeAgoLabel(handshake.createdAt as any)}
                </span>

                {/* Action buttons */}
                {status !== 'completed' && status !== 'cancelled' && !postIsPast && (
                    <div className='flex items-center gap-1'>
                        {canAccept && status === 'new' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleAccept();
                                }}
                                disabled={processing}
                                className='text-[10px] font-medium px-2 py-0.5 rounded bg-green-500 hover:bg-green-600 text-white disabled:opacity-50'
                            >
                                {processing ? '...' : 'Accept'}
                            </button>
                        )}
                        {canUndoAccept && status === 'accepted' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleUndoAccept();
                                }}
                                disabled={processing}
                                className='text-[10px] font-medium px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50'
                            >
                                {processing ? '...' : 'Undo'}
                            </button>
                        )}
                        {canComplete && status === 'accepted' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowKudosInput(!showKudosInput);
                                }}
                                className='text-[10px] font-medium px-2 py-0.5 rounded bg-purple-500 hover:bg-purple-600 text-white'
                            >
                                Give Kudos
                            </button>
                        )}
                        {canCancel && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancel();
                                }}
                                disabled={processing}
                                className='text-[10px] font-medium px-2 py-0.5 rounded bg-red-500 hover:bg-red-600 text-white disabled:opacity-50'
                            >
                                {processing ? '...' : 'Cancel'}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Kudos input row */}
            {showKudosInput && canComplete && status === 'accepted' && (
                <div className='flex items-center gap-2 mt-1 ml-8'>
                    <input
                        type='number'
                        value={kudosValue}
                        onChange={(e) => setKudosValue(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        placeholder='Kudos'
                        className='w-20 text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-slate-700'
                    />
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleComplete();
                        }}
                        disabled={processing}
                        className='text-[10px] font-medium px-2 py-1 rounded bg-green-500 hover:bg-green-600 text-white disabled:opacity-50'
                    >
                        {processing ? '...' : 'Complete'}
                    </button>
                </div>
            )}
        </div>
    );
}
