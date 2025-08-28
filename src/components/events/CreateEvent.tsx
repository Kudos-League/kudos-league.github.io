import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateEventDTO, LocationDTO } from '@/shared/api/types';
import UniversalDatePicker from '@/components/DatePicker';
import MapDisplay from '@/components/Map';
import Button from '@/components/common/Button';
import { useCreateEvent } from '@/shared/api/mutations/events';

export default function CreateEvent() {
    const navigate = useNavigate();

    const createEvent = useCreateEvent();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [global, setGlobal] = useState(false);
    const [location, setLocation] = useState<LocationDTO | null>(null);

    const now = new Date();
    const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const [startDate, setStartDate] = useState(now);
    const [endDate, setEndDate] = useState<Date | null>(oneDayLater);
    const [errorMessages, setErrorMessages] = useState<string[]>([]);

    const dateValidation = useMemo(() => {
        const errors: string[] = [];
        const warnings: string[] = [];
        const info: string[] = [];

        if (!startDate) {
            errors.push('Start date is required');
            return { errors, warnings, info, isValid: false, canSubmit: false };
        }

        const now = new Date();
        const startTime = new Date(startDate).getTime();

        if (startTime < now.getTime() - 60000) {
            warnings.push('Start time is in the past');
        }

        const twoYearsFromNow = new Date(
            now.getFullYear() + 2,
            now.getMonth(),
            now.getDate()
        );
        if (startTime > twoYearsFromNow.getTime()) {
            warnings.push('Start time is more than 2 years in the future');
        }

        const timeDiff = startTime - now.getTime();
        const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutesDiff = Math.floor(timeDiff / (1000 * 60));

        if (timeDiff > 0) {
            if (daysDiff > 0) {
                info.push(
                    `Event starts in ${daysDiff} day${daysDiff !== 1 ? 's' : ''}`
                );
            }
            else if (hoursDiff > 0) {
                info.push(
                    `Event starts in ${hoursDiff} hour${hoursDiff !== 1 ? 's' : ''}`
                );
            }
            else if (minutesDiff > 0) {
                info.push(
                    `Event starts in ${minutesDiff} minute${minutesDiff !== 1 ? 's' : ''}`
                );
            }
            else {
                info.push('Event starts very soon');
            }
        }

        if (endDate) {
            const endTime = new Date(endDate).getTime();

            if (endTime <= startTime) {
                errors.push('End time must be after start time');
            }
            else {
                const durationMs = endTime - startTime;
                const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
                const durationMinutes = Math.floor(
                    (durationMs % (1000 * 60 * 60)) / (1000 * 60)
                );

                if (durationMs < 15 * 60 * 1000) {
                    warnings.push(
                        'Event duration is very short (less than 15 minutes)'
                    );
                }

                const durationDays = Math.floor(
                    durationMs / (1000 * 60 * 60 * 24)
                );
                if (durationDays > 0) {
                    const remainingHours = Math.floor(
                        (durationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
                    );
                    if (remainingHours > 0) {
                        info.push(
                            `Event duration: ${durationDays} day${durationDays !== 1 ? 's' : ''}, ${remainingHours}h`
                        );
                    }
                    else {
                        info.push(
                            `Event duration: ${durationDays} day${durationDays !== 1 ? 's' : ''}`
                        );
                    }
                }
                else if (durationHours > 0) {
                    info.push(
                        `Event duration: ${durationHours}h ${durationMinutes}m`
                    );
                }
                else {
                    info.push(
                        `Event duration: ${durationMinutes} minute${durationMinutes !== 1 ? 's' : ''}`
                    );
                }
            }
        }
        else {
            info.push('No end time set (ongoing event)');
        }

        const isValid = errors.length === 0;
        const canSubmit = isValid && title.trim() && description.trim();

        return { errors, warnings, info, isValid, canSubmit };
    }, [startDate, endDate, title, description]);

    const handleStartDateChange = (newStartDate: Date) => {
        setStartDate(newStartDate);

        if (
            endDate &&
            new Date(endDate).getTime() <= new Date(newStartDate).getTime()
        ) {
            const suggestedEndDate = new Date(
                new Date(newStartDate).getTime() + 24 * 60 * 60 * 1000
            ); // 1 day later
            setEndDate(suggestedEndDate);
        }

        setErrorMessages([]);
    };

    const handleEndDateChange = (newEndDate: Date) => {
        setEndDate(newEndDate);
        setErrorMessages([]);
    };

    const onSubmit = async () => {
        setErrorMessages([]);

        if (!dateValidation.canSubmit) {
            setErrorMessages([
                ...dateValidation.errors,
                ...(title.trim() ? [] : ['Title is required']),
                ...(description.trim() ? [] : ['Description is required']),
                ...(global || location?.regionID ? [] : ['Location is required when Global is off']),
            ]);
            return;
        }

        const payload: CreateEventDTO = {
            title: title.trim(),
            description: description.trim(),
            location: { ...location, regionID: location?.regionID ?? null, global },
            startTime: startDate,
            endTime: endDate,
        };

        try {
            await createEvent.mutateAsync(payload);
            navigate('/events');
        }
        catch (msgs: any) {
            setErrorMessages((msgs as string[]) ?? ['Failed to create event']);
        }
    };

    const getValidationClasses = (hasErrors: boolean, hasWarnings: boolean) => {
        if (hasErrors) return 'border-red-300 bg-red-50';
        if (hasWarnings) return 'border-yellow-300 bg-yellow-50';
        return 'border-gray-300 bg-white';
    };

    return (
        <div className='max-w-xl mx-auto p-6 space-y-6'>
            <h1 className='text-2xl font-bold text-center'>Create Event</h1>

            <div>
                <label className='block font-semibold mb-1'>Title</label>
                <input
                    className='w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder='Enter event title'
                />
            </div>

            <div>
                <label className='block font-semibold mb-1'>Description</label>
                <textarea
                    className='w-full border rounded px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder='Enter event description'
                />
            </div>

            <div className='flex items-center gap-3'>
                <label className='font-semibold'>Is Global Event?</label>
                <input
                    type='checkbox'
                    checked={global}
                    onChange={() => setGlobal((prev) => !prev)}
                />
            </div>

            {!global && (
                <div className='space-y-2'>
                    <label className='block font-semibold'>
                        Pick a Location
                    </label>
                    <p className='text-yellow-700 text-sm font-medium flex items-center'>
                        <span className='mr-2'>⚠️</span>
                        The &nbsp;<u>EXACT</u>&nbsp; event location will be
                        visible to all participants.
                    </p>
                    <MapDisplay
                        showAddressBar
                        onLocationChange={(data) =>
                            setLocation({
                                regionID: data.placeID,
                                name: data.name
                            })
                        }
                        width='100%'
                        height={300}
                    />
                </div>
            )}

            <div
                className={`p-4 rounded-lg border-2 ${getValidationClasses(
                    false,
                    dateValidation.warnings.some((w) => w.includes('past'))
                )}`}
            >
                <UniversalDatePicker
                    label='Start Time'
                    date={startDate}
                    onChange={handleStartDateChange}
                />

                {dateValidation.info.length > 0 && (
                    <div className='mt-2 text-sm text-blue-700 bg-blue-50 p-2 rounded'>
                        <div className='flex items-center gap-2'>
                            <span>ℹ️</span>
                            <div>
                                {dateValidation.info.map((info, i) => (
                                    <div key={i}>{info}</div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div
                className={`space-y-1 p-4 rounded-lg border-2 ${getValidationClasses(
                    dateValidation.errors.some((e) => e.includes('End time')),
                    dateValidation.warnings.some((w) => w.includes('duration'))
                )}`}
            >
                {endDate !== null ? (
                    <>
                        <UniversalDatePicker
                            label='End Time'
                            date={endDate}
                            onChange={handleEndDateChange}
                        />

                        <Button
                            className='text-sm text-blue-600'
                            onClick={() => setEndDate(null)}
                        >
                            Remove End Time (Make Ongoing)
                        </Button>
                    </>
                ) : (
                    <Button
                        className='w-full text-sm text-blue-600 py-2'
                        onClick={() => {
                            const suggestedEndDate = new Date(
                                startDate.getTime() + 24 * 60 * 60 * 1000
                            ); // 1 day later by default
                            setEndDate(suggestedEndDate);
                        }}
                    >
                        Add End Time
                    </Button>
                )}
            </div>

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

            <div className='space-y-2'>
                <Button
                    onClick={onSubmit}
                    className={`w-full px-4 py-3 rounded text-white font-medium transition-all ${
                        dateValidation.canSubmit && !createEvent.isPending
                            ? 'bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md'
                            : 'bg-gray-400 cursor-not-allowed'
                    }`}
                    disabled={!dateValidation.canSubmit || createEvent.isPending}
                >
                    {createEvent.isPending ? (
                        <div className='flex items-center justify-center gap-2'>
                            <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                            Creating Event...
                        </div>
                    ) : (
                        'Create Event'
                    )}
                </Button>

                {!dateValidation.canSubmit && (
                    <p className='text-sm text-gray-600 text-center'>
                        Please fix the issues above to create your event
                    </p>
                )}
            </div>

            {(errorMessages?.length && !createEvent.isError) ? (
                <div className='bg-red-100 border border-red-300 rounded p-4'>
                    {errorMessages.map((msg, i) => (
                        <p key={i} className='text-red-700 text-sm'>
                            {msg}
                        </p>
                    ))}
                </div>
            ) : null}

            {createEvent.isError && Array.isArray(createEvent.error) && createEvent.error.length > 0 && (
                <div className='bg-red-100 border border-red-300 rounded p-4'>
                    <p className='text-red-700 text-sm'>{createEvent.error.join(', ')}</p>
                </div>
            )}
        </div>
    );
}
