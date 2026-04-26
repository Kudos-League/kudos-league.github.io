import React from 'react';
import { useNavigate } from 'react-router-dom';
import Spinner from '../common/Spinner';
import { useAuth } from '@/contexts/useAuth';
import {
    useKudosHistoryInfinite,
    type KudosHistoryDTO,
    type KudosHistorySourceFilter
} from '@/shared/api/queries/kudosHistory';
import { timeAgoLabel } from '@/shared/timeAgoLabel';
import UserCard from './UserCard';

const FILTER_OPTIONS: Array<{
    value: KudosHistorySourceFilter;
    label: string;
}> = [
    { value: 'all', label: 'All activity' },
    { value: 'donation', label: 'Donations' },
    { value: 'feedback', label: 'Feedback' },
    { value: 'report', label: 'Bug reports' },
    { value: 'reward-offer', label: 'Reward offers' }
];

const SOURCE_LABELS: Record<KudosHistoryDTO['source'], string> = {
    donation: 'Donation',
    feedback: 'Feedback',
    report: 'Bug report',
    'reward-offer': 'Reward offer',
    other: 'Kudos update'
};

function formatCurrencyFromCents(value?: unknown) {
    const cents = typeof value === 'number' ? value : Number(value ?? NaN);
    if (!Number.isFinite(cents)) return undefined;

    return (cents / 100).toLocaleString(undefined, {
        style: 'currency',
        currency: 'USD'
    });
}

function renderDetail(item: KudosHistoryDTO): React.ReactNode {
    const metadata = (item.metadata ?? {}) as Record<string, unknown>;

    if (item.source === 'donation') {
        const amountLabel = formatCurrencyFromCents(metadata.amount);
        const parts = [
            amountLabel ? `${amountLabel} donated` : null,
            metadata.interval ? String(metadata.interval) : null
        ].filter(Boolean) as string[];
        if (!parts.length) return null;
        return (
            <p className='text-sm text-gray-700 dark:text-gray-300'>
                {parts.join(' · ')}
            </p>
        );
    }

    if (item.source === 'feedback') {
        const title = metadata.title ? String(metadata.title) : null;
        const type = metadata.type ? String(metadata.type).replace('-', ' ') : null;
        if (!title && !type) return null;
        return (
            <div className='space-y-0.5'>
                {title ? (
                    <p className='text-sm font-medium text-gray-800 dark:text-gray-200 break-words'>
                        “{title}”
                    </p>
                ) : null}
                {type ? (
                    <p className='text-xs text-gray-500 capitalize'>{type}</p>
                ) : null}
            </div>
        );
    }

    if (item.source === 'report') {
        if (!metadata.reason) return null;
        return (
            <p className='text-sm text-gray-700 dark:text-gray-300 break-words'>
                Reason: {String(metadata.reason)}
            </p>
        );
    }

    if (item.source === 'reward-offer') {
        const title = metadata.postTitle ? String(metadata.postTitle) : null;
        const postType = metadata.postType ? String(metadata.postType) : null;
        const giftType = metadata.postGiftType ? String(metadata.postGiftType) : null;
        const body = metadata.body ? String(metadata.body) : null;
        const isReceived = item.delta > 0;

        let phrase: string | null = null;
        if (giftType === 'digital') {
            phrase = isReceived
                ? 'for sharing a digital gift'
                : 'You gave kudos for a digital gift';
        }
        else if (postType === 'request') {
            phrase = isReceived ? 'for helping with a request' : 'You gave kudos for help received';
        }
        else if (postType === 'gift') {
            phrase = isReceived ? 'for receiving a gift' : 'You gave kudos for a gift';
        }
        else {
            phrase = isReceived ? 'Kudos received' : 'Kudos given';
        }

        return (
            <div className='space-y-0.5'>
                <p className='text-sm text-gray-700 dark:text-gray-300'>{phrase}</p>
                {title ? (
                    <p className='text-sm font-semibold text-gray-900 dark:text-gray-100 break-words'>
                        “{title}”
                    </p>
                ) : null}
                {body ? (
                    <p className='text-xs text-gray-500 dark:text-gray-400 italic break-words'>
                        “{body}”
                    </p>
                ) : null}
            </div>
        );
    }

    return null;
}

