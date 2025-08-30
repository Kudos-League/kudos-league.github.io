import React, { useMemo, useState } from 'react';
import { X, MapPin, User, Edit3 } from 'lucide-react';
import { useAuth } from '@/contexts/useAuth';
import dayjs from 'dayjs';
import EventCard from './EventCard';
import Button from '../common/Button';
import { useEvents } from '@/shared/api/queries/events';
import type { EventDTO } from '@/shared/api/types';
import Dropdown from '../common/Dropdown';

interface LocationSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const LocationSetupModal: React.FC<LocationSetupModalProps> = ({
    isOpen,
    onClose
}) => {
    if (!isOpen) return null;
    return (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
            <div className='bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all'>
                <div className='flex items-center justify-between p-6 border-b border-gray-100'>
                    <div className='flex items-center gap-3'>
                        <div className='bg-blue-100 p-2 rounded-lg'>
                            <MapPin className='w-5 h-5 text-blue-600' />
                        </div>
                        <h3 className='text-lg font-semibold text-gray-900'>
                            Location Required
                        </h3>
                    </div>
                    <Button
                        onClick={onClose}
                        className='text-gray-400 hover:text-gray-600 transition-colors'
                    >
                        <X className='w-5 h-5' />
                    </Button>
                </div>
                <div className='p-6'>
                    <p className='text-gray-600 mb-6'>
                        To view local events, you need to set your location in
                        your profile first.
                    </p>
                    <div className='space-y-4'>
                        <div className='flex items-start gap-3'>
                            <div className='bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium text-gray-600 mt-0.5'>
                                1
                            </div>
                            <div className='flex-1'>
                                <div className='flex items-center gap-2 mb-1'>
                                    <User className='w-4 h-4 text-gray-500' />
                                    <span className='font-medium text-gray-900'>
                                        Go to your profile
                                    </span>
                                </div>
                                <p className='text-sm text-gray-600'>
                                    Click on your profile in the top right, then
                                    select &quot;Profile&quot;.
                                </p>
                            </div>
                        </div>
                        <div className='flex items-start gap-3'>
                            <div className='bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium text-gray-600 mt-0.5'>
                                2
                            </div>
                            <div className='flex-1'>
                                <div className='flex items-center gap-2 mb-1'>
                                    <Edit3 className='w-4 h-4 text-gray-500' />
                                    <span className='font-medium text-gray-900'>
                                        Edit your profile
                                    </span>
                                </div>
                                <p className='text-sm text-gray-600'>
                                    Click the &quot;Edit&quot; button to modify
                                    your profile settings.
                                </p>
                            </div>
                        </div>
                        <div className='flex items-start gap-3'>
                            <div className='bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium text-gray-600 mt-0.5'>
                                3
                            </div>
                            <div className='flex-1'>
                                <div className='flex items-center gap-2 mb-1'>
                                    <MapPin className='w-4 h-4 text-gray-500' />
                                    <span className='font-medium text-gray-900'>
                                        Add your location
                                    </span>
                                </div>
                                <p className='text-sm text-gray-600'>
                                    Enter your location and click &quot;Save
                                    Changes&quot;.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='flex gap-3 p-6 bg-gray-50 rounded-b-xl'>
                    <Button
                        onClick={onClose}
                        className='flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium'
                    >
                        Got it
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default function CurrentEvent() {
    const { user } = useAuth();

    const [currentIndex, setCurrentIndex] = useState(0);
    const [locationFilter, setLocationFilter] = useState(false);
    const [timeFilter, setTimeFilter] = useState<
        'all' | 'today' | 'next7d' | 'nextmonth'
    >('all');
    const [showLocationModal, setShowLocationModal] = useState(false);

    const TIME_FILTERS = [
        { label: 'All Time + Past', value: 'all' },
        { label: 'Active Today', value: 'today' },
        { label: 'Active Next 7 Days', value: 'next7d' },
        { label: 'Active Next Month', value: 'nextmonth' }
    ] as const;

    const canQueryLocal = locationFilter && !!user?.location?.name;
    const serverFilters = useMemo(
        () => ({
            filter: 'all' as const,
            ...(canQueryLocal ? { location: user!.location!.name } : {})
        }),
        [canQueryLocal, user?.location?.name]
    );

    const enabled = !locationFilter || !!user?.location?.name;

    const selectByTime = useMemo(() => {
        return (events: EventDTO[]) => {
            if (timeFilter === 'all') return events;

            const now = dayjs();
            const startOfToday = now.startOf('day');
            const endOfToday = now.endOf('day');

            return events.filter((e) => {
                const start = dayjs(e.startTime);
                const end = dayjs(e.endTime ?? e.startTime);

                if (timeFilter === 'today') {
                    return (
                        (start.isBefore(endOfToday) ||
                            start.isSame(endOfToday)) &&
                        (end.isAfter(startOfToday) || end.isSame(startOfToday))
                    );
                }

                if (timeFilter === 'next7d') {
                    const endOfNext7 = now.add(7, 'day').endOf('day');
                    return (
                        (start.isBefore(endOfNext7) ||
                            start.isSame(endOfNext7)) &&
                        (end.isAfter(startOfToday) || end.isSame(startOfToday))
                    );
                }

                if (timeFilter === 'nextmonth') {
                    const endOfNextMonth = now.add(1, 'month').endOf('day');
                    return (
                        (start.isBefore(endOfNextMonth) ||
                            start.isSame(endOfNextMonth)) &&
                        (end.isAfter(startOfToday) || end.isSame(startOfToday))
                    );
                }

                return true;
            });
        };
    }, [timeFilter]);

    const {
        data: events = [],
        isLoading,
        isError
    } = useEvents(serverFilters, {
        enabled,
        select: selectByTime
    });

    React.useEffect(() => {
        if (!enabled && locationFilter) setShowLocationModal(true);
    }, [enabled, locationFilter]);

    React.useEffect(() => {
        setCurrentIndex(0);
    }, [events.length, timeFilter, locationFilter]);

    return (
        <div className='my-6 px-4'>
            <h2 className='text-xl font-bold mb-2 text-center'>
                Active Events
            </h2>

            <div className='flex items-center justify-between mb-4'>
                <Button
                    onClick={() => setLocationFilter((prev) => !prev)}
                    className={`px-4 py-1 rounded transition-colors ${
                        locationFilter
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                >
                    {locationFilter ? 'Local (On)' : 'Local (Off)'}
                </Button>

                <div className='relative'>
                    <Dropdown
                        value={timeFilter}
                        onChange={setTimeFilter}
                        options={TIME_FILTERS}
                        label="Time"
                    />
                </div>
            </div>

            {isLoading ? (
                <p className='text-center text-lg'>Loading events...</p>
            ) : isError ? (
                <p className='text-center text-red-600'>
                    Failed to fetch events.
                </p>
            ) : events.length > 0 ? (
                <div className='flex items-center justify-center gap-4 list-none'>
                    <Button
                        onClick={() =>
                            setCurrentIndex(
                                (i) => (i - 1 + events.length) % events.length
                            )
                        }
                        variant='icon'
                        shape='circle'
                        className='w-8 h-8'
                    >
                        ◀
                    </Button>

                    <EventCard event={events[currentIndex]} />

                    <Button
                        onClick={() =>
                            setCurrentIndex((i) => (i + 1) % events.length)
                        }
                        variant='icon'
                        shape='circle'
                        className='w-8 h-8'
                    >
                        ◀
                    </Button>
                </div>
            ) : (
                <p className='text-center text-gray-600 italic mt-4'>
                    No events match your filter.
                </p>
            )}

            <LocationSetupModal
                isOpen={showLocationModal}
                onClose={() => setShowLocationModal(false)}
            />
        </div>
    );
}
