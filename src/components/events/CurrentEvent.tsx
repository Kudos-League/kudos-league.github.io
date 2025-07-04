import React, { useEffect, useState } from 'react';
import { EventDTO } from '@/shared/api/types';
import { getEvents } from '@/shared/api/actions';
import dayjs from 'dayjs';
import { useAuth } from '@/hooks/useAuth';
import EventCard from './EventCard';

export default function CurrentEvent() {
    const { user } = useAuth();

    const [events, setEvents] = useState<EventDTO[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [locationFilter, setLocationFilter] = useState(false);
    const [timeFilter, setTimeFilter] = useState<'24h' | '7d' | 'all'>('all');

    const getTimeRange = () => {
        const now = new Date();
        switch (timeFilter) {
        case '24h':
            return {
                startDate: dayjs(now).subtract(1, 'day').toISOString(),
                endDate: dayjs(now).toISOString()
            };
        case '7d':
            return {
                startDate: dayjs(now).subtract(7, 'day').toISOString(),
                endDate: dayjs(now).toISOString()
            };
        default:
            return {};
        }
    };

    useEffect(() => {
        const fetch = async () => {
            if (locationFilter && !user?.location?.name) {
                alert('User has no location set');
                return;
            }

            const timeRange = getTimeRange();
            const filters: any = {
                ...timeRange,
                ...(locationFilter ? { location: user.location.name } : {})
            };

            const response = await getEvents(filters);
            setEvents(response);
            setCurrentIndex(0);
        };

        fetch();
    }, [locationFilter, timeFilter, user?.location?.name]);

    return (
        <div className='my-6 px-4'>
            <h2 className='text-xl font-bold mb-2 text-center'>
                Currently Ongoing Events
            </h2>

            <div className='flex items-center justify-between mb-4'>
                <button
                    onClick={() => setLocationFilter((prev) => !prev)}
                    className={`px-4 py-1 rounded ${
                        locationFilter
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-300'
                    }`}
                >
                    {locationFilter ? 'Local (On)' : 'Local (Off)'}
                </button>

                <select
                    value={timeFilter}
                    onChange={(e) =>
                        setTimeFilter(e.target.value as '24h' | '7d' | 'all')
                    }
                    className='border rounded px-2 py-1'
                >
                    <option value='all'>All Time</option>
                    <option value='24h'>Last 24 Hours</option>
                    <option value='7d'>Last 7 Days</option>
                </select>
            </div>

            {events.length > 0 ? (
                <div className='flex items-center justify-center gap-4 list-none'>
                    <button
                        onClick={() =>
                            setCurrentIndex(
                                (i) => (i - 1 + events.length) % events.length
                            )
                        }
                    >
                        ◀
                    </button>

                    <EventCard event={events[currentIndex]} />

                    <button
                        onClick={() =>
                            setCurrentIndex((i) => (i + 1) % events.length)
                        }
                    >
                        ▶
                    </button>
                </div>
            ) : (
                <p className='text-center text-gray-600 italic mt-4'>
                    No events match your filter.
                </p>
            )}
        </div>
    );
}
