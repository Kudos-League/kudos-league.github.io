import React, { useState } from 'react';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

import { useAuth } from '@/contexts/useAuth';
import { EventDTO } from '@/shared/api/types';
import { joinEvent, leaveEvent } from '@/shared/api/actions';
import { useJoinEvent } from '@/shared/api/mutations/events';
import { useQueryClient } from '@tanstack/react-query';
import { getImagePath } from '@/shared/api/config';
import MapDisplay from '@/components/Map';
import Button from '../common/Button';
import UserCard from '../users/UserCard';

type Props = {
    event: EventDTO;
    setEvent: (event: EventDTO) => void;
};

export default function EventDetails({ event, setEvent }: Props) {
    const { user, token } = useAuth();

    const [joining, setJoining] = useState(false);
    const joinMutation = useJoinEvent(event.id);
    const qc = useQueryClient();

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const handleJoin = async () => {
        if (!token || !event.id) return;

        setJoining(true);
        try {
            await joinMutation.mutateAsync();
            setEvent({
                ...event,
                participants: [...(event.participants || []), user]
            });
        }
        catch (err: any) {
            console.error('Join failed: ' + err.message);
        }
        finally {
            setJoining(false);
        }
    };

    const handleLeave = async () => {
        if (!token || !event.id) return;

        try {
            await leaveEvent(event.id, token);
            qc.invalidateQueries({ queryKey: ['events'] });
            setEvent({
                ...event,
                participants: event.participants.filter(
                    (p: any) => p.id !== user?.id
                )
            });
        }
        catch (err: any) {
            alert('Leave failed: ' + err.message);
        }
    };

    return (
        <div className='max-w-3xl mx-auto px-4 py-8 space-y-6'>
            <h1 className='text-2xl font-bold'>{event.title}</h1>
            <p className='text-gray-700'>{event.description}</p>
            <p className='text-sm text-gray-500 italic'>
                {format(toZonedTime(new Date(event.startTime), tz), 'PPP p')}
                {' – '}
                {event.endTime
                    ? format(toZonedTime(new Date(event.endTime), tz), 'PPP p')
                    : 'Ongoing'}
            </p>

            {event.location?.global ? (
                <div className='my-4'>
                    {event.link ? (
                        <a
                            href={event.link}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='block w-full p-4 text-center rounded border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
                        >
                            🔗 Join Event: {event.link}
                        </a>
                    ) : (
                        <div className='w-full p-4 text-center rounded border border-gray-300 bg-gray-50 text-gray-700'>
                            🌐 Online event
                        </div>
                    )}
                </div>
            ) : event.location?.regionID ? (
                <div className='my-4'>
                    <MapDisplay
                        regionID={event.location.regionID}
                        height={200}
                        edit={false}
                    />
                </div>
            ) : null}

            <h2 className='text-lg font-semibold'>Participants</h2>
            <div className='space-y-3'>
                {event.participants?.length ? (
                    event.participants.map((p: any) => (
                        <div
                            key={p.id}
                            className='flex items-center gap-3 border p-2 rounded'
                        >
                            <UserCard user={p} />
                            {p.id === user?.id && (
                                <Button
                                    variant='danger'
                                    onClick={handleLeave}
                                    className='ml-auto'
                                >
                                    Leave
                                </Button>
                            )}
                        </div>
                    ))
                ) : (
                    <p>No participants yet.</p>
                )}
            </div>

            {!event.participants?.some((p: any) => p.id === user?.id) && (
                <Button
                    onClick={handleJoin}
                    disabled={joining}
                    className='mt-6'
                >
                    {joining ? 'Joining...' : 'Join Event'}
                </Button>
            )}
        </div>
    );
}
