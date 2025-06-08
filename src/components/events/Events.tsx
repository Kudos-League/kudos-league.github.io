import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventDTO } from '@/shared/api/types';
import { getEvents } from '@/shared/api/actions';
import { useAuth } from '@/hooks/useAuth';
import dayjs from 'dayjs';

export default function EventsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [events, setEvents] = useState<EventDTO[]>([]);
    const [showClosed, setShowClosed] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            const filters: any = {
                endTime: showClosed ? undefined : dayjs().toISOString(),
            };

            try {
                const res = await getEvents(filters);
                const filtered = res.filter((event: EventDTO) => {
                    if (showClosed) {
                        return event.endTime && dayjs(event.endTime).isBefore(dayjs());
                    }
                    return !event.endTime || dayjs(event.endTime).isAfter(dayjs());
                });
                setEvents(filtered);
            }
            catch (e) {
                console.error('Failed to fetch events:', e);
            }
            finally {
                setLoading(false);
            }
        };

        fetch();
    }, [showClosed]);

    return (
        <div className='max-w-4xl mx-auto p-4'>
            <div className='flex justify-between items-center mb-4'>
                <h1 className='text-2xl font-bold'>Events</h1>
                <button
                    onClick={() => navigate('/create-event')}
                    className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'
                >
                    + Create Event
                </button>
            </div>

            <div className='mb-4'>
                <button
                    onClick={() => setShowClosed((prev) => !prev)}
                    className='text-sm text-blue-600 underline'
                >
                    {showClosed ? 'Show Ongoing Events' : 'Show Closed Events'}
                </button>
            </div>

            {loading ? (
                <p className='text-center text-lg'>Loading events...</p>
            ) : events.length > 0 ? (
                <div className='space-y-4'>
                    {events.map((event) => (
                        <div
                            key={event.id}
                            onClick={() => navigate(`/event/${event.id}`)}
                            className='p-4 bg-gray-100 rounded shadow cursor-pointer hover:bg-gray-200'
                        >
                            <h2 className='text-lg font-bold'>{event.title}</h2>
                            <p className='text-gray-600'>{event.description}</p>
                            <p className='text-sm text-gray-500'>
                                {dayjs(event.startTime).format('MMM D, YYYY h:mm A')} –{' '}
                                {event.endTime
                                    ? dayjs(event.endTime).isValid()
                                        ? dayjs(event.endTime).format('MMM D, YYYY h:mm A')
                                        : 'Invalid end time'
                                    : 'Ongoing'}
                            </p>
                            {event.location?.name && (
                                <p className='text-sm text-gray-400 mt-1'>📍 {event.location.name}</p>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className='text-center text-gray-600 italic'>No events found.</p>
            )}
        </div>
    );
}
