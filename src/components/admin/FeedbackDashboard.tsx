import React, { useState } from 'react';
import { useAuth } from '@/contexts/useAuth';
import {
    deleteFeedback,
    updateFeedback,
    resolveFeedback
} from '@/shared/api/actions';
import Button from '../common/Button';
import RewardKudosModal from './RewardKudosModal';
import UserCard from '../users/UserCard';

type Props = {
    feedbacks: any[];
    setFeedbacks: React.Dispatch<React.SetStateAction<any[]>>;
};

export default function FeedbackDashboard({ feedbacks, setFeedbacks }: Props) {
    const { token } = useAuth();
    const [rewardOpenFor, setRewardOpenFor] = useState<number | null>(null);

    const handleDelete = async (id: number) => {
        try {
            await deleteFeedback(id, token);
            setFeedbacks((prev) => prev.filter((f) => f.id !== id));
        }
        catch (err) {
            console.error('Failed to delete feedback:', err);
            alert('Error deleting feedback');
        }
    };

    const updateLocal = (id: number, patch: any) =>
        setFeedbacks((prev) =>
            prev.map((f) => (f.id === id ? { ...f, ...patch } : f))
        );

    const setStatus = async (
        id: number,
        status: 'ignored' | 'resolved' | 'new'
    ) => {
        try {
            await updateFeedback(id, { status }, token);
            updateLocal(id, { status });
        }
        catch (err) {
            console.error('Failed to update feedback:', err);
            alert('Error updating feedback');
        }
    };

    const resolveWithReward = async (id: number, rewardKudos: number) => {
        await resolveFeedback(id, rewardKudos, token);
        updateLocal(id, { status: 'resolved', rewardKudos });
    };

    return (
        <div
            className='max-w-4xl mx-auto p-6
                       light:text-gray-900 dark:text-neutral-100'
        >
            <h1 className='text-2xl font-bold mb-4'>User Feedback</h1>

            {feedbacks.length === 0 ? (
                <p className='light:text-gray-600 dark:text-neutral-400'>
                    No feedback found.
                </p>
            ) : (
                <div className='space-y-4'>
                    {feedbacks.map((fb) => (
                        <div
                            key={fb.id}
                            className='p-4 rounded shadow-sm
                                       light:bg-gray-50 light:border light:border-gray-200
                                       dark:bg-neutral-800/60 dark:border dark:border-neutral-700'
                        >
                            <div className='flex justify-between items-start gap-4'>
                                <div>
                                    <p className='text-sm light:text-gray-600 dark:text-neutral-300'>
                                        Submitted by{' '}
                                        <span className='font-medium'>
                                            <UserCard user={fb.user} />
                                        </span>
                                    </p>
                                    <p className='font-semibold'>
                                        User ID: {fb.userId ?? fb.userID}
                                    </p>
                                    <p className='whitespace-pre-wrap light:text-gray-700 dark:text-neutral-200'>
                                        {fb.content}
                                    </p>
                                    <div className='mt-1 text-sm flex flex-wrap gap-3'>
                                        {fb.status && (
                                            <span className='light:text-gray-600 dark:text-neutral-300'>
                                                Status: {fb.status}
                                            </span>
                                        )}
                                        <span className='light:text-gray-600 dark:text-neutral-300'>
                                            Reward kudos:{' '}
                                            {typeof fb.rewardKudos === 'number'
                                                ? fb.rewardKudos
                                                : '—'}
                                        </span>
                                    </div>
                                </div>

                                <div className='flex gap-2 text-sm'>
                                    <Button
                                        onClick={() =>
                                            setStatus(fb.id, 'ignored')
                                        }
                                    >
                                        Ignore
                                    </Button>
                                    <Button
                                        variant='success'
                                        onClick={() => setRewardOpenFor(fb.id)}
                                    >
                                        Resolve
                                    </Button>
                                    <Button
                                        variant='danger'
                                        onClick={() => handleDelete(fb.id)}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>

                            <RewardKudosModal
                                open={rewardOpenFor === fb.id}
                                reportId={fb.id}
                                current={fb.rewardKudos ?? null}
                                onClose={() => setRewardOpenFor(null)}
                                onSave={(k) => resolveWithReward(fb.id, k)}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
