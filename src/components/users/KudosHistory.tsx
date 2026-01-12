import React from 'react';
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

function renderMetadata(item: KudosHistoryDTO) {
    const metadata = (item.metadata ?? {}) as Record<string, unknown>;

    if (item.source === 'donation') {
        const amountLabel = formatCurrencyFromCents(metadata.amount);

        return (
            <>
                {metadata.invoiceID ? (
                    <div className='text-sm text-gray-600'>
                        Invoice ID: {String(metadata.invoiceID)}
                    </div>
                ) : null}
                {amountLabel ? (
                    <div className='text-sm'>Amount: {amountLabel}</div>
                ) : null}
                {metadata.interval ? (
                    <div className='text-sm capitalize'>
                        Interval: {String(metadata.interval)}
                    </div>
                ) : null}
            </>
        );
    }

    if (item.source === 'feedback') {
        return (
            <>
                {metadata.title ? (
                    <div className='text-sm font-medium'>
                        {String(metadata.title)}
                    </div>
                ) : null}
                {metadata.type ? (
                    <div className='text-xs text-gray-600 capitalize'>
                        Type: {String(metadata.type).replace('-', ' ')}
                    </div>
                ) : null}
                {metadata.category ? (
                    <div className='text-xs text-gray-500 capitalize'>
                        Category: {String(metadata.category)}
                    </div>
                ) : null}
            </>
        );
    }

    if (item.source === 'report') {
        return (
            <>
                {metadata.reason ? (
                    <div className='text-sm font-medium'>
                        {String(metadata.reason)}
                    </div>
                ) : null}
                {metadata.status ? (
                    <div className='text-xs text-gray-600 capitalize'>
                        Status: {String(metadata.status)}
                    </div>
                ) : null}
            </>
        );
    }

    if (item.source === 'reward-offer') {
        const kudosOffered = Number(metadata.kudosOffered);
        const hasOffered = Number.isFinite(kudosOffered);

        return (
            <>
                {metadata.status ? (
                    <div className='text-xs text-gray-600 capitalize'>
                        Status: {String(metadata.status)}
                    </div>
                ) : null}
                {typeof item.total === 'number' ? (
                    <div className='text-sm'>Final kudos: {item.total}</div>
                ) : null}
                {typeof item.total !== 'number' && hasOffered ? (
                    <div className='text-sm'>Offered kudos: {kudosOffered}</div>
                ) : null}
            </>
        );
    }

    return null;
}

export default function KudosHistoryList() {
    const { user } = useAuth();
    const userID = user?.id;
    const pageSize = 10;
    const [source, setSource] = React.useState<KudosHistorySourceFilter>('all');

    const {
        data,
        isLoading,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isFetching
    } = useKudosHistoryInfinite(userID, source, pageSize as number);

    const loading = isLoading || (isFetching && !data);
    if (loading) return <Spinner text='Loading kudos history...' />;
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
                <h3 className='text-lg font-semibold'>Kudos history</h3>
                <label className='text-sm text-gray-600 flex items-center gap-2'>
                    <span>Filter:</span>
                    <select
                        className='border rounded px-2 py-1'
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
                        const totalAfter =
                            typeof item.total === 'number'
                                ? item.total
                                : undefined;
                        const deltaLabel =
                            item.delta > 0
                                ? `+${item.delta}`
                                : String(item.delta);
                        const sourceLabel =
                            SOURCE_LABELS[item.source] ?? 'Kudos update';

                        return (
                            <div
                                key={item.id}
                                className='p-3 border rounded space-y-2'
                            >
                                <div className='flex items-center justify-between text-sm text-gray-600'>
                                    <span>{sourceLabel}</span>
                                    <span className='text-xs text-gray-500'>
                                        Log #{item.id}
                                    </span>
                                </div>
                                {item.actor && (
                                    <div className='flex items-center gap-2 text-xs text-gray-500'>
                                        <span>Updated by:</span>
                                        <UserCard
                                            user={item.actor}
                                            triggerVariant='name'
                                            className='text-xs'
                                            panelWidth={280}
                                            disableTooltip={false}
                                        />
                                    </div>
                                )}
                                <div className='flex items-center justify-between'>
                                    <div className='text-lg font-semibold tracking-tight'>
                                        Kudos {deltaLabel}
                                    </div>
                                    {totalAfter !== undefined ? (
                                        <div className='text-xs text-gray-500'>
                                            Total: {totalAfter}
                                        </div>
                                    ) : null}
                                </div>
                                {renderMetadata(item)}
                                {createdAtLabel ? (
                                    <div className='text-xs text-gray-400'>
                                        {createdAtLabel}
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
}
