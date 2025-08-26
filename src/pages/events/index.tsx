import React from 'react';
import Events from '@/components/events/Events';
import { useEvents } from '@/shared/api/queries/events';

export default function EventsPage() {
    const { data: events, isLoading, error } = useEvents({ filter: 'all' });

    if (isLoading) {
        return <p className="text-center text-lg">Loading events...</p>;
    }

    if (error) {
        return (
            <p className="text-center text-red-600">
                Failed to fetch events
            </p>
        );
    }

    return <Events events={events ?? []} />;
}