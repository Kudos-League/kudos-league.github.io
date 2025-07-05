import React, { useEffect, useState } from 'react';
import Events from '@/components/events/Events';
import { getEvents } from '@/shared/api/actions';
import { EventDTO } from '@/shared/api/types';

export default function EventsPage() {
    const [events, setEvents] = useState<EventDTO[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await getEvents({ filter: 'all' });
                setEvents(res);
            }
            catch (e) {
                console.error('Failed to fetch events:', e);
            }
            finally {
                setLoading(false);
            }
        };

        fetch();
    }, []);

    if (loading) {
        return (
            <p className="text-center text-lg">Loading events...</p>
        )
    }

    return (
        <Events events={events} />
    );
}

