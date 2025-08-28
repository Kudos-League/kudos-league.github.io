import React, { useState } from 'react';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

import { useAuth } from '@/hooks/useAuth';
import { EventDTO } from '@/shared/api/types';
import { joinEvent, leaveEvent } from '@/shared/api/actions';
import { getImagePath } from '@/shared/api/config';
import MapDisplay from '@/components/Map';
import Button from '../common/Button';

type Props = {
    event: EventDTO;
    setEvent: (event: EventDTO) => void;
};

export default function EventDetails({ event, setEvent }: Props) {
    const { user, token } = useAuth();

    const [joining, setJoining] = useState(false);

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const handleJoin = async () => {
        if (!token || !event.id) return;

        setJoining(true);
        try {
            await joinEvent(event.id, token);
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

            {event.location?.regionID && (
                <div className='my-4'>
                    <MapDisplay
                        regionID={event.location.regionID}
                        height={200}
                        showAddressBar={false}
                    />
                </div>
            )}

            <h2 className='text-lg font-semibold'>Participants</h2>
            <div className='space-y-3'>
                {event.participants?.length ? (
                    event.participants.map((p: any) => (
                        <div
                            key={p.id}
                            className='flex items-center gap-3 border p-2 rounded'
                        >
                            <img
                                src={getImagePath(p.avatar)}
                                alt={p.username}
                                className='w-10 h-10 rounded-full'
                            />
                            <span className='font-medium'>{p.username}</span>
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
