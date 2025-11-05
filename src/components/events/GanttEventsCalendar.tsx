import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    format,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    startOfYear,
    endOfYear,
    addDays,
    addWeeks,
    addMonths,
    addYears,
    differenceInDays,
    differenceInWeeks,
    differenceInMonths,
    isSameDay,
    isToday,
    startOfDay,
    endOfDay
} from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Filter, X, MapPin, Users, Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { EventDTO } from '@/shared/api/types';
import { useEvents } from '@/shared/api/queries/events';
import { getImagePath } from '@/shared/api/config';
import Button from '@/components/common/Button';

interface EventDetailsModalProps {
    event: EventDTO | null;
    onClose: () => void;
    onViewDay: (date: Date) => void;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ event, onClose, onViewDay }) => {
    const navigate = useNavigate();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (!event) return null;

    const start = toZonedTime(new Date(event.startTime), tz);
    const end = event.endTime ? toZonedTime(new Date(event.endTime), tz) : null;
    
    const getDuration = () => {
        if (!end) return 'Ongoing';
        const hours = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        if (days > 0) {
            const remainingHours = hours % 24;
            return `${days} day${days !== 1 ? 's' : ''}${remainingHours > 0 ? ` ${remainingHours}h` : ''}`;
        }
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
    };

    return (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
            <div className='bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
                <div className='sticky top-0 bg-white border-b p-6'>
                    <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                            <h2 className='text-2xl font-bold text-gray-900 mb-2'>{event.title}</h2>
                            <div className='flex flex-wrap gap-2'>
                                {event.location?.global ? (
                                    <span className='px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded'>
                                        🌐 Global Event
                                    </span>
                                ) : (
                                    <span className='px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded'>
                                        📍 Local Event
                                    </span>
                                )}
                                {!event.endTime && (
                                    <span className='px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded'>
                                        ⏰ Ongoing
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                        >
                            <X className='w-5 h-5' />
                        </button>
                    </div>
                </div>

                <div className='p-6 space-y-6'>
                    <div>
                        <h3 className='font-semibold text-gray-900 mb-2 flex items-center gap-2'>
                            <span className='text-lg'>📝</span>
                            Description
                        </h3>
                        <p className='text-gray-700 leading-relaxed'>{event.description}</p>
                    </div>

                    <div className='border-t pt-4'>
                        <h3 className='font-semibold text-gray-900 mb-3 flex items-center gap-2'>
                            <Clock className='w-5 h-5 text-blue-600' />
                            Schedule
                        </h3>
                        <div className='space-y-2 text-sm'>
                            <div className='flex items-start gap-3'>
                                <span className='font-medium text-gray-600 w-16'>Start:</span>
                                <span className='text-gray-900'>{format(start, 'EEEE, MMMM d, yyyy')}</span>
                            </div>
                            <div className='flex items-start gap-3'>
                                <span className='font-medium text-gray-600 w-16'></span>
                                <span className='text-gray-700'>{format(start, 'h:mm a')}</span>
                            </div>
                            {event.endTime && (
                                <>
                                    <div className='flex items-start gap-3'>
                                        <span className='font-medium text-gray-600 w-16'>End:</span>
                                        <span className='text-gray-900'>{format(end!, 'EEEE, MMMM d, yyyy')}</span>
                                    </div>
                                    <div className='flex items-start gap-3'>
                                        <span className='font-medium text-gray-600 w-16'></span>
                                        <span className='text-gray-700'>{format(end!, 'h:mm a')}</span>
                                    </div>
                                </>
                            )}
                            <div className='flex items-start gap-3 pt-2 border-t'>
                                <span className='font-medium text-gray-600 w-16'>Duration:</span>
                                <span className='text-blue-600 font-medium'>{getDuration()}</span>
                            </div>
                        </div>
                    </div>

                    {event.location && (
                        <div className='border-t pt-4'>
                            <h3 className='font-semibold text-gray-900 mb-3 flex items-center gap-2'>
                                <MapPin className='w-5 h-5 text-green-600' />
                                Location
                            </h3>
                            <p className='text-gray-700'>
                                {event.location.global ? (
                                    <span className='flex items-center gap-2'>
                                        <span>🌐</span>
                                        <span>Online / Global Event</span>
                                    </span>
                                ) : (
                                    <span className='flex items-center gap-2'>
                                        <span>📍</span>
                                        <span>{event.location.name}</span>
                                    </span>
                                )}
                            </p>
                        </div>
                    )}

                    <div className='border-t pt-4'>
                        <h3 className='font-semibold text-gray-900 mb-3 flex items-center gap-2'>
                            <Users className='w-5 h-5 text-purple-600' />
                            Participants
                            <span className='ml-1 text-sm font-normal text-gray-600'>
                                ({event.participantCount || 0})
                            </span>
                        </h3>
                        {event.participants && event.participants.length > 0 ? (
                            <div className='space-y-2'>
                                {event.participants.slice(0, 8).map((p: any) => (
                                    <div key={p.id} className='flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors'>
                                        <img
                                            src={getImagePath(p.avatar)}
                                            alt={p.username}
                                            className='w-10 h-10 rounded-full border-2 border-gray-200'
                                        />
                                        <span className='font-medium text-gray-900'>{p.username}</span>
                                    </div>
                                ))}
                                {event.participants.length > 8 && (
                                    <p className='text-sm text-gray-500 pl-2 pt-2'>
                                        +{event.participants.length - 8} more participant{event.participants.length - 8 !== 1 ? 's' : ''}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className='text-gray-500 italic'>No participants yet</p>
                        )}
                    </div>

                    <div className='flex gap-3 pt-4 border-t'>
                        <Button
                            onClick={() => {
                                onViewDay(new Date(event.startTime));
                                onClose();
                            }}
                            variant='secondary'
                            className='flex items-center gap-2'
                        >
                            <CalendarIcon className='w-4 h-4' />
                            View Day
                        </Button>
                        <Button onClick={() => navigate(`/event/${event.id}`)} className='flex-1'>
                            View Full Details
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface EventPosition extends EventDTO {
    left: number;
    width: number;
    isOngoing: boolean;
}

type TimeUnit = 'days' | 'weeks' | 'months';

export default function GanttEventsCalendar() {
    const navigate = useNavigate();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);

    const [zoomLevel, setZoomLevel] = useState(1);
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('month');
    const [filterText, setFilterText] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<EventDTO | null>(null);
    const [viewDate, setViewDate] = useState<Date | null>(null);
    const [selectedDateEvents, setSelectedDateEvents] = useState<EventDTO[] | null>(null);
    const [locationFilter, setLocationFilter] = useState(false);
    const [periodOffset, setPeriodOffset] = useState(0); // 0 = current period, -1 = previous, 1 = next

    // Fetch events from API
    const { data: allEvents = [], isLoading, isError } = useEvents({ filter: 'all' });

    // Filter out past events
    const events = useMemo(() => {
        const now = new Date();
        return allEvents.filter((event) => {
            const eventEnd = event.endTime ? new Date(event.endTime) : null;
            // Include ongoing events and future events
            return !eventEnd || eventEnd >= now;
        });
    }, [allEvents]);

    // Calculate date range based on timeRange selection and periodOffset
    const dateRange = useMemo(() => {
        const now = startOfDay(new Date());
        let start: Date, end: Date;

        switch (timeRange) {
        case 'week':
            start = addWeeks(startOfWeek(now, { weekStartsOn: 0 }), periodOffset);
            end = endOfWeek(start, { weekStartsOn: 0 });
            break;
        case 'month':
            start = startOfMonth(addMonths(now, periodOffset));
            end = endOfMonth(addMonths(now, periodOffset));
            break;
        case 'year':
            start = startOfYear(addYears(now, periodOffset));
            end = endOfYear(addYears(now, periodOffset));
            break;
        case 'all':
        default:
            start = now;
            if (events.length === 0) {
                end = endOfMonth(now);
            }
            else {
                // Find latest event
                const eventDates = events.map((e) => 
                    e.endTime ? new Date(e.endTime) : addDays(new Date(e.startTime), 365)
                );
                end = new Date(Math.max(...eventDates.map((d) => d.getTime())));
                // Add padding
                end = addDays(end, 7);
            }
            break;
        }

        return { start, end };
    }, [timeRange, periodOffset, events]);

    // Filter events
    const filteredEvents = useMemo(() => {
        return events.filter((event) => {
            if (filterText) {
                const searchLower = filterText.toLowerCase();
                const matchesSearch =
                    event.title.toLowerCase().includes(searchLower) ||
                    event.description.toLowerCase().includes(searchLower) ||
                    event.location?.name?.toLowerCase().includes(searchLower);
                if (!matchesSearch) return false;
            }

            if (locationFilter) {
                return event.location?.global === true;
            }

            return true;
        });
    }, [events, filterText, locationFilter]);

    // Generate timeline units (days, weeks, or months) - temporarily as days first
    const temporaryDaysUnits = useMemo(() => {
        const units: Array<{ date: Date; label: string; sublabel?: string }> = [];
        const totalDays = differenceInDays(dateRange.end, dateRange.start);
        for (let i = 0; i <= totalDays; i++) {
            const day = addDays(dateRange.start, i);
            units.push({
                date: day,
                label: format(day, 'd'),
                sublabel: format(day, 'EEE')
            });
        }
        return units;
    }, [dateRange]);

    // Determine best time unit based on container width and date range
    const timeUnit: TimeUnit = useMemo(() => {
        if (containerWidth === 0) return 'days'; // Default before measuring
        
        const totalDays = differenceInDays(dateRange.end, dateRange.start) + 1;
        const minPixelsPerDay = 40; // Minimum comfortable width for a day column
        const minPixelsPerWeek = 60; // Minimum comfortable width for a week column
        
        // Try days first
        if (totalDays * minPixelsPerDay <= containerWidth) {
            return 'days';
        }
        
        // Try weeks
        const totalWeeks = Math.ceil(totalDays / 7);
        if (totalWeeks * minPixelsPerWeek <= containerWidth) {
            return 'weeks';
        }
        
        // Fall back to months
        return 'months';
    }, [containerWidth, dateRange]);

    // Generate timeline units (days, weeks, or months) based on determined time unit
    const timelineUnits = useMemo(() => {
        const units: Array<{ date: Date; label: string; sublabel?: string }> = [];
        
        if (timeUnit === 'days') {
            const totalDays = differenceInDays(dateRange.end, dateRange.start);
            for (let i = 0; i <= totalDays; i++) {
                const day = addDays(dateRange.start, i);
                units.push({
                    date: day,
                    label: format(day, 'd'),
                    sublabel: format(day, 'EEE')
                });
            }
        }
        else if (timeUnit === 'weeks') {
            let current = startOfWeek(dateRange.start, { weekStartsOn: 0 });
            while (current <= dateRange.end) {
                units.push({
                    date: current,
                    label: format(current, 'MMM d'),
                    sublabel: `Week ${format(current, 'w')}`
                });
                current = addWeeks(current, 1);
            }
        }
        else {
            let current = startOfMonth(dateRange.start);
            while (current <= dateRange.end) {
                units.push({
                    date: current,
                    label: format(current, 'MMM'),
                    sublabel: format(current, 'yyyy')
                });
                current = addMonths(current, 1);
            }
        }
        
        return units;
    }, [dateRange, timeUnit]);

    // Calculate pixel width per unit to fit container (no horizontal scrolling)
    const pixelsPerUnit = containerWidth > 0 && timelineUnits.length > 0 
        ? containerWidth / timelineUnits.length 
        : (timeUnit === 'days' ? 60 : timeUnit === 'weeks' ? 80 : 100);
    
    const totalWidth = containerWidth || timelineUnits.length * pixelsPerUnit;

    // Calculate event positions
    const eventPositions = useMemo(() => {
        return filteredEvents.map((event) => {
            const start = new Date(event.startTime);
            const end = event.endTime ? new Date(event.endTime) : addDays(start, 365);

            let startOffset: number, duration: number;
            
            if (timeUnit === 'days') {
                startOffset = differenceInDays(start, dateRange.start);
                duration = differenceInDays(end, start) + 1;
            }
            else if (timeUnit === 'weeks') {
                const startOfFirstWeek = startOfWeek(dateRange.start, { weekStartsOn: 0 });
                startOffset = differenceInWeeks(start, startOfFirstWeek);
                duration = differenceInWeeks(end, start) + 1;
            }
            else {
                const startOfFirstMonth = startOfMonth(dateRange.start);
                startOffset = differenceInMonths(start, startOfFirstMonth);
                duration = differenceInMonths(end, start) + 1;
            }

            return {
                ...event,
                left: Math.max(0, startOffset * pixelsPerUnit),
                width: Math.max(pixelsPerUnit * 0.8, duration * pixelsPerUnit),
                isOngoing: !event.endTime
            } as EventPosition;
        });
    }, [filteredEvents, dateRange.start, pixelsPerUnit, timeUnit]);

    const handleUnitClick = (date: Date) => {
        // Always show the specific day view
        const clicked = startOfDay(date);
        
        const eventsOnDay = filteredEvents.filter((e) => {
            const dayStart = startOfDay(clicked);
            const dayEnd = endOfDay(clicked);
            
            const start = new Date(e.startTime);
            const end = e.endTime ? new Date(e.endTime) : null;
            
            if (!end) {
                return start <= dayEnd;
            }
            
            return start <= dayEnd && end >= dayStart;
        });
        
        setSelectedDateEvents(eventsOnDay);
        setViewDate(clicked);
    };

    const handleBackToGantt = () => {
        setSelectedDateEvents(null);
        setViewDate(null);
    };

    const handleNavigatePrevious = () => {
        setPeriodOffset(prev => prev - 1);
    };

    const handleNavigateNext = () => {
        setPeriodOffset(prev => prev + 1);
    };

    const handleNavigateToday = () => {
        setPeriodOffset(0);
    };

    // Get the period label for navigation
    const getPeriodLabel = () => {
        const { start, end } = dateRange;
        switch (timeRange) {
        case 'week':
            return `Week of ${format(start, 'MMM d, yyyy')}`;
        case 'month':
            return format(start, 'MMMM yyyy');
        case 'year':
            return format(start, 'yyyy');
        case 'all':
            return 'All Events';
        default:
            return '';
        }
    };

    // Scroll to top on mount or when time range changes
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
    }, [timeRange, timeUnit]);

    // Reset period offset when time range changes
    useEffect(() => {
        setPeriodOffset(0);
    }, [timeRange]);

    // Measure container width
    useEffect(() => {
        const measureWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
            }
        };

        measureWidth();
        window.addEventListener('resize', measureWidth);
        return () => window.removeEventListener('resize', measureWidth);
    }, []);

    // Show day view if we have selected date events
    if (selectedDateEvents && viewDate) {
        return (
            <div className='max-w-5xl mx-auto p-4'>
                <div className='flex items-center gap-4 mb-4'>
                    <Button onClick={handleBackToGantt} variant='secondary'>
                        ← Back to Gantt View
                    </Button>
                    <h2 className='text-xl font-semibold'>Events on {format(viewDate, 'PPP')}</h2>
                </div>

                {selectedDateEvents.length === 0 ? (
                    <p className='text-gray-500 italic'>No events on this date.</p>
                ) : (
                    <ul className='space-y-3'>
                        {selectedDateEvents.map((event) => (
                            <li
                                key={event.id}
                                onClick={() => navigate(`/event/${event.id}`)}
                                className='p-4 rounded-lg shadow hover:shadow-md cursor-pointer border border-gray-300 bg-white hover:bg-gray-50 transition-colors'
                            >
                                <div className='flex items-start justify-between mb-2'>
                                    <p className='font-bold text-lg text-gray-900'>{event.title}</p>
                                    {event.location?.global ? (
                                        <span className='px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded'>
                                            🌐 Global
                                        </span>
                                    ) : (
                                        <span className='px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded'>
                                            📍 Local
                                        </span>
                                    )}
                                </div>
                                {event.description && (
                                    <p className='text-gray-600 text-sm mb-2'>{event.description}</p>
                                )}
                                <div className='space-y-1'>
                                    <p className='text-sm text-gray-700 flex items-center gap-2'>
                                        <Clock className='w-4 h-4' />
                                        {format(toZonedTime(new Date(event.startTime), tz), 'h:mm a')} –{' '}
                                        {event.endTime
                                            ? format(toZonedTime(new Date(event.endTime), tz), 'h:mm a')
                                            : 'Ongoing'}
                                    </p>
                                    {event.location?.name && !event.location.global && (
                                        <p className='text-sm text-gray-600 flex items-center gap-2'>
                                            <MapPin className='w-4 h-4' />
                                            {event.location.name}
                                        </p>
                                    )}
                                    {typeof event.participantCount === 'number' && event.participantCount > 0 && (
                                        <p className='text-sm text-blue-600 flex items-center gap-2'>
                                            <Users className='w-4 h-4' />
                                            {event.participantCount} participant{event.participantCount !== 1 ? 's' : ''}
                                        </p>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className='max-w-full mx-auto p-4'>
                <div className='flex items-center justify-center h-64'>
                    <div className='text-lg text-gray-600'>Loading events...</div>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className='max-w-full mx-auto p-4'>
                <div className='flex items-center justify-center h-64'>
                    <div className='text-lg text-red-600'>Failed to load events</div>
                </div>
            </div>
        );
    }

    return (
        <div className='max-w-full mx-auto p-4' style={{ overflowX: 'hidden' }}>
            {/* Header */}
            <div className='mb-4'>
                <div className='flex items-center justify-between mb-4'>
                    <div>
                        <h1 className='text-2xl font-bold'>Events Gantt Calendar</h1>
                        <p className='text-sm text-gray-600 mt-1'>
                            Viewing {timelineUnits.length} {timeUnit} • {filteredEvents.length} events
                        </p>
                    </div>
                    <Button onClick={() => navigate('/create-event')}>+ Create Event</Button>
                </div>

                {/* Controls */}
                <div className='flex flex-wrap items-center gap-3 mb-4'>
                    {/* Time Range Buttons */}
                    <div className='flex gap-2'>
                        {(['week', 'month', 'year', 'all'] as const).map((range) => (
                            <Button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                variant={timeRange === range ? 'primary' : 'secondary'}
                                className='capitalize'
                            >
                                {range === 'all' ? 'All Time' : `This ${range}`}
                            </Button>
                        ))}
                    </div>

                    {/* Filter Toggle */}
                    <Button
                        onClick={() => setShowFilters(!showFilters)}
                        variant='secondary'
                        className='ml-auto'
                    >
                        <Filter className='w-4 h-4 mr-2' />
                        Filters
                        {(filterText || locationFilter) && (
                            <span className='ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full'>
                                Active
                            </span>
                        )}
                    </Button>
                </div>

                {/* Filter Input */}
                {showFilters && (
                    <div className='mb-4 p-4 bg-gray-50 rounded-lg space-y-3'>
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>
                                Search Events
                            </label>
                            <input
                                type='text'
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                                placeholder='Filter by title, description, or location...'
                                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                            />
                        </div>

                        <div className='flex items-center gap-3'>
                            <label className='flex items-center gap-2 cursor-pointer'>
                                <input
                                    type='checkbox'
                                    checked={locationFilter}
                                    onChange={() => setLocationFilter(!locationFilter)}
                                    className='w-4 h-4'
                                />
                                <span className='text-sm font-medium text-gray-700'>
                                    Global events only
                                </span>
                            </label>
                        </div>

                        <p className='text-sm text-gray-600'>
                            Showing {filteredEvents.length} of {events.length} upcoming events
                        </p>
                    </div>
                )}
            </div>

            {/* Gantt Chart */}
            <div className='space-y-3'>
                {/* Navigation Controls */}
                {timeRange !== 'all' && (
                    <div className='flex items-center justify-between bg-gray-50 p-3 rounded-lg border'>
                        <Button
                            onClick={handleNavigatePrevious}
                            variant='secondary'
                            className='flex items-center gap-2'
                        >
                            <ChevronLeft className='w-4 h-4' />
                            Previous
                        </Button>
                        
                        <div className='flex items-center gap-3'>
                            <h3 className='text-lg font-semibold text-gray-900'>
                                {getPeriodLabel()}
                            </h3>
                            {periodOffset !== 0 && (
                                <Button
                                    onClick={handleNavigateToday}
                                    variant='secondary'
                                    className='text-sm'
                                >
                                    Today
                                </Button>
                            )}
                        </div>
                        
                        <Button
                            onClick={handleNavigateNext}
                            variant='secondary'
                            className='flex items-center gap-2'
                        >
                            Next
                            <ChevronRight className='w-4 h-4' />
                        </Button>
                    </div>
                )}

                <div ref={containerRef} className='border rounded-lg bg-white shadow-sm overflow-hidden'>
                    <div 
                        ref={scrollContainerRef}
                        className='overflow-y-auto'
                        style={{ maxHeight: '600px' }}
                    >
                        <div style={{ width: '100%' }}>
                            {/* Timeline Header */}
                            <div className='sticky top-0 z-10 bg-white border-b shadow-sm'>
                                <div style={{ height: '70px' }} className='relative flex'>
                                    {timelineUnits.map((unit, index) => {
                                        const isTodayUnit = isToday(unit.date);
                                        return (
                                            <div
                                                key={index}
                                                onClick={() => handleUnitClick(unit.date)}
                                                className={`border-r cursor-pointer hover:bg-blue-50 transition-colors ${
                                                    isTodayUnit ? 'bg-blue-100' : ''
                                                }`}
                                                style={{
                                                    width: `${pixelsPerUnit}px`,
                                                    minWidth: `${pixelsPerUnit}px`,
                                                    padding: pixelsPerUnit < 50 ? '0.25rem' : '0.5rem'
                                                }}
                                            >
                                                <div className='p-2 text-center h-full flex flex-col justify-center'>
                                                    <div
                                                        className={`text-xs font-medium uppercase tracking-wide truncate ${
                                                            isTodayUnit ? 'text-blue-600' : 'text-gray-500'
                                                        }`}
                                                        style={{ fontSize: pixelsPerUnit < 50 ? '0.65rem' : undefined }}
                                                    >
                                                        {unit.sublabel}
                                                    </div>
                                                    <div
                                                        className={`font-bold mt-1 truncate ${
                                                            isTodayUnit ? 'text-blue-600' : 'text-gray-900'
                                                        }`}
                                                        style={{ fontSize: pixelsPerUnit < 50 ? '0.9rem' : '1.125rem' }}
                                                    >
                                                        {unit.label}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                
                                    {/* Today marker */}
                                    {timelineUnits.findIndex(u => isToday(u.date)) >= 0 && (
                                        <div
                                            className='absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none'
                                            style={{ left: `${timelineUnits.findIndex(u => isToday(u.date)) * pixelsPerUnit}px` }}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Events Area */}
                            <div style={{ minHeight: '400px' }} className='relative bg-gray-50'>
                                {/* Grid lines */}
                                {timelineUnits.map((_, index) => (
                                    <div
                                        key={`grid-${index}`}
                                        className='absolute top-0 bottom-0 w-px bg-gray-200'
                                        style={{ left: `${index * pixelsPerUnit}px` }}
                                    />
                                ))}
                            
                                {/* Today line */}
                                {timelineUnits.findIndex(u => isToday(u.date)) >= 0 && (
                                    <div
                                        className='absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none'
                                        style={{ left: `${timelineUnits.findIndex(u => isToday(u.date)) * pixelsPerUnit}px` }}
                                    />
                                )}
                            
                                {eventPositions.length === 0 ? (
                                    <div className='absolute inset-0 flex items-center justify-center text-gray-500'>
                                        <div className='text-center'>
                                            <CalendarIcon className='w-12 h-12 mx-auto mb-2 text-gray-400' />
                                            <p>No upcoming events to display</p>
                                        </div>
                                    </div>
                                ) : (
                                    eventPositions.map((event, index) => (
                                        <div
                                            key={event.id}
                                            onClick={() => setSelectedEvent(event)}
                                            className={`absolute rounded-lg shadow-md cursor-pointer transition-all hover:shadow-xl hover:z-20 ${
                                                event.isOngoing
                                                    ? 'bg-gradient-to-r from-purple-500 to-purple-600'
                                                    : event.location?.global
                                                        ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                                                        : 'bg-gradient-to-r from-green-500 to-green-600'
                                            }`}
                                            style={{
                                                left: `${event.left}px`,
                                                top: `${index * 90 + 10}px`,
                                                width: `${event.width}px`,
                                                height: '75px',
                                                minWidth: timeUnit === 'days' ? '60px' : timeUnit === 'weeks' ? '80px' : '100px'
                                            }}
                                        >
                                            <div className='p-3 h-full flex flex-col justify-between text-white overflow-hidden'>
                                                <div>
                                                    <div className='font-bold text-sm mb-1 truncate' title={event.title}>
                                                        {event.title}
                                                    </div>
                                                    <div className='text-xs opacity-90 line-clamp-2'>
                                                        {event.description}
                                                    </div>
                                                </div>
                                                <div className='flex items-center justify-between text-xs opacity-90 pt-1 border-t border-white/20'>
                                                    <span className='flex items-center gap-1 truncate'>
                                                        {event.location?.global ? (
                                                            <span>🌐 Online</span>
                                                        ) : event.location?.name ? (
                                                            <span className='truncate'>📍 {event.location.name}</span>
                                                        ) : (
                                                            <span>📍 TBD</span>
                                                        )}
                                                    </span>
                                                    {event.participantCount > 0 && (
                                                        <span className='flex items-center gap-1 ml-2'>
                                                            <Users className='w-3 h-3' />
                                                            {event.participantCount}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className='mt-4 flex flex-wrap gap-4 text-sm'>
                    <div className='flex items-center gap-2'>
                        <div className='w-4 h-4 rounded bg-gradient-to-r from-green-500 to-green-600'></div>
                        <span>Local Event</span>
                    </div>
                    <div className='flex items-center gap-2'>
                        <div className='w-4 h-4 rounded bg-gradient-to-r from-blue-500 to-blue-600'></div>
                        <span>Global Event</span>
                    </div>
                    <div className='flex items-center gap-2'>
                        <div className='w-4 h-4 rounded bg-gradient-to-r from-purple-500 to-purple-600'></div>
                        <span>Ongoing Event</span>
                    </div>
                    <div className='flex items-center gap-2 ml-auto'>
                        <div className='w-0.5 h-4 bg-red-500'></div>
                        <span>Today</span>
                    </div>
                </div>

                {/* Event Details Modal */}
                {selectedEvent && (
                    <EventDetailsModal
                        event={selectedEvent}
                        onClose={() => setSelectedEvent(null)}
                        onViewDay={handleUnitClick}
                    />
                )}
            </div>
    );
        </div>

    );
}