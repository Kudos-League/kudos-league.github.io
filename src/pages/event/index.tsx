import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getEventDetails } from '@/shared/api/actions';
import EventDetails from '@/components/events/EventDetails';

export default function EventDetailScreen() {
    const { id } = useParams<{ id: string }>();

    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const eventID = Number(id);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await getEventDetails(eventID);
                setEvent(res.data);
            }
            catch (e) {
                console.error('Failed to fetch event', e);
                setError('Failed to load event.');
            }
            finally {
                setLoading(false);
            }
        };

        if (eventID) fetch();
    }, [eventID]);

    if (loading) {
        return <p className='text-center mt-10 text-lg'>Loading event...</p>;
    }

    if (error || !event)
        return (
            <p className='text-center text-red-500'>
                {error || 'Event not found.'}
            </p>
        );

    return <EventDetails event={event} setEvent={setEvent} />;
}
