import React, { useEffect, useState, useCallback } from 'react';
import { X, MapPin, User, Edit3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getEvents } from '@/shared/api/actions';
import dayjs from 'dayjs';
import EventCard from './EventCard';

interface LocationSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const LocationSetupModal: React.FC<LocationSetupModalProps> = ({ isOpen, onClose }) => {

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <MapPin className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            Location Required
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-gray-600 mb-6">
                        To view local events, you need to set your location in your profile first.
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium text-gray-600 mt-0.5">
                                1
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <User className="w-4 h-4 text-gray-500" />
                                    <span className="font-medium text-gray-900">Go to your profile</span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Click on your profile in the top right, then select &quot;Profile&quot; from the dropdown
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium text-gray-600 mt-0.5">
                                2
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <Edit3 className="w-4 h-4 text-gray-500" />
                                    <span className="font-medium text-gray-900">Edit your profile</span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Click the &quot;Edit&quot; button to modify your profile settings
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium text-gray-600 mt-0.5">
                                3
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <MapPin className="w-4 h-4 text-gray-500" />
                                    <span className="font-medium text-gray-900">Add your location</span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Enter your location and click &quot;Save Changes&quot;
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 bg-gray-50 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function CurrentEvent() {
    const { user } = useAuth();

    const [events, setEvents] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [locationFilter, setLocationFilter] = useState(false);
    const [timeFilter, setTimeFilter] = useState('all');
    const [showLocationModal, setShowLocationModal] = useState(false);

    // Time filters for active events
    const TIME_FILTERS = [
        { label: 'All Time + Past', value: 'all' },
        { label: 'Active Today', value: 'today' },
        { label: 'Active Next 7 Days', value: 'next7d' },
        { label: 'Active Next Month', value: 'nextmonth' }
    ];

    const getTimeRange = () => {
        const now = new Date();
        
        switch (timeFilter) {
        case 'today':
            // Get all events, then filter on frontend for ones active today
            return {
                filter: 'all' as const
            };
        case 'next7d':
            // Get all events, then filter on frontend for ones active in next 7 days
            return {
                filter: 'all' as const
            };
        case 'nextmonth':
            // Get all events, then filter on frontend for ones active in next month
            return {
                filter: 'all' as const
            };
        default:
            // All time + past - no filtering
            return {
                filter: 'all' as const
            };
        }
    };

    // Filter events on frontend based on time period
    const filterEventsByTime = useCallback((events: any[], timeFilter: string) => {
        if (timeFilter === 'all') {
            return events; // Show all events including past ones
        }

        const now = new Date();
        const startOfToday = dayjs(now).startOf('day');
        const endOfToday = dayjs(now).endOf('day');

        return events.filter(event => {
            const eventStart = dayjs(event.startTime);
            const eventEnd = dayjs(event.endTime || event.startTime);

            switch (timeFilter) {
            case 'today':
                // Event is active today if it starts before/on end of today AND ends after/on start of today
                return (eventStart.isBefore(endOfToday) || eventStart.isSame(endOfToday)) && 
                       (eventEnd.isAfter(startOfToday) || eventEnd.isSame(startOfToday));
                       
            case 'next7d': {
                const endOfNext7Days = dayjs(now).add(7, 'day').endOf('day');
                // Event is active in next 7 days if it starts before/on end of next 7 days AND ends after/on start of today
                return (eventStart.isBefore(endOfNext7Days) || eventStart.isSame(endOfNext7Days)) && 
                       (eventEnd.isAfter(startOfToday) || eventEnd.isSame(startOfToday));
            }
            
            case 'nextmonth': {
                const endOfNextMonth = dayjs(now).add(1, 'month').endOf('day');
                // Event is active in next month if it starts before/on end of next month AND ends after/on start of today
                return (eventStart.isBefore(endOfNextMonth) || eventStart.isSame(endOfNextMonth)) && 
                       (eventEnd.isAfter(startOfToday) || eventEnd.isSame(startOfToday));
            }
            
            default:
                return true;
            }
        });
    }, []);

    const getLabel = () =>
        TIME_FILTERS.find((f) => f.value === timeFilter)?.label || 'All Time + Past';

    useEffect(() => {
        const fetch = async () => {
            if (locationFilter && !user?.location?.name) {
                setShowLocationModal(true);
                return;
            }

            const timeRange = getTimeRange();
            const filters = {
                ...timeRange,
                ...(locationFilter ? { location: user.location.name } : {})
            };

            const response = await getEvents(filters);
            
            // Filter events based on time period
            const filteredEvents = filterEventsByTime(response, timeFilter);
            
            setEvents(filteredEvents);
            setCurrentIndex(0);
        };

        fetch();
    }, [locationFilter, timeFilter, user?.location?.name, filterEventsByTime]);

    return (
        <div className='my-6 px-4'>
            <h2 className='text-xl font-bold mb-2 text-center'>
                Active Events
            </h2>

            <div className='flex items-center justify-between mb-4'>
                <button
                    onClick={() => setLocationFilter((prev) => !prev)}
                    className={`px-4 py-1 rounded transition-colors ${
                        locationFilter
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                >
                    {locationFilter ? 'Local (On)' : 'Local (Off)'}
                </button>

                {/* Updated dropdown with new time filter options */}
                <div className='relative'>
                    <select
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value)}
                        className='border rounded px-3 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                    >
                        {TIME_FILTERS.map((filter) => (
                            <option key={filter.value} value={filter.value}>
                                {filter.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {events.length > 0 ? (
                <div className='flex items-center justify-center gap-4 list-none'>
                    <button
                        onClick={() =>
                            setCurrentIndex(
                                (i) => (i - 1 + events.length) % events.length
                            )
                        }
                        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                        ◀
                    </button>

                    <EventCard event={events[currentIndex]} />

                    <button
                        onClick={() =>
                            setCurrentIndex((i) => (i + 1) % events.length)
                        }
                        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                        ▶
                    </button>
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
