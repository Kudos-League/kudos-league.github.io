import React, { useState, useMemo } from 'react';
import { endOfDay, format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { PencilSquareIcon } from '@heroicons/react/24/solid';

import { useAuth } from '@/contexts/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { EventDTO, LocationDTO, MessageDTO } from '@/shared/api/types';
import { useJoinEvent } from '@/shared/api/mutations/events';
import { apiGet, apiMutate } from '@/shared/api/apiClient';
import MapDisplay from '@/components/Map';
import Button from '../common/Button';
import UniversalDatePicker from '@/components/DatePicker';
import MessageList from '@/components/posts/MessageList';

type Props = {
    event: EventDTO;
    setEvent: React.Dispatch<React.SetStateAction<EventDTO | null>>;
};

interface UpdateEventData {
    title: string;
    description: string;
    startTime: Date;
    endTime?: Date | null;
    location?: LocationDTO | null;
}

function EditEventButton({ onClick }: { onClick: () => void }) {
    return (
        <Button
            onClick={onClick}
            className='inline-flex items-center gap-1 text-sm font-semibold shadow'
            variant='secondary'
        >
            <PencilSquareIcon className='h-4 w-4 shrink-0' aria-hidden='true' />
            Edit Event
        </Button>
    );
}

export default function EventDetails({ event, setEvent }: Props) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const [joining, setJoining] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        title: '',
        description: '',
        startTime: new Date(),
        endTime: null as Date | null,
        global: false,
        location: null as LocationDTO | null
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [eventCreator, setEventCreator] = useState<UserDTO | null>(null);

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const eventStartDate = useMemo(() => new Date(event.startTime), [event.startTime]);
    const eventEndDate = useMemo(() => (event.endTime ? new Date(event.endTime) : null), [event.endTime]);
    const eventAutoEndTime = useMemo(() => endOfDay(eventStartDate), [eventStartDate]);
    const eventUsesAutoEnd = useMemo(() => {
        if (!eventEndDate) return true;
        return Math.abs(eventEndDate.getTime() - eventAutoEndTime.getTime()) < 60000;
    }, [eventEndDate, eventAutoEndTime]);

    const autoEditEndTime = useMemo(() => endOfDay(editData.startTime), [editData.startTime]);

    const handleMessageCreated = (message: MessageDTO) => {
        setEvent((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                messages: [message, ...(prev.messages || [])]
            };
        });
    };

    const handleMessageUpdate = (updatedMessage: MessageDTO) => {
        setEvent((prev) => {
            if (!prev) return prev;
            const messages = (prev.messages || []).map((msg) =>
                msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg
            );
            return {
                ...prev,
                messages
            };
        });
    };

    const handleMessageDelete = (deletedMessageId: number) => {
        setEvent((prev) => {
            if (!prev) return prev;
            const messages = (prev.messages || []).map((msg) =>
                msg.id === deletedMessageId
                    ? {
                        ...msg,
                        deletedAt: new Date().toISOString(),
                        content: `[deleted]: ${msg.content}`
                    }
                    : msg
            );
            return {
                ...prev,
                messages
            };
        });
    };

    useEffect(() => {
        const fetchSender = async () => {
            try {
                const sender = await apiGet<UserDTO>(`/users/${event.creatorID}`);
                setEventCreator(sender);
            }
            catch (err) {
                console.error('Error loading user info', err);
                setError('Error loading user info');
            }
        };
        fetchSender();
    }, [event]);

    // Check if current user is the event creator
    const isEventCreator = user?.id && (
        (event as any).creatorID === user.id || 
        (event as any).userId === user.id || 
        (event as any).authorId === user.id ||
        (event as any).ownerId === user.id ||
        (event as any).createdBy === user.id ||
        eventCreator?.id === user.id
    );

    const dateValidation = useMemo(() => {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!editData.startTime) {
            errors.push('Start date is required');
            return { errors, warnings, isValid: false, canSubmit: false };
        }

        const now = new Date();
        const startTime = new Date(editData.startTime).getTime();

        if (startTime < now.getTime() - 60000) {
            warnings.push('Start time is in the past');
        }

        if (editData.endTime) {
            const endTime = new Date(editData.endTime).getTime();
            if (endTime <= startTime) {
                errors.push('End time must be after start time');
            }
        }
        else {
            warnings.push(`No custom end time selected — event will end on ${format(autoEditEndTime, 'PPP p')}`);
        }

        const isValid = errors.length === 0;
        const canSubmit = isValid && editData.title.trim() && editData.description.trim();

        return { errors, warnings, isValid, canSubmit };
    }, [editData.startTime, editData.endTime, editData.title, editData.description, autoEditEndTime]);

    const handleStartEdit = () => {
        const existingEnd = eventEndDate ? new Date(eventEndDate) : null;
        setEditData({
            title: event.title,
            description: event.description,
            startTime: new Date(event.startTime),
            endTime: eventUsesAutoEnd ? null : existingEnd,
            global: event.location?.global || false,
            location: event.location || null
        });
        setIsEditing(true);
        setError(null);
    };

    const handleSaveEdit = async () => {
        if (!dateValidation.canSubmit) return;

        setSaving(true);
        setError(null);

        try {
            const updateData: UpdateEventData = {
                title: editData.title.trim(),
                description: editData.description.trim(),
                startTime: editData.startTime,
                endTime: editData.endTime ?? endOfDay(editData.startTime)
            };

            if (editData.global) {
                updateData.location = { regionID: null, name: null, global: true } as unknown as LocationDTO;
            }
            else {
                if (editData.location) {
                    updateData.location = {
                        regionID: editData.location.regionID ?? null,
                        name: editData.location.name ?? null,
                        global: false
                    } as LocationDTO;
                }
                else {
                    updateData.location = null;
                }
            }

            const updatedEvent = await apiMutate<EventDTO, any>(`/events/${event.id}`, 'put', updateData, { as: 'json' });

            const serverEvent = updatedEvent as EventDTO;
            setEvent(serverEvent);
            try {
                queryClient.setQueryData(['event', serverEvent.id], serverEvent);
                queryClient.invalidateQueries({ queryKey: ['events'] });
            }
            catch (e) {
                console.warn('Failed to update event cache after save', e);
            }
            setIsEditing(false);
        }
        catch (err: any) {
            console.error('Failed to update event:', err);
            setError(err?.message || 'Failed to update event');
        }
        finally {
            setSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setError(null);
        setEditData({
            title: '',
            description: '',
            startTime: new Date(),
            endTime: null,
            global: false,
            location: null
        });
    };

    const joinMutation = useJoinEvent(event.id);

    const handleJoin = async () => {
        if (!user || !event.id) return;
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
        if (!user || !event.id) return;
        try {
            await apiMutate(`/events/${event.id}/leave`, 'post');
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
            {/* Event Header with Edit Button */}
            <div className='flex items-start justify-between'>
                <div className='flex-1'>
                    {isEditing ? (
                        <input
                            type='text'
                            value={editData.title}
                            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                            className='text-2xl font-bold w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                            placeholder='Event title'
                        />
                    ) : (
                        <h1 className='text-2xl font-bold'>{event.title}</h1>
                    )}
                </div>
                
                {isEventCreator && !isEditing && (
                    <EditEventButton onClick={handleStartEdit} />
                )}
            </div>

            {/* Event Description */}
            {isEditing ? (
                <div className='space-y-4'>
                    <textarea
                        value={editData.description}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        className='w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                        rows={4}
                        placeholder='Event description'
                    />

                    {/* Edit Date/Time */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                            <label className='block font-semibold mb-1'>Start Time</label>
                            <UniversalDatePicker
                                date={editData.startTime}
                                onChange={(date) => setEditData({ ...editData, startTime: date })}
                                label=''
                            />
                        </div>
                        <div>
                            <label className='block font-semibold mb-1'>End Time (Optional)</label>
                            {editData.endTime ? (
                                <div className='space-y-2'>
                                    <UniversalDatePicker
                                        date={editData.endTime}
                                        onChange={(date) => setEditData({ ...editData, endTime: date })}
                                        label=''
                                    />
                                    <Button
                                        onClick={() => setEditData({ ...editData, endTime: null })}
                                        variant='secondary'
                                        className='text-sm'
                                    >
                                        Remove End Time (Use End of Day)
                                    </Button>
                                </div>
                            ) : (
                                <div className='space-y-2'>
                                    <Button
                                        onClick={() => setEditData({ 
                                            ...editData, 
                                            endTime: new Date(editData.startTime.getTime() + 2 * 60 * 60 * 1000)
                                        })}
                                        variant='secondary'
                                    >
                                        Add End Time
                                    </Button>
                                    <div className='text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded p-2'>
                                        Without a custom end time, this event will end on {format(autoEditEndTime, 'PPP p')}.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Global/Local Toggle */}
                    <div className='flex items-center gap-3'>
                        <label className='font-semibold'>Is Global Event?</label>
                        <input
                            type='checkbox'
                            checked={editData.global}
                            onChange={() => setEditData({ ...editData, global: !editData.global })}
                            className='w-4 h-4'
                        />
                        <span className='text-sm text-gray-600'>
                            (Global events are visible to everyone)
                        </span>
                    </div>

                    {/* Location (if not global) */}
                    {!editData.global && (
                        <div>
                            <label className='block font-semibold mb-2'>Event Location</label>
                            <MapDisplay
                                edit={true}
                                regionID={editData.location?.regionID}
                                width='100%'
                                height={300}
                                onLocationChange={(data) => {
                                    if (data) {
                                        setEditData({
                                            ...editData,
                                            location: {
                                                regionID: data.placeID,
                                                name: data.name
                                            } as LocationDTO
                                        });
                                    }
                                }}
                            />
                        </div>
                    )}

                    {/* Validation Messages */}
                    {(dateValidation.errors.length > 0 || dateValidation.warnings.length > 0) && (
                        <div className='space-y-2'>
                            {dateValidation.errors.map((error, i) => (
                                <div key={`error-${i}`} className='bg-red-50 border border-red-200 rounded p-3'>
                                    <p className='text-red-700 text-sm font-medium flex items-center'>
                                        <span className='mr-2'>❌</span>
                                        {error}
                                    </p>
                                </div>
                            ))}
                            {dateValidation.warnings.map((warning, i) => (
                                <div key={`warning-${i}`} className='bg-yellow-50 border border-yellow-200 rounded p-3'>
                                    <p className='text-yellow-700 text-sm font-medium flex items-center'>
                                        <span className='mr-2'>⚠️</span>
                                        {warning}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className='bg-red-50 border border-red-200 rounded p-3'>
                            <p className='text-red-700 text-sm'>{error}</p>
                        </div>
                    )}

                    {/* Save/Cancel Buttons */}
                    <div className='flex gap-3 pt-4'>
                        <Button 
                            onClick={handleSaveEdit}
                            disabled={!dateValidation.canSubmit || saving}
                            variant='success'
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button variant='secondary' onClick={handleCancelEdit}>
                            Cancel
                        </Button>
                    </div>
                </div>
            ) : (
                <>
                    <p className='text-gray-700'>{event.description}</p>
                    <p className='text-sm text-gray-500 italic'>
                        {format(toZonedTime(new Date(event.startTime), tz), 'PPP p')}
                        {' – '}
                        {eventUsesAutoEnd
                            ? `Auto end on ${format(toZonedTime(eventAutoEndTime, tz), 'PPP p')}`
                            : format(toZonedTime(new Date(event.endTime as any), tz), 'PPP p')}
                    </p>
                </>
            )}

            {/* Event Creator */}
            {!isEditing && (
                <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700'>
                    <h3 className='text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2'>Organized by</h3>
                    <UserCard user={eventCreator} large />
                </div>
            )}

            {/* Map (only show when not editing) */}
            {!isEditing && event.location?.regionID && (
                <div className='my-4'>
                    <MapDisplay
                        regionID={event.location.regionID}
                        height={200}
                        edit={false}
                    />
                </div>
            )}

            <div className='shadow p-4 rounded mb-6'>
                <MessageList
                    title='Discussion'
                    messages={event.messages || []}
                    callback={handleMessageCreated}
                    eventID={event.id}
                    showSendMessage={!!user}
                    allowDelete={!!user}
                    allowEdit={!!user}
                    onMessageUpdate={handleMessageUpdate}
                    onMessageDelete={handleMessageDelete}
                />
            </div>

            {/* Participants (only show when not editing) */}
            {!isEditing && (
                <>
                    <h2 className='text-lg font-semibold'>Participants</h2>
                    <div className='space-y-3'>
                        {event.participants?.length ? (
                            event.participants.map((p: any) => (
                                <div
                                    key={p.id}
                                    className='flex items-center gap-3 border p-3 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'
                                >
                                    <div className='flex-1'>
                                        <UserCard user={p} large />
                                    </div>
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
                </>
            )}
        </div>
    );
}
