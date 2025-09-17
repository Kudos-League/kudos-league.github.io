import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiGet } from '@/shared/api/apiClient';
import EventDetails from '@/components/events/EventDetails';

export default function EventDetailScreen() {
    const { id } = useParams<{ id: string }>();

    const [event, setEvent] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEvent = async (eventID: number) => {
        try {
            const data = await apiGet(`/events/${eventID}`);
            setEvent(data);
            setLoading(false);
        }
        catch (err: any) {
            console.error(err);
            setError(err?.message || 'Failed to load event.');
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchEvent(Number(id));
    }, [id]);

    if (loading) {
        return <p className='text-center mt-10 text-lg'>Loading event...</p>;
    }

    if (error || !event)
        return (
            <p className='text-center text-red-500'>
                {error ? (error as any).message : 'Event not found.'}
            </p>
        );

    return <EventDetails event={event} setEvent={setEvent} />;
}
