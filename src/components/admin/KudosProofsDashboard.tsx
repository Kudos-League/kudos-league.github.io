import React from 'react';
import Button from '@/components/common/Button';
import Spinner from '@/components/common/Spinner';
import UserCard from '@/components/users/UserCard';
import { getImagePath } from '@/shared/api/config';
import { timeAgoLabel } from '@/shared/timeAgoLabel';
import {
    useKudosAwardsInfinite,
    type KudosAwardDTO,
    type KudosAwardStatusFilter
} from '@/shared/api/queries/kudosAwards';
import { useVerifyKudosAward } from '@/shared/api/mutations/kudos';

const STATUS_OPTIONS: Array<{
    value: KudosAwardStatusFilter;
    label: string;
}> = [
    { value: 'pending', label: 'Pending' },
    { value: 'verified', label: 'Verified' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'all', label: 'All' }
];

const STATUS_BADGES: Record<string, string> = {
    pending:
        'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    verified:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
};

function AwardCard({ award }: { award: KudosAwardDTO }) {
    const verifyMutation = useVerifyKudosAward();
    const status = award.verificationStatus ?? 'pending';

    const resolve = async (action: 'verify' | 'reject') => {
        if (
            action === 'reject' &&
            !window.confirm(
                `Reject this award? ${award.amount} kudos will be removed from the recipient.`
            )
        ) {
            return;
        }
        await verifyMutation.mutateAsync({ giftID: award.giftID, action });
    };

    return (
        <div
            className='p-4 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 space-y-3'
            data-testid='kudos-proof-card'
        >
            <div className='flex items-start justify-between gap-3'>
                <div className='space-y-1'>
                    <div className='flex items-center gap-2 flex-wrap'>
                        <span className='inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'>
                            {award.amount} Kudos
                        </span>
                        <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                STATUS_BADGES[status] ?? ''
                            }`}
                            data-testid='kudos-proof-status'
                        >
                            {status}
                        </span>
                    </div>
                    {award.title ? (
                        <p className='text-sm font-semibold text-gray-900 dark:text-gray-100 break-words'>
                            “{award.title}”
                        </p>
                    ) : null}
                    {award.description ? (
                        <p className='text-sm text-gray-600 dark:text-gray-400 break-words'>
                            {award.description}
                        </p>
                    ) : null}
                </div>
                <span className='text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap'>
                    {timeAgoLabel(award.createdAt)}
                </span>
            </div>

            <div className='flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 flex-wrap'>
                {award.giver ? (
                    <>
                        <span>from</span>
                        <UserCard
                            user={award.giver as any}
                            triggerVariant='name'
                            className='text-xs'
                        />
                    </>
                ) : null}
                {award.recipient ? (
                    <>
                        <span>to</span>
                        <UserCard
                            user={award.recipient as any}
                            triggerVariant='name'
                            className='text-xs'
                        />
                    </>
                ) : null}
            </div>

            {award.attachments.length ? (
                <div className='flex flex-wrap gap-2'>
                    {award.attachments.map((url, idx) => {
                        const src = getImagePath(url);
                        if (!src) return null;
                        return (
                            <a
                                key={`${url}-${idx}`}
                                href={src}
                                target='_blank'
                                rel='noreferrer'
                            >
                                <img
                                    src={src}
                                    alt={`Evidence ${idx + 1}`}
                                    className='w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-zinc-700'
                                />
                            </a>
                        );
                    })}
                </div>
            ) : (
                <p className='text-xs italic text-gray-400 dark:text-gray-500'>
                    No photographic evidence attached.
                </p>
            )}

            {status === 'pending' && (
                <div className='flex gap-2 pt-1'>
                    <Button
                        variant='success'
                        data-testid='kudos-proof-verify'
                        disabled={verifyMutation.isPending}
                        onClick={() => resolve('verify')}
                    >
                        Verify
                    </Button>
                    <Button
                        variant='danger'
                        data-testid='kudos-proof-reject'
                        disabled={verifyMutation.isPending}
                        onClick={() => resolve('reject')}
                    >
                        Reject & revoke
                    </Button>
                </div>
            )}
        </div>
    );
}

export default function KudosProofsDashboard() {
    const [status, setStatus] =
        React.useState<KudosAwardStatusFilter>('pending');
    const {
        data,
        isLoading,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useKudosAwardsInfinite(status);

    if (isLoading) return <Spinner text='Loading kudos awards…' />;
    if (error)
        return <p className='text-red-600'>Error loading kudos awards</p>;

    const awards = (data?.pages ?? []).flatMap((p) => p.data ?? []);

    return (
        <div className='space-y-4'>
            <div className='flex items-center justify-between gap-3 flex-wrap'>
                <div>
                    <h2 className='text-xl font-semibold'>
                        Kudos award proofs
                    </h2>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                        Peer awards document past gifts or help that happened
                        off the website. Review the evidence; rejecting an
                        award removes the kudos from the recipient.
                    </p>
                </div>
                <label className='text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2'>
                    <span>Status:</span>
                    <select
                        className='border border-gray-200 dark:border-zinc-700 rounded px-3 py-1.5 bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100'
                        value={status}
                        data-testid='kudos-proof-status-filter'
                        onChange={(e) =>
                            setStatus(
                                e.target.value as KudosAwardStatusFilter
                            )
                        }
                    >
                        {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            {!awards.length ? (
                <p className='text-gray-500' data-testid='kudos-proofs-empty'>
                    No kudos awards for this filter.
                </p>
            ) : (
                <div className='space-y-3'>
                    {awards.map((award) => (
                        <AwardCard key={award.giftID} award={award} />
                    ))}
                    {hasNextPage ? (
                        <div className='text-center'>
                            <Button
                                variant='ghost'
                                onClick={() => fetchNextPage()}
                                disabled={isFetchingNextPage}
                            >
                                {isFetchingNextPage
                                    ? 'Loading…'
                                    : 'Load more'}
                            </Button>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}
