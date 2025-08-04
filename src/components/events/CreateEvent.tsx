import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { createEvent } from '@/shared/api/actions';
import { CreateEventDTO, LocationDTO } from '@/shared/api/types';
import UniversalDatePicker from '@/components/DatePicker';
import MapDisplay from '@/components/Map';

export default function CreateEvent() {
    const navigate = useNavigate();
    const { token } = useAuth();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [global, setGlobal] = useState(false);
    const [location, setLocation] = useState<LocationDTO | null>(null);
    
    // Initialize with safe default dates
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 3600 * 1000);
    
    const [startDate, setStartDate] = useState(now);
    const [endDate, setEndDate] = useState<Date | null>(oneHourLater);
    const [loading, setLoading] = useState(false);
    const [errorMessages, setErrorMessages] = useState<string[]>([]);
    const [hasUserInteracted, setHasUserInteracted] = useState(false); // Track if user has made changes

    console.log('CreateEvent render:', {
        startDate: startDate.toISOString(),
        endDate: endDate?.toISOString(),
        hasUserInteracted
    });

    // DUAL VALIDATION APPROACH:
    // 1. Immediate validation when dates are selected (better UX)
    // 2. Form submission validation as safety net (prevents submission of invalid data)

    // Validation function for dates
    const validateDates = (): string[] => {
        const errors: string[] = [];
        
        if (endDate && startDate) {
            // Convert to milliseconds for accurate comparison
            const startTime = new Date(startDate).getTime();
            const endTime = new Date(endDate).getTime();
            
            console.log('Date validation:', {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                startTime,
                endTime,
                isValid: endTime > startTime
            });
            
            if (endTime <= startTime) {
                errors.push('End time must be after start time.');
            }
        }
        
        return errors;
    };

    // Handle start date change with validation
    const handleStartDateChange = (newStartDate: Date) => {
        console.log('Start date changed:', {
            old: startDate.toISOString(),
            new: newStartDate.toISOString(),
            endDate: endDate?.toISOString()
        });
        
        setStartDate(newStartDate);
        
        // Only validate if end date exists
        if (endDate) {
            const startTime = new Date(newStartDate).getTime();
            const endTime = new Date(endDate).getTime();
            
            if (endTime <= startTime) {
                setErrorMessages(['⚠️ End time must be after start time']);
            }
            else {
                // Clear date-related errors if dates become valid
                setErrorMessages(prev => prev.filter(msg => !msg.includes('time')));
            }
        }
    };

    // Handle end date change with validation
    const handleEndDateChange = (newEndDate: Date) => {
        console.log('End date changed:', {
            startDate: startDate.toISOString(),
            old: endDate?.toISOString(),
            new: newEndDate.toISOString()
        });
        
        setEndDate(newEndDate);
        
        // Immediate validation feedback
        const startTime = new Date(startDate).getTime();
        const endTime = new Date(newEndDate).getTime();
        
        if (endTime <= startTime) {
            setErrorMessages(['⚠️ End time must be after start time']);
        }
        else {
            // Clear date-related errors if dates become valid
            setErrorMessages(prev => prev.filter(msg => !msg.includes('time')));
        }
    };

    const onSubmit = async () => {
        setErrorMessages([]);

        if (!token) {
            setErrorMessages(['You must be logged in to create an event.']);
            return;
        }

        if (!title.trim() || !description.trim()) {
            setErrorMessages(['Title and description are required.']);
            return;
        }

        // Form submission validation (safety net in case immediate validation was bypassed)
        const dateErrors = validateDates();
        if (dateErrors.length > 0) {
            setErrorMessages(['❌ Cannot submit: End time must be after start time']);
            return;
        }

        setLoading(true);

        const payload: CreateEventDTO = {
            title,
            description,
            location: {
                ...location,
                regionID: location?.regionID ?? null,
                global
            },
            startTime: startDate,
            endTime: endDate
        };

        console.log('Creating event with payload:', {
            ...payload,
            startTime: startDate.toISOString(),
            endTime: endDate?.toISOString()
        });

        try {
            await createEvent(payload, token);
            navigate('/');
        }
        catch (error: any) {
            console.error('Event creation error:', error);
            
            // More descriptive error handling
            if (error.response?.status === 400) {
                // Handle validation errors from backend
                if (error.response?.data?.message?.errors) {
                    const zodErrors = error.response.data.message.errors;
                    const msgs = zodErrors.map(
                        (err: any) => `${err.field}: ${err.message}`
                    );
                    setErrorMessages(msgs);
                }
                else if (error.response?.data?.message) {
                    // Single error message from backend
                    setErrorMessages([`Validation Error: ${error.response.data.message}`]);
                }
                else {
                    setErrorMessages(['Invalid data provided. Please check all fields.']);
                }
            }
            else if (error.response?.status === 401) {
                setErrorMessages(['Authentication failed. Please log in again.']);
            }
            else if (error.response?.status === 403) {
                setErrorMessages(['You do not have permission to create events.']);
            }
            else if (error.response?.status === 500) {
                setErrorMessages(['Server error occurred. Please try again later.']);
            }
            else if (error.code === 'NETWORK_ERROR' || !error.response) {
                setErrorMessages(['Network error. Please check your connection and try again.']);
            }
            else {
                // Fallback with more info
                const statusText = error.response?.statusText || 'Unknown Error';
                const status = error.response?.status || 'No Status';
                setErrorMessages([
                    `Failed to create event (${status}: ${statusText})`,
                    'Please check your data and try again, or contact support if the problem persists.'
                ]);
            }
        }
        finally {
            setLoading(false);
        }
    };

    // Real-time validation indicator
    const hasDateError = endDate && startDate && new Date(endDate).getTime() <= new Date(startDate).getTime();

    return (
        <div className='max-w-xl mx-auto p-6 space-y-4'>
            <h1 className='text-2xl font-bold text-center'>Create Event</h1>

            {/* Debug info - remove in production */}
            {process.env.NODE_ENV === 'development' && (
                <div className='text-xs bg-gray-100 p-2 rounded'>
                    <strong>Debug:</strong><br/>
                    Start: {startDate.toISOString()}<br/>
                    End: {endDate?.toISOString() || 'null'}<br/>
                    User Interacted: {hasUserInteracted ? 'Yes' : 'No'}<br/>
                    Has Error: {hasDateError ? 'Yes' : 'No'}<br/>
                    Error Messages: {JSON.stringify(errorMessages)}
                </div>
            )}

            <label className='font-semibold'>Title</label>
            <input
                className='w-full border rounded px-3 py-2'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='Enter event title'
            />

            <label className='font-semibold'>Description</label>
            <textarea
                className='w-full border rounded px-3 py-2 h-24'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='Enter event description'
            />

            <div className='flex items-center gap-3'>
                <label className='font-semibold'>Is Global?</label>
                <input
                    type='checkbox'
                    checked={global}
                    onChange={() => setGlobal((prev) => !prev)}
                />
            </div>

            {!global && (
                <div className='space-y-2'>
                    <label className='font-semibold'>Pick a Location</label>
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

            <UniversalDatePicker
                label='Start Time'
                date={startDate}
                onChange={handleStartDateChange}
            />

            {endDate !== null ? (
                <div className="space-y-1">
                    <UniversalDatePicker
                        label="End Time"
                        date={endDate}
                        onChange={handleEndDateChange}
                    />
                    
                    {/* Immediate validation feedback - more prominent */}
                    {hasDateError && (
                        <div className="bg-red-50 border border-red-200 rounded p-3">
                            <p className="text-red-700 text-sm font-medium flex items-center">
                                <span className="mr-2">⚠️</span>
                                End time must be after start time
                            </p>
                        </div>
                    )}
                    
                    <button
                        type="button"
                        className="text-sm text-blue-600 underline"
                        onClick={() => {
                            setEndDate(null);
                            setHasUserInteracted(true);
                            // Clear any date-related errors when removing end time
                            setErrorMessages(prev => prev.filter(msg => !msg.includes('time')));
                        }}
                    >
                        Remove End Time
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    className="text-sm text-blue-600 underline"
                    onClick={() => {
                        const newEndDate = new Date(startDate.getTime() + 3600 * 1000);
                        setEndDate(newEndDate);
                        setHasUserInteracted(true);
                        // Clear any existing errors when adding end time
                        setErrorMessages(prev => prev.filter(msg => !msg.includes('time')));
                    }}
                >
                    Add End Time
                </button>
            )}

            <button
                onClick={onSubmit}
                className={`w-full px-4 py-2 rounded text-white ${
                    loading || hasDateError
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                }`}
                disabled={loading || hasDateError}
            >
                {loading ? 'Creating...' : 'Create Event'}
            </button>

            {errorMessages.length > 0 && (
                <div className='bg-red-100 p-4 mt-4 rounded'>
                    {errorMessages.map((msg, i) => (
                        <p key={i} className='text-red-700 text-sm'>
                            {msg}
                        </p>
                    ))}
                </div>
            )}
        </div>
    );
}
