import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventDTO } from '@/shared/api/types';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { getImagePath } from '@/shared/api/config';
import { apiGet } from '@/shared/api/apiClient';

type Props = {
    event: EventDTO;
    isRecurring?: boolean;
};

export default function EventCard({ event, isRecurring = false }: Props) {
    const navigate = useNavigate();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const [creator, setCreator] = useState<UserDTO | null>(null);
    const [loadingCreator, setLoadingCreator] = useState(false);

    const start = toZonedTime(new Date(event.startTime), tz);
    const end = event.endTime ? toZonedTime(new Date(event.endTime), tz) : null;

    // Get creator ID from various possible field names
    const creatorId = (event as any).userId || 
                     (event as any).creatorId || 
                     (event as any).creatorID ||
                     (event as any).authorId || 
                     (event as any).ownerId ||
                     (event as any).createdBy;

    useEffect(() => {
        const fetchCreator = async () => {
            if (!creatorId) return;

            setLoadingCreator(true);
            try {
                const fetchedUser = await apiGet<UserDTO>(`/users/${creatorId}`);
                setCreator(fetchedUser);
            }
            catch (error) {
                console.error('Failed to fetch event creator:', error);
                setCreator(null);
            }
            finally {
                setLoadingCreator(false);
            }
        };

        fetchCreator();
    }, [creatorId]);

    return (
        <li
            onClick={() => navigate(`/event/${event.id}`)}
            className='p-3 rounded shadow hover:shadow-md cursor-pointer text-center border border-slate-300 bg-slate-100 hover:bg-slate-200 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors'
        >
            <div className='flex items-center justify-center gap-2 flex-wrap text-center mb-1'>
                <p className='font-bold text-lg text-gray-900 dark:text-gray-100'>
                    {event.title}
                </p>
                {isRecurring && (
                    <span className='inline-flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white'>
                        ↻ Recurring
                    </span>
                )}
            </div>

            {event.description && (
                <p className='text-gray-600 dark:text-gray-400 text-sm mb-1'>
                    {event.description}
                </p>
            )}

            <p className='text-sm text-gray-500'>
                {format(start, 'MMM d, yyyy h:mm a')} –{' '}
                {end ? format(end, 'MMM d, yyyy h:mm a') : 'Ongoing'}
            </p>

            {event.location?.global ? (
                event.link ? (
                    <div className='mt-1'>
                        <a
                            href={event.link}
                            target='_blank'
                            rel='noopener noreferrer'
                            onClick={(e) => e.stopPropagation()}
                            className='inline-block text-sm text-blue-600 underline'
                        >
                            🔗 Join Link
                        </a>
                    </div>
                ) : (
                    <p className='text-sm text-gray-400 mt-1'>🌐 Online</p>
                )
            ) : event.location?.name ? (
                <p className='text-sm text-gray-400'>
                    📍 {event.location.name}
                </p>
            ) : null}

            {typeof event.participantCount === 'number' && (
                <p className='text-sm text-blue-600 dark:text-blue-400'>
                    👥 {event.participantCount} participant
                    {event.participantCount !== 1 ? 's' : ''}
                </p>
            )}

            {creatorId && (
                <div className='mt-2 pt-2 border-t border-gray-300 dark:border-gray-600 flex items-center justify-center gap-2'>
                    {loadingCreator ? (
                        <p className='text-xs text-gray-400 italic'>Loading creator...</p>
                    ) : creator ? (
                        <>
                            {creator.avatar && (
                                <img
                                    src={getImagePath(creator.avatar)}
                                    alt={creator.username}
                                    className='w-6 h-6 rounded-full object-cover'
                                />
                            )}
                            <p className='text-xs text-gray-500 dark:text-gray-400'>
                                Created by <span className='font-semibold'>{creator.username}</span>
                            </p>
                        </>
                    ) : null}
                </div>
            )}
        </li>
    );
}