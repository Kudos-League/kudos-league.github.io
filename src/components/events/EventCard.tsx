import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EventDTO } from '@/shared/api/types';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

type Props = {
    event: EventDTO;
};

export default function EventCard({ event }: Props) {
    const navigate = useNavigate();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const start = toZonedTime(new Date(event.startTime), tz);
    const end = event.endTime ? toZonedTime(new Date(event.endTime), tz) : null;

    return (
        <li
            onClick={() => navigate(`/event/${event.id}`)}
            className='p-3 rounded shadow hover:shadow-md cursor-pointer text-center border border-slate-300 bg-slate-100 hover:bg-slate-200 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors'
        >
            <p className='font-bold text-lg text-gray-900 dark:text-gray-100'>
                {event.title}
            </p>

            {event.description && (
                <p className='text-gray-600 text-sm mb-1'>
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
        </li>
    );
}
