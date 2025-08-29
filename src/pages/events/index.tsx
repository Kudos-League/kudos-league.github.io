import React from 'react';
import Events from '@/components/events/Events';
import { QueryBoundary } from '@/components/common/QueryBoundary';
import { useEvents } from '@/shared/api/queries/events';
import useAuthRedirect from '@/hooks/useAuthRedirect';

function EventsContent() {
    const { data: events } = useEvents({ filter: 'all' });
    return <Events events={events} />;
}

export default function EventsPage() {
    const { isAuthorized, loading: authLoading } = useAuthRedirect();

    // Don't render anything while auth is loading or if not authorized (redirect will happen)
    if (authLoading || !isAuthorized) {
        return null;
    }

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
