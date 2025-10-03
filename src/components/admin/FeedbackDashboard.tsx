import React, { useMemo, useState } from 'react';
import { apiMutate } from '@/shared/api/apiClient';
import Button from '../common/Button';
import RewardKudosModal from './RewardKudosModal';
import UserCard from '../users/UserCard';
import { FeedbackDTO, FeedbackStatus } from '@/shared/api/types';
import { getImagePath } from '@/shared/api/config';

type Props = {
    feedbacks: FeedbackDTO[];
    setFeedbacks: React.Dispatch<React.SetStateAction<FeedbackDTO[]>>;
};

export default function FeedbackDashboard({ feedbacks, setFeedbacks }: Props) {
    const [rewardOpenFor, setRewardOpenFor] = useState<number | null>(null);

    const statusOptions: Array<{ value: FeedbackStatus; label: string }> = useMemo(
        () => [
            { value: 'new', label: 'New' },
            { value: 'resolved', label: 'Resolved' },
            { value: 'archived', label: 'Archived' }
        ],
        []
    );

    const handleDelete = async (id: number) => {
        try {
            await apiMutate<void, void>(`/feedback/${id}`, 'delete');
            setFeedbacks((prev) => prev.filter((f) => f.id !== id));
        }
        catch (err) {
            console.error('Failed to delete feedback:', err);
            alert('Error deleting feedback');
        }
    };

    const updateLocal = (id: number, patch: Partial<FeedbackDTO>) =>
        setFeedbacks((prev) =>
            prev.map((f) => (f.id === id ? { ...f, ...patch } : f))
        );

    const setStatus = async (id: number, status: FeedbackStatus) => {
        try {
            await apiMutate<void, { status: string }>(`/feedback/${id}`, 'put', {
                status
            });
            updateLocal(id, { status });
        }
        catch (err) {
            console.error('Failed to update feedback:', err);
            alert('Error updating feedback');
        }
    };

    const resolveWithReward = async (id: number, rewardKudos: number) => {
        try {
            await apiMutate<void, { rewardKudos: number }>(
                `/feedback/${id}/resolve`,
                'put',
                { rewardKudos }
            );
            updateLocal(id, { status: 'resolved', rewardKudos });
        }
        catch (err) {
            console.error('Failed to resolve feedback:', err);
            alert('Error resolving feedback');
        }
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
                    {feedbacks.map((fb) => {
                        const attachments = fb.attachments ?? [];
                        const tags = fb.tags ?? [];
                        const totalAwarded = (fb.rewardKudos ?? 0) + fb.baseRewardKudos;
                        const statusLabel =
                            statusOptions.find((option) => option.value === fb.status)?.label ??
                            fb.status;
                        const typeLabel =
                            fb.type === 'bug-report' ? 'Bug report' : 'Site feedback';
                        const categoryLabel = fb.category.replace(/-/g, ' ');

                        return (
                            <div
                                key={fb.id}
                                className='p-4 rounded shadow-sm
                                       light:bg-gray-50 light:border light:border-gray-200
                                       dark:bg-neutral-800/60 dark:border dark:border-neutral-700'
                            >
                                <div className='flex justify-between items-start gap-4'>
                                    <div>
                                        <div className='flex flex-col gap-1'>
                                            <p className='text-sm light:text-gray-600 dark:text-neutral-300'>
                                            Submitted by{' '}
                                                <span className='font-medium'>
                                                    <UserCard user={fb.user} />
                                                </span>
                                            </p>
                                            <div className='text-xs uppercase tracking-wide text-teal-600 dark:text-teal-400 font-semibold'>
                                                {typeLabel} • Category: {categoryLabel}
                                            </div>
                                            <h3 className='text-lg font-semibold light:text-gray-900 dark:text-neutral-100'>
                                                {fb.title}
                                            </h3>
                                            <p className='whitespace-pre-wrap light:text-gray-700 dark:text-neutral-200'>
                                                {fb.description}
                                            </p>
                                        </div>

                                        {tags.length > 0 && (
                                            <div className='mt-3 flex flex-wrap gap-2'>
                                                {tags.map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className='rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
                                                    >
                                                    #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {attachments.length > 0 && (
                                            <div className='mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3'>
                                                {attachments.map((url) => {
                                                    const src = getImagePath(url);
                                                    return (
                                                        <a
                                                            key={url}
                                                            href={src ?? url}
                                                            target='_blank'
                                                            rel='noreferrer'
                                                            className='block overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700'
                                                        >
                                                            {src ? (
                                                                <img
                                                                    src={src}
                                                                    alt='Attachment preview'
                                                                    className='h-24 w-full object-cover'
                                                                />
                                                            ) : (
                                                                <span className='block px-2 py-4 text-xs text-center text-zinc-500 dark:text-zinc-300'>
                                                                    {url}
                                                                </span>
                                                            )}
                                                        </a>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        <div className='mt-3 text-sm flex flex-wrap gap-4'>
                                            <span className='light:text-gray-600 dark:text-neutral-300'>
                                            Status: {statusLabel}
                                            </span>
                                            <span className='light:text-gray-600 dark:text-neutral-300'>
                                            Base kudos: {fb.baseRewardKudos}
                                            </span>
                                            <span className='light:text-gray-600 dark:text-neutral-300'>
                                            Additional kudos:{' '}
                                                {typeof fb.rewardKudos === 'number'
                                                    ? fb.rewardKudos
                                                    : '—'}
                                            </span>
                                            <span className='font-medium text-teal-600 dark:text-teal-300'>
                                            Total awarded: {totalAwarded}
                                            </span>
                                        </div>
                                    </div>

                                    <div className='flex flex-col items-end gap-2 text-sm'>
                                        <div className='inline-flex gap-2'>
                                            {statusOptions.map((option) => (
                                                <Button
                                                    key={option.value}
                                                    variant={fb.status === option.value ? 'primary' : 'ghost'}
                                                    onClick={() => setStatus(fb.id, option.value)}
                                                >
                                                    {option.label}
                                                </Button>
                                            ))}
                                        </div>
                                        <div className='inline-flex gap-2'>
                                            <Button
                                                variant='success'
                                                onClick={() => setRewardOpenFor(fb.id)}
                                            >
                                            Add kudos & resolve
                                            </Button>
                                            <Button
                                                variant='danger'
                                                onClick={() => handleDelete(fb.id)}
                                            >
                                            Delete
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <RewardKudosModal
                                    open={rewardOpenFor === fb.id}
                                    reportId={fb.id}
                                    current={fb.rewardKudos ?? null}
                                    baseReward={fb.baseRewardKudos}
                                    onClose={() => setRewardOpenFor(null)}
                                    onSave={(k) => resolveWithReward(fb.id, k)}
                                />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
