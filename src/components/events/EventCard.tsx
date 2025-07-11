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
            className="p-3 rounded shadow hover:bg-gray-100 cursor-pointer text-center"
        >
            <p className="font-bold text-lg">{event.title}</p>

            {event.description && (
                <p className="text-gray-600 text-sm mb-1">{event.description}</p>
            )}

            <p className="text-sm text-gray-500">
                {format(start, 'MMM d, yyyy h:mm a')} –{' '}
                {end ? format(end, 'MMM d, yyyy h:mm a') : 'Ongoing'}
            </p>

            {event.location?.name && (
                <p className="text-sm text-gray-400">📍 {event.location.name}</p>
            )}

            {typeof event.participantCount === 'number' && (
                <p className="text-sm text-blue-500">
					👥 {event.participantCount} participant
                    {event.participantCount !== 1 ? 's' : ''}
                </p>
            )}
        </li>
    );
}
