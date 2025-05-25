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
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date(Date.now() + 3600 * 1000));
    const [loading, setLoading] = useState(false);
    const [errorMessages, setErrorMessages] = useState<string[]>([]);

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

        try {
            await createEvent(payload, token);
            navigate('/');
        }
        catch (error: any) {
            if (error.response?.data?.message?.errors) {
                const zodErrors = error.response.data.message.errors;
                const msgs = zodErrors.map(
                    (err: any) => `${err.field}: ${err.message}`
                );
                setErrorMessages(msgs);
            }
            else {
                setErrorMessages(['Failed to create event. Please try again.']);
            }
        }
        finally {
            setLoading(false);
        }
    };

    return (
        <div className='max-w-xl mx-auto p-6 space-y-4'>
            <h1 className='text-2xl font-bold text-center'>Create Event</h1>

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
                onChange={setStartDate}
            />
            <UniversalDatePicker
                label='End Time'
                date={endDate}
                onChange={setEndDate}
            />

            <button
                onClick={onSubmit}
                className='w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'
                disabled={loading}
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
