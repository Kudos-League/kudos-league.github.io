import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useEvent } from '@/shared/api/queries/events';
import EventDetails from '@/components/events/EventDetails';

export default function EventDetailScreen() {
    const { id } = useParams<{ id: string }>();

    const eventID = Number(id);
    const { data: event, isLoading, error } = useEvent(eventID);

    if (isLoading) {
        return <p className='text-center mt-10 text-lg'>Loading event...</p>;
    }

    if (error || !event)
        return (
            <p className='text-center text-red-500'>
                {error ? (error as any).message : 'Event not found.'}
            </p>
        );

    // TODO: implement setEvent to allow editing
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return <EventDetails event={event} setEvent={() => {}} />;
}
