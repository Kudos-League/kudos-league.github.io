import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { endOfDay, format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import {
    PencilSquareIcon,
    ArrowLeftIcon,
    TrashIcon,
    ClipboardDocumentCheckIcon,
    UserPlusIcon
} from '@heroicons/react/24/solid';
import { ArrowUturnRightIcon } from '@heroicons/react/24/outline';

import { useAuth } from '@/contexts/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { EventDTO, LocationDTO, MessageDTO, UserDTO } from '@/shared/api/types';
import { useJoinEvent, useDeleteEvent, useInviteToEvent } from '@/shared/api/mutations/events';
import { useSearchUsersQuery } from '@/shared/api/queries/users';
import { apiGet, apiMutate } from '@/shared/api/apiClient';
import { pushAlert } from '@/components/common/alertBus';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import MapDisplay from '@/components/Map';
import Button from '../common/Button';
import UniversalDatePicker from '@/components/DatePicker';
import MessageList from '@/components/posts/MessageList';
import UserCard from '../users/UserCard';

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

function DeleteEventButton({ onClick }: { onClick: () => void }) {
    return (
        <Button
            onClick={onClick}
            className='inline-flex items-center gap-1 text-sm font-semibold shadow'
            variant='danger'
        >
            <TrashIcon className='h-4 w-4 shrink-0' aria-hidden='true' />
            Delete Event
        </Button>
    );
}

export default function EventDetails({ event, setEvent }: Props) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const [joining, setJoining] = useState(false);
    const [activeTab, setActiveTab] = useState<'discussion' | 'participants'>('discussion');
    const [showAllParticipants, setShowAllParticipants] = useState(false);
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
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);

    const handleShareEvent = async () => {
        const url = `${window.location.origin}/event/${event.id}`;
        if (navigator.share) {
            try {
                await navigator.share({ title: event.title, url });
                return;
            }
            catch {
                // Fallback to clipboard
            }
        }
        await navigator.clipboard.writeText(url);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    };

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const eventStartDate = useMemo(
        () => new Date(event.startTime),
        [event.startTime]
    );
    const eventEndDate = useMemo(
        () => (event.endTime ? new Date(event.endTime) : null),
        [event.endTime]
    );
    const eventAutoEndTime = useMemo(
        () => endOfDay(eventStartDate),
        [eventStartDate]
    );
    const eventUsesAutoEnd = useMemo(() => {
        if (!eventEndDate) return true;
        return (
            Math.abs(eventEndDate.getTime() - eventAutoEndTime.getTime()) <
            60000
        );
    }, [eventEndDate, eventAutoEndTime]);

    const isPastEvent = useMemo(() => {
        const now = new Date();
        const effectiveEnd = eventEndDate ?? eventAutoEndTime;
        return effectiveEnd < now;
    }, [eventEndDate, eventAutoEndTime]);

    const autoEditEndTime = useMemo(
        () => endOfDay(editData.startTime),
        [editData.startTime]
    );

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
                msg.id === updatedMessage.id
                    ? { ...msg, ...updatedMessage }
                    : msg
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
                        content: `[deleted message]`
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
                const sender = await apiGet<UserDTO>(
                    `/users/${event.creatorID}`
                );
                setEventCreator(sender);
            }
            catch (err) {
                console.error('Error loading user info', err);
                setError("Couldn't get user info. User might've been deleted.");
            }
        };
        fetchSender();
    }, [event]);

    // Check if current user is the event creator
    const isEventCreator =
        user?.id &&
        ((event as any).creatorID === user.id ||
            (event as any).userId === user.id ||
            (event as any).authorId === user.id ||
            (event as any).ownerId === user.id ||
            (event as any).createdBy === user.id ||
            eventCreator?.id === user.id);

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
            warnings.push(
                `No custom end time selected — event will end on ${format(autoEditEndTime, 'PPP p')}`
            );
        }

        const isValid = errors.length === 0;
        const canSubmit =
            isValid && editData.title.trim() && editData.description.trim();

        return { errors, warnings, isValid, canSubmit };
    }, [
        editData.startTime,
        editData.endTime,
        editData.title,
        editData.description,
        autoEditEndTime
    ]);

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
                updateData.location = {
                    regionID: null,
                    name: null,
                    global: true
                } as unknown as LocationDTO;
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

            const updatedEvent = await apiMutate<EventDTO, any>(
                `/events/${event.id}`,
                'put',
                updateData,
                { as: 'json' }
            );

            const serverEvent = updatedEvent as EventDTO;
            setEvent(serverEvent);
            try {
                queryClient.setQueryData(
                    ['event', serverEvent.id],
                    serverEvent
                );
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
    const deleteMutation = useDeleteEvent();
    const inviteMutation = useInviteToEvent(event.id);
    const [inviteSearchText, setInviteSearchText] = useState('');
    const [showInviteSearch, setShowInviteSearch] = useState(false);
    const debouncedInviteSearch = useDebouncedValue(inviteSearchText, 300);
    const { data: inviteUserResults = [] } = useSearchUsersQuery(debouncedInviteSearch);

    const handleInviteUser = async (userId: number) => {
        try {
            await inviteMutation.mutateAsync({ userId });
            pushAlert({ type: 'success', message: 'Invite sent!' });
            setShowInviteSearch(false);
            setInviteSearchText('');
        }
        catch {
            pushAlert({ type: 'danger', message: 'Failed to send invite.' });
        }
    };

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

    const handleDeleteEvent = async () => {
        if (!event.id) return;
        setDeleting(true);
        setError(null);
        try {
            await deleteMutation.mutateAsync(event.id);
            navigate(-1);
        }
        catch (err: any) {
            console.error('Delete failed:', err);
            setError(err?.message || 'Failed to delete event');
            setDeleting(false);
        }
    };

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (showDeleteConfirm || showInviteSearch) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [showDeleteConfirm, showInviteSearch]);

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
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className='flex items-center gap-2 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors'
                aria-label='Go back'
            >
                <ArrowLeftIcon className='w-5 h-5' />
                <span className='font-medium'>Back</span>
            </button>

            {/* Event Header with Edit Button */}
            <div className='flex items-start justify-between'>
                <div className='flex-1'>
                    {isEditing ? (
                        <input
                            type='text'
                            value={editData.title}
                            onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    title: e.target.value
                                })
                            }
                            className='text-2xl font-bold w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'
                            placeholder='Event title'
                        />
                    ) : (
                        <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
                            {event.title}
                        </h1>
                    )}
                </div>

                <div className='flex items-center gap-2'>
                    {/* Share Button (logged-in users only) */}
                    {!isEditing && user && (
                        <button
                            onClick={handleShareEvent}
                            title={linkCopied ? 'Link copied!' : 'Share event'}
                            className='inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition'
                        >
                            {linkCopied ? (
                                <ClipboardDocumentCheckIcon className='w-4 h-4 text-green-500' />
                            ) : (
                                <ArrowUturnRightIcon className='w-4 h-4' />
                            )}
                            <span className='hidden sm:inline'>{linkCopied ? 'Copied!' : 'Share'}</span>
                        </button>
                    )}

                    {isEventCreator && !isEditing && (
                        <>
                            <div className='relative'>
                                <button
                                    onClick={() => setShowInviteSearch(!showInviteSearch)}
                                    title='Invite user'
                                    className='inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition'
                                >
                                    <UserPlusIcon className='w-4 h-4' />
                                    <span className='hidden sm:inline'>Invite</span>
                                </button>
                                {showInviteSearch && createPortal(
                                    <div className='fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-24' onClick={() => { setShowInviteSearch(false); setInviteSearchText(''); }}>
                                        <div className='w-full max-w-sm p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-lg' onClick={(e) => e.stopPropagation()}>
                                            <div className='flex items-center justify-between mb-3'>
                                                <h3 className='text-sm font-semibold text-gray-700 dark:text-gray-300'>Invite User</h3>
                                                <button onClick={() => { setShowInviteSearch(false); setInviteSearchText(''); }} className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'>
                                                    &times;
                                                </button>
                                            </div>
                                            <input
                                                type='text'
                                                placeholder='Search users...'
                                                value={inviteSearchText}
                                                onChange={(e) => setInviteSearchText(e.target.value)}
                                                className='w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 mb-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                                                autoFocus
                                            />
                                            {inviteUserResults.length > 0 && (
                                                <ul className='max-h-48 overflow-y-auto space-y-1'>
                                                    {inviteUserResults.slice(0, 5).map((u) => (
                                                        <li key={u.id}>
                                                            <button
                                                                onClick={() => handleInviteUser(u.id)}
                                                                className='w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2'
                                                            >
                                                                <UserCard user={u} disableTooltip />
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                            {debouncedInviteSearch.length >= 2 && inviteUserResults.length === 0 && (
                                                <p className='text-sm text-gray-500 dark:text-gray-400 text-center py-2'>No users found</p>
                                            )}
                                        </div>
                                    </div>,
                                    document.body
                                )}
                            </div>
                            <EditEventButton onClick={handleStartEdit} />
                            <DeleteEventButton
                                onClick={() => setShowDeleteConfirm(true)}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm &&
                createPortal(
                    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
                        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-sm w-full p-6'>
                            <h2 className='text-lg font-bold text-gray-900 dark:text-gray-100 mb-4'>
                                Delete Event
                            </h2>
                            <p className='text-gray-700 dark:text-gray-300 mb-6'>
                                Are you sure you want to delete this event? This
                                action cannot be undone.
                            </p>
                            <div className='flex gap-3'>
                                <Button
                                    onClick={handleDeleteEvent}
                                    disabled={deleting}
                                    variant='danger'
                                    className='flex-1'
                                >
                                    {deleting ? 'Deleting...' : 'Delete'}
                                </Button>
                                <Button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={deleting}
                                    variant='secondary'
                                    className='flex-1'
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

            {/* Event Description */}
            {isEditing ? (
                <div className='space-y-4'>
                    <textarea
                        value={editData.description}
                        onChange={(e) =>
                            setEditData({
                                ...editData,
                                description: e.target.value
                            })
                        }
                        className='w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-y-auto'
                        style={{
                            WebkitOverflowScrolling: 'touch',
                            touchAction: 'pan-y'
                        }}
                        rows={4}
                        placeholder='Event description'
                    />

                    {/* Edit Date/Time */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                            <label className='block font-semibold mb-1'>
                                Start Time
                            </label>
                            <UniversalDatePicker
                                date={editData.startTime}
                                onChange={(date) =>
                                    setEditData({
                                        ...editData,
                                        startTime: date
                                    })
                                }
                                label=''
                            />
                        </div>
                        <div>
                            <label className='block font-semibold mb-1'>
                                End Time (Optional)
                            </label>
                            {editData.endTime ? (
                                <div className='space-y-2'>
                                    <UniversalDatePicker
                                        date={editData.endTime}
                                        onChange={(date) =>
                                            setEditData({
                                                ...editData,
                                                endTime: date
                                            })
                                        }
                                        label=''
                                    />
                                    <Button
                                        onClick={() =>
                                            setEditData({
                                                ...editData,
                                                endTime: null
                                            })
                                        }
                                        variant='secondary'
                                        className='text-sm'
                                    >
                                        Remove End Time (Use End of Day)
                                    </Button>
                                </div>
                            ) : (
                                <div className='space-y-2'>
                                    <Button
                                        onClick={() =>
                                            setEditData({
                                                ...editData,
                                                endTime: new Date(
                                                    editData.startTime.getTime() +
                                                        2 * 60 * 60 * 1000
                                                )
                                            })
                                        }
                                        variant='secondary'
                                    >
                                        Add End Time
                                    </Button>
                                    <div className='text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded p-2'>
                                        Without a custom end time, this event
                                        will end on{' '}
                                        {format(autoEditEndTime, 'PPP p')}.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Global/Local Toggle */}
                    <div className='flex items-center gap-3'>
                        <label className='font-semibold'>
                            Is Global Event?
                        </label>
                        <input
                            type='checkbox'
                            checked={editData.global}
                            onChange={() =>
                                setEditData({
                                    ...editData,
                                    global: !editData.global
                                })
                            }
                            className='w-4 h-4'
                        />
                        <span className='text-sm text-gray-600'>
                            (Global events are visible to everyone)
                        </span>
                    </div>

                    {/* Location (if not global) */}
                    {!editData.global && (
                        <div>
                            <label className='block font-semibold mb-2'>
                                Event Location
                            </label>
                            <MapDisplay
                                edit
                                exactLocation
                                regionID={editData.location?.regionID}
                                width='100%'
                                height={300}
                                onLocationChange={(data) => {
                                    if (data) {
                                        setEditData({
                                            ...editData,
                                            location: {
                                                regionID: data.placeID,
                                                name: data.name,
                                                latitude:
                                                    data.coordinates.latitude,
                                                longitude:
                                                    data.coordinates.longitude
                                            } as LocationDTO
                                        });
                                    }
                                }}
                                shouldSavedLocationButton={false}
                            />
                        </div>
                    )}

                    {/* Validation Messages */}
                    {(dateValidation.errors.length > 0 ||
                        dateValidation.warnings.length > 0) && (
                        <div className='space-y-2'>
                            {dateValidation.errors.map((error, i) => (
                                <div
                                    key={`error-${i}`}
                                    className='bg-red-50 border border-red-200 rounded p-3'
                                >
                                    <p className='text-red-700 text-sm font-medium flex items-center'>
                                        <span className='mr-2'>❌</span>
                                        {error}
                                    </p>
                                </div>
                            ))}
                            {dateValidation.warnings.map((warning, i) => (
                                <div
                                    key={`warning-${i}`}
                                    className='bg-yellow-50 border border-yellow-200 rounded p-3'
                                >
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
                        {format(
                            toZonedTime(new Date(event.startTime), tz),
                            'PPP p'
                        )}
                        {' – '}
                        {eventUsesAutoEnd
                            ? `Auto end on ${format(toZonedTime(eventAutoEndTime, tz), 'PPP p')}`
                            : format(
                                toZonedTime(
                                    new Date(event.endTime as any),
                                    tz
                                ),
                                'PPP p'
                            )}
                    </p>
                </>
            )}


            {/* Event Creator */}
            {!isEditing && (
                <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700'>
                    <h3 className='text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2'>
                        Organized by
                    </h3>
                    <UserCard user={eventCreator} large />
                </div>
            )}

            {/* Address text */}
            {!isEditing && event.location?.name && (
                <div className='mt-4 flex items-start gap-2 text-sm text-gray-700 dark:text-gray-200'>
                    <span aria-hidden='true'>📍</span>
                    <span className='break-words'>{event.location.name}</span>
                </div>
            )}

            {/* Map (only show when not editing) */}
            {!isEditing && event.location?.regionID && (
                <div className='my-4'>
                    <MapDisplay
                        regionID={event.location.regionID}
                        height={200}
                        edit={false}
                        exactLocation
                    />
                </div>
            )}

            {/* Discussion + Participants: two-column on desktop, tabs on mobile */}
            {!isEditing && (
                <div>
                    {/* Unauthenticated user banner */}
                    {!user && (
                        <div className='bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-lg p-4 text-center mb-4'>
                            <p className='text-sm text-brand-800 dark:text-brand-200 font-medium'>
                                Register or ask for an invite to interact with this event
                            </p>
                            <div className='flex justify-center gap-3 mt-2'>
                                <Button onClick={() => navigate('/login')} variant='primary' className='text-sm'>
                                    Log In
                                </Button>
                                <Button onClick={() => navigate('/signup')} variant='secondary' className='text-sm'>
                                    Register
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Join/Leave — mobile only (always visible above tabs) */}
                    {user && !isPastEvent && (
                        <div className='mb-4 md:hidden'>
                            {event.participants?.some((p: any) => p.id === user.id) ? (
                                <Button variant='danger' onClick={handleLeave}>
                                    Leave Event
                                </Button>
                            ) : (
                                <Button onClick={handleJoin} disabled={joining}>
                                    {joining ? 'Joining...' : 'Join Event'}
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Mobile tab buttons */}
                    <div className='flex border-b border-zinc-200 dark:border-zinc-700 mb-4 md:hidden'>
                        <button
                            onClick={() => setActiveTab('discussion')}
                            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === 'discussion'
                                    ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                                    : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                            }`}
                        >
                            Discussion
                        </button>
                        <button
                            onClick={() => setActiveTab('participants')}
                            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === 'participants'
                                    ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                                    : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                            }`}
                        >
                            Participants{event.participants?.length ? ` (${event.participants.length})` : ''}
                        </button>
                    </div>

                    {/* Two-column on desktop, tab panels on mobile */}
                    <div className='md:grid md:grid-cols-2 md:gap-6 md:items-start'>
                        {/* Discussion panel */}
                        <div className={activeTab === 'discussion' ? '' : 'hidden md:block'}>
                            <div className='shadow p-4 rounded'>
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
                        </div>

                        {/* Participants panel */}
                        <div className={activeTab === 'participants' ? '' : 'hidden md:block'}>
                            <div className='flex items-center justify-between mb-3'>
                                <h2 className='text-lg font-semibold'>Participants</h2>
                                {/* Join/Leave — desktop only (inside participants column) */}
                                {user && !isPastEvent && (
                                    <div className='hidden md:block'>
                                        {event.participants?.some((p: any) => p.id === user.id) ? (
                                            <Button variant='danger' onClick={handleLeave}>
                                                Leave Event
                                            </Button>
                                        ) : (
                                            <Button onClick={handleJoin} disabled={joining}>
                                                {joining ? 'Joining...' : 'Join Event'}
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className='space-y-3'>
                                {event.participants?.length ? (
                                    <>
                                        {(showAllParticipants
                                            ? event.participants
                                            : event.participants.slice(0, 5)
                                        ).map((p: any) => (
                                            <div
                                                key={p.id}
                                                className='flex items-center gap-3 border p-3 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'
                                            >
                                                <UserCard user={p} large />
                                            </div>
                                        ))}
                                        {event.participants.length > 5 && (
                                            <Button
                                                variant='secondary'
                                                className='w-full'
                                                onClick={() => setShowAllParticipants(!showAllParticipants)}
                                            >
                                                {showAllParticipants
                                                    ? 'Show less'
                                                    : `Show all participants (${event.participants.length - 5} more)`}
                                            </Button>
                                        )}
                                    </>
                                ) : (
                                    <p>No participants yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