function getMetaPostID(item: KudosHistoryDTO): number | undefined {
    const meta = (item.metadata ?? {}) as Record<string, unknown>;
    const raw = meta.postID ?? meta.postId ?? meta.post_id;
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
    if (typeof raw === 'string' && /^\d+$/.test(raw)) return Number(raw);
    return undefined;
}

type KudosHistoryListProps = {
    userID?: number;
};

export default React.memo(function KudosHistoryList({
    userID: userIDProp
}: KudosHistoryListProps = {}) {
    const { user } = useAuth();
    const userID = userIDProp ?? user?.id;
    const navigate = useNavigate();
    const pageSize = 10;
    const [source, setSource] = React.useState<KudosHistorySourceFilter>('all');

    const {
        data,
        isLoading,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useKudosHistoryInfinite(userID, source, pageSize as number);

    // Only show loading spinner for initial load, not for background refetches
    if (isLoading) return <Spinner text='Loading kudos history...' />;
    if (error)
        return <p className='text-red-600'>Error loading kudos history</p>;

    const pages = (data?.pages ?? []) as Array<{
        data: KudosHistoryDTO[];
        nextCursor?: number;
        limit: number;
    }>;
    const all = pages.flatMap((p) => p.data ?? []);

    return (
        <div className='space-y-4'>
            <div className='flex items-center justify-between gap-3 flex-wrap'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                    Kudos history
                </h3>
                <label className='text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2'>
                    <span>Filter:</span>
                    <select
                        className='border border-gray-200 dark:border-zinc-700 rounded px-3 py-1.5 bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-600 dark:focus:ring-brand-400 focus:border-transparent'
                        value={source}
                        onChange={(event) =>
                            setSource(
                                event.target.value as KudosHistorySourceFilter
                            )
                        }
                    >
                        {FILTER_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            {!all.length ? (
                <p className='text-gray-500'>
                    No kudos history found for this filter.
                </p>
            ) : (
                <div className='space-y-3'>
                    {all.map((item) => {
                        const createdAtLabel = item.createdAt
                            ? timeAgoLabel(item.createdAt)
                            : undefined;
                        const isPositive = item.delta > 0;
                        const deltaLabel = isPositive
                            ? `+${item.delta}`
                            : String(item.delta);
                        const sourceLabel =
                            SOURCE_LABELS[item.source] ?? 'Kudos update';
                        const postID = getMetaPostID(item);
                        const navigable = !!postID;
                        const detail = renderDetail(item);

                        return (
                            <div
                                key={item.id}
                                onClick={
                                    navigable
                                        ? () => navigate(`/post/${postID}`)
                                        : undefined
                                }
                                className={`p-3 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 ${
                                    navigable
                                        ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/60 transition-colors'
                                        : ''
                                }`}
                            >
                                <div className='flex items-start justify-between gap-3'>
                                    <div className='flex items-center gap-2'>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-semibold ${
                                                isPositive
                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                    : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                            }`}
                                        >
                                            {deltaLabel} Kudos
                                        </span>
                                        <span className='text-xs text-gray-500 dark:text-gray-400'>
                                            {sourceLabel}
                                        </span>
                                    </div>
                                    {createdAtLabel ? (
                                        <span className='text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap'>
                                            {createdAtLabel}
                                        </span>
                                    ) : null}
                                </div>

                                {item.actor ? (
                                    <div
                                        className='mt-2 flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400'
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <span>from</span>
                                        <UserCard
                                            user={item.actor}
                                            triggerVariant='name'
                                            className='text-xs'
                                            panelWidth={280}
                                            disableTooltip={false}
                                        />
                                    </div>
                                ) : null}

                                {detail ? <div className='mt-2'>{detail}</div> : null}

                                {navigable ? (
                                    <div className='mt-2 text-xs font-medium text-brand-600 dark:text-brand-400'>
                                        View post →
                                    </div>
                                ) : null}
                            </div>
                        );
                    })}
                    <div className='text-center pt-1'>
                        {hasNextPage ? (
                            <button
                                className='px-4 py-2 bg-blue-600 text-white rounded'
                                onClick={() => fetchNextPage()}
                                disabled={isFetchingNextPage}
                            >
                                {isFetchingNextPage
                                    ? 'Loading...'
                                    : 'Load more'}
                            </button>
                        ) : (
                            <div className='text-sm text-gray-500'>
                                No more entries
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
});
