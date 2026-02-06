import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Events from '@/components/events/EventsCalendar';
import { QueryBoundary } from '@/components/common/QueryBoundary';
import PullToRefresh from '@/components/common/PullToRefresh';
import { useEvents } from '@/shared/api/queries/events';

function EventsContent() {
    const { data: events } = useEvents({ filter: 'all' });
    const queryClient = useQueryClient();
    const handleRefresh = useCallback(
        () => queryClient.invalidateQueries({ queryKey: ['events'] }),
        [queryClient]
    );

    return (
        <PullToRefresh onRefresh={handleRefresh}>
            <Events events={events} />
        </PullToRefresh>
    );
}

export default function EventsPage() {
    return (
        <QueryBoundary
            fallback={<p className='text-center text-lg'>Loading events…</p>}
            errorFallback={(err, reset) => (
                <div className='p-4 bg-red-50 text-red-700 rounded text-center'>
                    {String((err as any)?.message ?? 'Failed to fetch events')}
                    <button className='ml-2 underline' onClick={reset}>
                        Retry
                    </button>
                </div>
            )}
        >
            <EventsContent />
        </QueryBoundary>
    );
}
