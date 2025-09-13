import React from 'react';
import Spinner from '../common/Spinner';
import { useAuth } from '@/contexts/useAuth';
import { useDonationsInfinite } from '@/shared/api/queries/donations';

function formatRelativeTime(dateString?: string | null) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = Date.now();
    const diff = (date.getTime() - now) / 1000;
    const rtf = new Intl.RelativeTimeFormat(navigator.language || 'en', { numeric: 'auto' });

    const abs = Math.abs(diff);
    if (abs < 60) return rtf.format(Math.round(diff), 'second');
    if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
    if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
    if (abs < 7 * 86400) return rtf.format(Math.round(diff / 86400), 'day');

    return date.toLocaleString();
}

export default function DonationsList() {
    const { user } = useAuth();
    const userID = user?.id;
    const pageSize = 10;
    const {
        data,
        isLoading,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useDonationsInfinite(userID, pageSize as number);

    if (isLoading) return <Spinner text='Loading donations...' />;
    if (error) return <p className='text-red-600'>Error loading donations</p>;

    const pages = (data?.pages ?? []) as Array<{ data: Array<any>; nextCursor?: number; limit: number }>;
    const all = pages.flatMap((p) => p.data ?? []);

    if (!all || all.length === 0) return <p className='text-gray-500'>No donations found.</p>;

    return (
        <div className='space-y-3'>
            {all.map((d) => (
                <div key={d.invoiceID} className='p-3 border rounded'>
                    <div className='text-sm text-gray-600'>ID: {d.invoiceID}</div>
                    <div className='font-medium'>Amount: ${(d.amount ?? 0) / 100}</div>
                    {d.interval && <div className='text-sm'>Interval: {d.interval}</div>}
                    {d.kudos !== undefined && d.kudos !== null && (
                        <div className='text-sm'>Kudos awarded: {d.kudos}</div>
                    )}
                    {d.createdAt && (
                        <div className='text-xs text-gray-400'>
                            {formatRelativeTime(d.createdAt)}
                        </div>
                    )}
                </div>
            ))}

            <div className='text-center'>
                {hasNextPage ? (
                    <button
                        className='px-4 py-2 bg-blue-600 text-white rounded'
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                    >
                        {isFetchingNextPage ? 'Loading...' : 'Load more'}
                    </button>
                ) : (
                    <div className='text-sm text-gray-500'>No more donations</div>
                )}
            </div>
        </div>
    );
}
