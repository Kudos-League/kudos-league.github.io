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
import { Filter, X, MapPin, Users, Clock, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { EventDTO, UserDTO } from '@/shared/api/types';
import { useEvents } from '@/shared/api/queries/events';
import { getImagePath } from '@/shared/api/config';
import Button from '@/components/common/Button';
import UserCard from '../users/UserCard';
import { apiGet } from '@/shared/api/apiClient';

interface EventDetailsModalProps {
    event: EventDTO | null;
    onClose: () => void;
    onViewPeriod: (date: Date, unit: 'day' | 'week' | 'month') => void;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ event, onClose, onViewPeriod }) => {
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
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200] p-4'>
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
                                onViewPeriod(new Date(event.startTime), 'day');
                                onClose();
                            }}
                            variant='secondary'
                            className='flex items-center gap-2'
                        >
                            <Calendar className='w-4 h-4' />
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

type TimeUnit = 'days' | 'weeks' | 'months';

export default function GanttEventsCalendar() {
    const navigate = useNavigate();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);

    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('week');
    const [filterText, setFilterText] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<EventDTO | null>(null);
    const [viewDate, setViewDate] = useState<Date | null>(null);
    const [viewPeriodType, setViewPeriodType] = useState<'day' | 'week' | 'month' | null>(null);
    const [selectedPeriodEvents, setSelectedPeriodEvents] = useState<EventDTO[] | null>(null);
    const [locationFilter, setLocationFilter] = useState(false);
    const [periodOffset, setPeriodOffset] = useState(0);
    const [visibleEventCount, setVisibleEventCount] = useState(10);
    const [useCustomRange, setUseCustomRange] = useState(false);
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [useDuration, setUseDuration] = useState(false);
    const [durationValue, setDurationValue] = useState(7);
    const [durationUnit, setDurationUnit] = useState<'days' | 'weeks' | 'months'>('days');
    const [showPeriodPicker, setShowPeriodPicker] = useState(false);
    const [showingRangeEvents, setShowingRangeEvents] = useState(false);
    const [eventIDToUserMap, setEventIDToUserMap] = useState<Record<string, UserDTO>>({});
    const [fetchedCreatorIds, setFetchedCreatorIds] = useState<Array<number>>([]);

    const { data: allEvents = [], isLoading, isError } = useEvents({ filter: 'all' });

    const events = useMemo(() => {
        const now = new Date();
        return allEvents.filter((event) => {
            const eventEnd = event.endTime ? new Date(event.endTime) : null;
            return !eventEnd || eventEnd >= now;
        });
    }, [allEvents]);

    const dateRange = useMemo(() => {
        // Use custom date range if enabled
        if (useCustomRange && customStartDate) {
            const start = startOfDay(new Date(customStartDate));
            let end: Date;
            
            if (useDuration) {
                // Calculate end date based on duration
                switch (durationUnit) {
                case 'days':
                    end = endOfDay(addDays(start, durationValue - 1));
                    break;
                case 'weeks':
                    end = endOfDay(addDays(start, durationValue * 7 - 1));
                    break;
                case 'months':
                    end = endOfDay(addMonths(start, durationValue));
                    break;
                }
            }
            else if (customEndDate) {
                end = endOfDay(new Date(customEndDate));
            }
            else {
                // Default to one month if no end date specified
                end = endOfMonth(start);
            }
            
            return { start, end };
        }
        
        // Use default time range selection
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
                const eventDates = events.map((e) => 
                    e.endTime ? new Date(e.endTime) : addDays(new Date(e.startTime), 365)
                );
                end = new Date(Math.max(...eventDates.map((d) => d.getTime())));
                end = addDays(end, 7);
            }
            break;
        }

        return { start, end };
    }, [timeRange, periodOffset, events, useCustomRange, customStartDate, customEndDate, useDuration, durationValue, durationUnit]);

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

    const timeUnit: TimeUnit = useMemo(() => {
        if (containerWidth === 0) return 'days';
        
        const totalDays = differenceInDays(dateRange.end, dateRange.start) + 1;
        const minPixelsPerDay = 40;
        const minPixelsPerWeek = 60;
        
        if (totalDays * minPixelsPerDay <= containerWidth) {
            return 'days';
        }
        
        const totalWeeks = Math.ceil(totalDays / 7);
        if (totalWeeks * minPixelsPerWeek <= containerWidth) {
            return 'weeks';
        }
        
        return 'months';
    }, [containerWidth, dateRange]);

    const timelineUnits = useMemo(() => {
        const units: Array<{ date: Date; label: string; sublabel?: string; showMonth?: boolean }> = [];
        
        if (timeUnit === 'days') {
            const totalDays = differenceInDays(dateRange.end, dateRange.start);
            let lastMonth = '';
            for (let i = 0; i <= totalDays; i++) {
                const day = addDays(dateRange.start, i);
                const currentMonth = format(day, 'MMM');
                const showMonth = currentMonth !== lastMonth;
                lastMonth = currentMonth;
                
                units.push({
                    date: day,
                    label: format(day, 'd'),
                    sublabel: format(day, 'EEE').charAt(0),
                    showMonth
                });
            }
        }
        else if (timeUnit === 'weeks') {
            let current = startOfWeek(dateRange.start, { weekStartsOn: 0 });
            while (current <= dateRange.end) {
                units.push({
                    date: current,
                    label: format(current, 'd'),
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

    const pixelsPerUnit = containerWidth > 0 && timelineUnits.length > 0 
        ? containerWidth / timelineUnits.length 
        : (timeUnit === 'days' ? 60 : timeUnit === 'weeks' ? 80 : 100);

    const todayPosition = useMemo(() => {
        const now = startOfDay(new Date());
        
        if (now < dateRange.start || now > dateRange.end) {
            return null;
        }
        
        if (timeUnit === 'days') {
            const dayIndex = timelineUnits.findIndex(u => isSameDay(u.date, now));
            if (dayIndex < 0) return null;
            return dayIndex * pixelsPerUnit;
        }
        else if (timeUnit === 'weeks') {
            const weekIndex = timelineUnits.findIndex(u => {
                const weekStart = startOfWeek(u.date, { weekStartsOn: 0 });
                const weekEnd = endOfWeek(u.date, { weekStartsOn: 0 });
                return now >= weekStart && now <= weekEnd;
            });
            if (weekIndex < 0) return null;
            
            const weekStart = startOfWeek(timelineUnits[weekIndex].date, { weekStartsOn: 0 });
            const daysIntoWeek = differenceInDays(now, weekStart);
            const proportionIntoWeek = daysIntoWeek / 7;
            
            return weekIndex * pixelsPerUnit + proportionIntoWeek * pixelsPerUnit;
        }
        else {
            const monthIndex = timelineUnits.findIndex(u => {
                const monthStart = startOfMonth(u.date);
                const monthEnd = endOfMonth(u.date);
                return now >= monthStart && now <= monthEnd;
            });
            if (monthIndex < 0) return null;
            
            const monthStart = startOfMonth(timelineUnits[monthIndex].date);
            const monthEnd = endOfMonth(timelineUnits[monthIndex].date);
            const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
            const daysIntoMonth = differenceInDays(now, monthStart);
            const proportionIntoMonth = daysIntoMonth / daysInMonth;
            
            return monthIndex * pixelsPerUnit + proportionIntoMonth * pixelsPerUnit;
        }
    }, [timelineUnits, pixelsPerUnit, timeUnit, dateRange]);

    const handleUnitClick = (date: Date) => {
        const clicked = startOfDay(date);
        let periodStart: Date, periodEnd: Date, periodType: 'day' | 'week' | 'month';
        
        if (timeUnit === 'days') {
            periodStart = startOfDay(clicked);
            periodEnd = endOfDay(clicked);
            periodType = 'day';
        }
        else if (timeUnit === 'weeks') {
            periodStart = startOfWeek(clicked, { weekStartsOn: 0 });
            periodEnd = endOfWeek(clicked, { weekStartsOn: 0 });
            periodType = 'week';
        }
        else {
            periodStart = startOfMonth(clicked);
            periodEnd = endOfMonth(clicked);
            periodType = 'month';
        }
        
        const eventsInPeriod = filteredEvents.filter((e) => {
            const start = new Date(e.startTime);
            const end = e.endTime ? new Date(e.endTime) : null;
            
            if (!end) {
                return start <= periodEnd;
            }
            
            return start <= periodEnd && end >= periodStart;
        }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        
        setSelectedPeriodEvents(eventsInPeriod);
        setViewDate(clicked);
        setViewPeriodType(periodType);
        setShowingRangeEvents(false);
    };

    const handleBackToGantt = () => {
        setSelectedPeriodEvents(null);
        setViewDate(null);
        setViewPeriodType(null);
        setShowingRangeEvents(false);
    };

    const handleShowRangeEvents = () => {
        const { start, end } = dateRange;
        
        const eventsInRange = filteredEvents.filter((e) => {
            const eventStart = new Date(e.startTime);
            const eventEnd = e.endTime ? new Date(e.endTime) : null;
            
            if (!eventEnd) {
                return eventStart <= end;
            }
            
            return eventStart <= end && eventEnd >= start;
        }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        
        setSelectedPeriodEvents(eventsInRange);
        setViewDate(start);
        setViewPeriodType(useCustomRange ? 'day' : timeRange === 'week' ? 'week' : timeRange === 'month' ? 'month' : 'day');
        setShowingRangeEvents(true);
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

    const handleJumpToPeriod = (periodType: 'this-week' | 'next-week' | 'this-month' | 'next-month' | 'week-number', weekNumber?: number) => {
        const now = new Date();
        
        if (periodType === 'this-week') {
            const weekStart = startOfWeek(now, { weekStartsOn: 0 });
            const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
            setUseCustomRange(true);
            setCustomStartDate(format(weekStart, 'yyyy-MM-dd'));
            setCustomEndDate(format(weekEnd, 'yyyy-MM-dd'));
            setUseDuration(false);
        }
        else if (periodType === 'next-week') {
            const nextWeekStart = startOfWeek(addWeeks(now, 1), { weekStartsOn: 0 });
            const nextWeekEnd = endOfWeek(addWeeks(now, 1), { weekStartsOn: 0 });
            setUseCustomRange(true);
            setCustomStartDate(format(nextWeekStart, 'yyyy-MM-dd'));
            setCustomEndDate(format(nextWeekEnd, 'yyyy-MM-dd'));
            setUseDuration(false);
        }
        else if (periodType === 'this-month') {
            const monthStart = startOfMonth(now);
            const monthEnd = endOfMonth(now);
            setUseCustomRange(true);
            setCustomStartDate(format(monthStart, 'yyyy-MM-dd'));
            setCustomEndDate(format(monthEnd, 'yyyy-MM-dd'));
            setUseDuration(false);
        }
        else if (periodType === 'next-month') {
            const nextMonthStart = startOfMonth(addMonths(now, 1));
            const nextMonthEnd = endOfMonth(addMonths(now, 1));
            setUseCustomRange(true);
            setCustomStartDate(format(nextMonthStart, 'yyyy-MM-dd'));
            setCustomEndDate(format(nextMonthEnd, 'yyyy-MM-dd'));
            setUseDuration(false);
        }
        else if (periodType === 'week-number' && weekNumber) {
            // Calculate the start date of the given week number in current year
            const yearStart = startOfYear(now);
            const targetWeekStart = addWeeks(yearStart, weekNumber - 1);
            const targetWeekEnd = endOfWeek(targetWeekStart, { weekStartsOn: 0 });
            setUseCustomRange(true);
            setCustomStartDate(format(startOfWeek(targetWeekStart, { weekStartsOn: 0 }), 'yyyy-MM-dd'));
            setCustomEndDate(format(targetWeekEnd, 'yyyy-MM-dd'));
            setUseDuration(false);
        }
        
        setShowPeriodPicker(false);
    };

    const getPeriodLabel = () => {
        if (useCustomRange && customStartDate) {
            const start = new Date(customStartDate);
            if (useDuration) {
                return `${format(start, 'MMM d, yyyy')} (${durationValue} ${durationUnit})`;
            }
            else if (customEndDate) {
                return `${format(start, 'MMM d, yyyy')} - ${format(new Date(customEndDate), 'MMM d, yyyy')}`;
            }
            else {
                return format(start, 'MMM d, yyyy');
            }
        }
        
        const { start } = dateRange;
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

    const getViewPeriodLabel = () => {
        if (!viewDate) return '';
        
        if (showingRangeEvents) {
            const { start, end } = dateRange;
            if (useCustomRange) {
                return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
            }
            return getPeriodLabel();
        }
        
        if (viewPeriodType === 'day') {
            return format(viewDate, 'PPP');
        }
        else if (viewPeriodType === 'week') {
            const weekStart = startOfWeek(viewDate, { weekStartsOn: 0 });
            const weekEnd = endOfWeek(viewDate, { weekStartsOn: 0 });
            return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
        }
        else {
            return format(viewDate, 'MMMM yyyy');
        }
    };

    useEffect(() => {
        setVisibleEventCount(10);
    }, [timeRange, timeUnit, filterText, locationFilter]);

    useEffect(() => {
        setPeriodOffset(0);
    }, [timeRange]);

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
    useEffect(() => {
        const fetchCreators = async () => {
        // Get unique creator IDs that we haven't attempted to fetch yet
            const creatorIdsToFetch = new Array<number>();
        
            events.forEach(event => {
                if (event.creatorID && !fetchedCreatorIds.includes(event.creatorID)) {
                    creatorIdsToFetch.push(event.creatorID);
                }
            });

            if (creatorIdsToFetch.length === 0) return;
        
            console.log(`Fetching ${creatorIdsToFetch.length} unique creators`);

            // Mark these IDs as "attempted" to prevent retries
            setFetchedCreatorIds(prev => Array.from(new Set([...prev, ...creatorIdsToFetch])));

            // Fetch creators with a small delay between requests
            const updates: Record<number, UserDTO> = {};
    
            for (const creatorId of creatorIdsToFetch) {
                try {
                    const creator = await apiGet<UserDTO>(`/users/${creatorId}`);
                    updates[creatorId] = creator;
                    console.log(`✓ Fetched creator ${creatorId}: ${creator.username}`);
                
                    // Small delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                catch (error) {
                    console.error(`✗ Failed to fetch creator ${creatorId}:`, error);
                // Don't add to updates, but we've marked it as attempted
                }
            }

            // Update the map with successfully fetched creators
            if (Object.keys(updates).length > 0) {
                setEventIDToUserMap(prev => {
                    const newMap = { ...prev, ...updates };
                    console.log(`Updated map: ${Object.keys(newMap).length} total creators`);
                    return newMap;
                });
            }
        };

        fetchCreators();
    }, [events, fetchedCreatorIds]); // Include fetchedCreatorIds but we control when it changes

    // Optional: Add a separate effect to log when the map actually updates
    useEffect(() => {
        console.log(`eventIDToUserMap updated: ${Object.keys(eventIDToUserMap).length} entries`);
    }, [eventIDToUserMap]);// ✅ Only depend on events



    if (selectedPeriodEvents && viewDate) {
        return (
            <div className='max-w-5xl mx-auto p-3 sm:p-4'>
                <div className='flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4'>
                    <Button onClick={handleBackToGantt} variant='secondary' className='text-sm w-full sm:w-auto flex items-center justify-center gap-2'>
                        <ChevronLeft className='w-4 h-4' />
                        Back to Calendar
                    </Button>
                    <div className='flex-1'>
                        <h2 className='text-base sm:text-xl font-semibold'>
                            {showingRangeEvents ? 'Events during ' : `Events ${viewPeriodType === 'day' ? 'on' : 'during'} `}
                            {getViewPeriodLabel()}
                        </h2>
                        <p className='text-xs sm:text-sm text-gray-600 mt-0.5'>
                            {selectedPeriodEvents.length} event{selectedPeriodEvents.length !== 1 ? 's' : ''} found
                        </p>
                    </div>
                </div>

                {selectedPeriodEvents.length === 0 ? (
                    <div className='flex items-center justify-center text-gray-500 py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300'>
                        <div className='text-center'>
                            <Calendar className='w-12 h-12 mx-auto mb-2 text-gray-400' />
                            <p className='text-sm sm:text-base font-medium'>No events during this period</p>
                            <p className='text-xs text-gray-400 mt-1'>Try selecting a different time range</p>
                        </div>
                    </div>
                ) : (
                    <ul className='space-y-2 sm:space-y-3'>
                        {selectedPeriodEvents.map((event) => (
                            <li
                                key={event.id}
                                onClick={() => navigate(`/event/${event.id}`)}
                                className='p-3 sm:p-4 rounded-lg shadow hover:shadow-md cursor-pointer border border-gray-300 bg-white hover:bg-gray-50 transition-colors'
                            >
                                <div className='flex items-start justify-between mb-1.5 sm:mb-2'>
                                    <p className='font-bold text-base sm:text-lg text-gray-900'>{event.title}</p>
                                    {event.location?.global ? (
                                        <span className='px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-100 text-blue-700 text-[0.65rem] sm:text-xs font-medium rounded whitespace-nowrap ml-2'>
                                            🌐 Global
                                        </span>
                                    ) : (
                                        <span className='px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-100 text-green-700 text-[0.65rem] sm:text-xs font-medium rounded whitespace-nowrap ml-2'>
                                            📍 Local
                                        </span>
                                    )}
                                </div>
                                {event.description && (
                                    <p className='text-gray-600 text-xs sm:text-sm mb-1.5 sm:mb-2'>{event.description}</p>
                                )}
                                <div className='space-y-0.5 sm:space-y-1'>
                                    <p className='text-xs sm:text-sm text-gray-700 flex items-center gap-1.5 sm:gap-2'>
                                        <Clock className='w-3 h-3 sm:w-4 sm:h-4' />
                                        <span className='truncate'>
                                            {format(toZonedTime(new Date(event.startTime), tz), 'MMM d, yyyy • h:mm a')} –{' '}
                                            {event.endTime
                                                ? format(toZonedTime(new Date(event.endTime), tz), 'MMM d, yyyy • h:mm a')
                                                : 'Ongoing'}
                                        </span>
                                    </p>
                                    {event.location?.name && !event.location.global && (
                                        <p className='text-xs sm:text-sm text-gray-600 flex items-center gap-1.5 sm:gap-2'>
                                            <MapPin className='w-3 h-3 sm:w-4 sm:h-4' />
                                            {event.location.name}
                                        </p>
                                    )}
                                    {event.creatorID && eventIDToUserMap[event.id] && (
                                        <p className='text-xs sm:text-sm text-gray-600 flex items-center gap-1.5 sm:gap-2'>
                                            <UserCard user={eventIDToUserMap[event.id]} />
                                        </p>
                                    )}
                                    {typeof event.participantCount === 'number' && event.participantCount > 0 && (
                                        <p className='text-xs sm:text-sm text-blue-600 flex items-center gap-1.5 sm:gap-2'>
                                            <Users className='w-3 h-3 sm:w-4 sm:h-4' />
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
            <div className='max-w-full mx-auto p-3 sm:p-4'>
                <div className='flex items-center justify-center h-64'>
                    <div className='text-base sm:text-lg text-gray-600'>Loading events...</div>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className='max-w-full mx-auto p-3 sm:p-4'>
                <div className='flex items-center justify-center h-64'>
                    <div className='text-base sm:text-lg text-red-600'>Failed to load events</div>
                </div>
            </div>
        );
    }

    return (
        <div className='max-w-full mx-auto p-3 sm:p-4'>
            <div className='mb-3 sm:mb-4'>
                <div className='flex items-center justify-between mb-4'>
                    <div>
                        <h1 className='text-xl sm:text-2xl font-bold'>Events Calendar</h1>
                        <p className='text-xs sm:text-sm text-gray-600 mt-1'>
                            Viewing {timelineUnits.length} {timeUnit} • {filteredEvents.length} events
                        </p>
                    </div>
                    <Button onClick={() => navigate('/create-event')} className='text-sm sm:text-base'>
                        <span className='hidden sm:inline'>+ Create Event</span>
                        <span className='sm:hidden'>+ New</span>
                    </Button>
                </div>

                <div className='flex flex-wrap items-center gap-2 sm:gap-3 mb-4'>
                    <div className='flex gap-2'>
                        {(['week', 'month', 'year', 'all'] as const).map((range) => (
                            <Button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                variant={timeRange === range ? 'primary' : 'secondary'}
                                className='capitalize text-xs sm:text-sm px-2 sm:px-4'
                            >
                                {range === 'all' ? 'All Time' : `This ${range}`}
                            </Button>
                        ))}
                    </div>

                    <Button
                        onClick={() => setShowPeriodPicker(!showPeriodPicker)}
                        variant='secondary'
                        className='text-xs sm:text-sm'
                    >
                        <Calendar className='w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2' />
                        Jump to Period
                    </Button>

                    <Button
                        onClick={() => setShowFilters(!showFilters)}
                        variant='secondary'
                        className='ml-auto text-xs sm:text-sm'
                    >
                        <Filter className='w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2' />
                        Filters
                        {(filterText || locationFilter || useCustomRange) && (
                            <span className='ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full'>
                                Active
                            </span>
                        )}
                    </Button>
                </div>

                {showPeriodPicker && (
                    <div className='mb-3 sm:mb-4 p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200'>
                        <div className='flex items-center justify-between mb-3'>
                            <h3 className='text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2'>
                                <Calendar className='w-4 h-4' />
                                Jump to Period
                            </h3>
                            <button
                                onClick={() => setShowPeriodPicker(false)}
                                className='text-gray-500 hover:text-gray-700'
                            >
                                <X className='w-4 h-4' />
                            </button>
                        </div>

                        <div className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
                            <button
                                onClick={() => handleJumpToPeriod('this-week')}
                                className='px-3 py-2 bg-white hover:bg-blue-100 border border-blue-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:text-blue-700 transition-colors'
                            >
                                This Week
                            </button>
                            <button
                                onClick={() => handleJumpToPeriod('next-week')}
                                className='px-3 py-2 bg-white hover:bg-blue-100 border border-blue-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:text-blue-700 transition-colors'
                            >
                                Next Week
                            </button>
                            <button
                                onClick={() => handleJumpToPeriod('this-month')}
                                className='px-3 py-2 bg-white hover:bg-blue-100 border border-blue-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:text-blue-700 transition-colors'
                            >
                                This Month
                            </button>
                            <button
                                onClick={() => handleJumpToPeriod('next-month')}
                                className='px-3 py-2 bg-white hover:bg-blue-100 border border-blue-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:text-blue-700 transition-colors'
                            >
                                Next Month
                            </button>
                        </div>

                        <div className='mt-3 pt-3 border-t border-blue-200'>
                            <label className='block text-xs sm:text-sm font-medium text-gray-700 mb-2'>
                                Jump to Week Number
                            </label>
                            <div className='flex gap-2'>
                                <input
                                    type='number'
                                    min='1'
                                    max='53'
                                    placeholder='Week #'
                                    id='week-number-input'
                                    className='flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                />
                                <button
                                    onClick={() => {
                                        const input = document.getElementById('week-number-input') as HTMLInputElement;
                                        const weekNum = parseInt(input.value);
                                        if (weekNum >= 1 && weekNum <= 53) {
                                            handleJumpToPeriod('week-number', weekNum);
                                        }
                                    }}
                                    className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors'
                                >
                                    Go
                                </button>
                            </div>
                            <p className='mt-1 text-[0.65rem] sm:text-xs text-gray-600'>
                                Current week: {format(new Date(), 'w')} of {format(new Date(), 'yyyy')}
                            </p>
                        </div>
                    </div>
                )}

                {showFilters && (
                    <div className='mb-3 sm:mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg space-y-3 sm:space-y-4'>
                        <div>
                            <label className='block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2'>
                                Search Events
                            </label>
                            <input
                                type='text'
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                                placeholder='Filter by title, description, or location...'
                                className='w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                            />
                        </div>

                        <div className='flex items-center gap-2 sm:gap-3'>
                            <label className='flex items-center gap-1.5 sm:gap-2 cursor-pointer'>
                                <input
                                    type='checkbox'
                                    checked={locationFilter}
                                    onChange={() => setLocationFilter(!locationFilter)}
                                    className='w-3.5 h-3.5 sm:w-4 sm:h-4'
                                />
                                <span className='text-xs sm:text-sm font-medium text-gray-700'>
                                    Global events only
                                </span>
                            </label>
                        </div>

                        <div className='border-t pt-3 sm:pt-4'>
                            <div className='flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3'>
                                <input
                                    type='checkbox'
                                    id='customRange'
                                    checked={useCustomRange}
                                    onChange={(e) => {
                                        setUseCustomRange(e.target.checked);
                                        if (!e.target.checked) {
                                            setCustomStartDate('');
                                            setCustomEndDate('');
                                        }
                                    }}
                                    className='w-3.5 h-3.5 sm:w-4 sm:h-4'
                                />
                                <label htmlFor='customRange' className='text-xs sm:text-sm font-medium text-gray-700'>
                                    Custom Date Range
                                </label>
                            </div>

                            {useCustomRange && (
                                <div className='space-y-2 sm:space-y-3 ml-4 sm:ml-6'>
                                    <div>
                                        <label className='block text-xs sm:text-sm font-medium text-gray-600 mb-1'>
                                            Start Date
                                        </label>
                                        <input
                                            type='date'
                                            value={customStartDate}
                                            onChange={(e) => setCustomStartDate(e.target.value)}
                                            className='w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        />
                                    </div>

                                    <div className='flex items-center gap-1.5 sm:gap-2'>
                                        <input
                                            type='radio'
                                            id='useEndDate'
                                            checked={!useDuration}
                                            onChange={() => setUseDuration(false)}
                                            className='w-3.5 h-3.5 sm:w-4 sm:h-4'
                                        />
                                        <label htmlFor='useEndDate' className='text-xs sm:text-sm text-gray-700'>
                                            Specify End Date
                                        </label>
                                    </div>

                                    {!useDuration && (
                                        <div className='ml-4 sm:ml-6'>
                                            <label className='block text-xs sm:text-sm font-medium text-gray-600 mb-1'>
                                                End Date
                                            </label>
                                            <input
                                                type='date'
                                                value={customEndDate}
                                                onChange={(e) => setCustomEndDate(e.target.value)}
                                                min={customStartDate}
                                                className='w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                            />
                                        </div>
                                    )}

                                    <div className='flex items-center gap-1.5 sm:gap-2'>
                                        <input
                                            type='radio'
                                            id='useDuration'
                                            checked={useDuration}
                                            onChange={() => setUseDuration(true)}
                                            className='w-3.5 h-3.5 sm:w-4 sm:h-4'
                                        />
                                        <label htmlFor='useDuration' className='text-xs sm:text-sm text-gray-700'>
                                            Specify Duration
                                        </label>
                                    </div>

                                    {useDuration && (
                                        <div className='ml-4 sm:ml-6 flex gap-2'>
                                            <div className='flex-1'>
                                                <label className='block text-xs sm:text-sm font-medium text-gray-600 mb-1'>
                                                    Duration
                                                </label>
                                                <input
                                                    type='number'
                                                    min='1'
                                                    value={durationValue}
                                                    onChange={(e) => setDurationValue(Math.max(1, parseInt(e.target.value) || 1))}
                                                    className='w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                                />
                                            </div>
                                            <div className='flex-1'>
                                                <label className='block text-xs sm:text-sm font-medium text-gray-600 mb-1'>
                                                    Unit
                                                </label>
                                                <select
                                                    value={durationUnit}
                                                    onChange={(e) => setDurationUnit(e.target.value as 'days' | 'weeks' | 'months')}
                                                    className='w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                                >
                                                    <option value='days'>Days</option>
                                                    <option value='weeks'>Weeks</option>
                                                    <option value='months'>Months</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {customStartDate && (
                                        <div className='text-[0.65rem] sm:text-xs text-gray-600 bg-blue-50 p-2 rounded'>
                                            <strong>Range:</strong> {format(new Date(customStartDate), 'MMM d, yyyy')} 
                                            {' → '}
                                            {useDuration ? (
                                                format(
                                                    durationUnit === 'days' 
                                                        ? addDays(new Date(customStartDate), durationValue - 1)
                                                        : durationUnit === 'weeks'
                                                            ? addDays(new Date(customStartDate), durationValue * 7 - 1)
                                                            : addMonths(new Date(customStartDate), durationValue),
                                                    'MMM d, yyyy'
                                                )
                                            ) : customEndDate ? (
                                                format(new Date(customEndDate), 'MMM d, yyyy')
                                            ) : (
                                                'Select end date'
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <p className='text-xs sm:text-sm text-gray-600 pt-2 sm:pt-3 border-t'>
                            Showing {filteredEvents.length} of {events.length} upcoming events
                        </p>
                    </div>
                )}
            </div>

            <div className='space-y-2 sm:space-y-3'>
                {/* Legend and Show Events Button */}
                <div className='flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between'>
                    <div className='flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm bg-gray-50 p-2 sm:p-3 rounded-lg border flex-1 hidden'>
                        <div className='flex items-center gap-1.5 sm:gap-2'>
                            <div className='w-3 h-3 sm:w-4 sm:h-4 rounded bg-gradient-to-r from-green-500 to-green-600'></div>
                        </div>
                        <div className='flex items-center gap-1.5 sm:gap-2'>
                            <div className='w-3 h-3 sm:w-4 sm:h-4 rounded bg-gradient-to-r from-blue-500 to-blue-600'></div>
                        </div>
                        <div className='flex items-center gap-1.5 sm:gap-2 ml-auto'>
                            <div className='w-0.5 h-3 sm:h-4 bg-red-500'></div>
                        </div>
                    </div>
                    
                    <Button
                        onClick={handleShowRangeEvents}
                        variant='primary'
                        className='text-xs sm:text-sm whitespace-nowrap'
                    >
                        Show Events during selected time period
                    </Button>
                </div>

                {/* Timeline Ruler - Sticky */}
                <div className='sticky top-0 z-[100] bg-white shadow-md rounded-lg border'>
                    {/* Navigation and Month/Year Header */}
                    {(timeRange !== 'all' && !useCustomRange) && (
                        <div className='flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 p-2 sm:p-3 border-b'>
                            <button
                                onClick={handleNavigatePrevious}
                                className='p-1.5 sm:p-2 hover:bg-white rounded-lg transition-colors'
                            >
                                <ChevronLeft className='w-4 h-4 sm:w-5 sm:h-5' />
                            </button>
                            
                            <div className='flex items-center gap-2 sm:gap-3'>
                                <h3 className='text-sm sm:text-base md:text-lg font-semibold text-gray-900'>
                                    {getPeriodLabel()}
                                </h3>
                                {periodOffset !== 0 && (
                                    <button
                                        onClick={handleNavigateToday}
                                        className='px-2 py-0.5 sm:px-3 sm:py-1 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                                    >
                                        Today
                                    </button>
                                )}
                            </div>
                            
                            <button
                                onClick={handleNavigateNext}
                                className='p-1.5 sm:p-2 hover:bg-white rounded-lg transition-colors'
                            >
                                <ChevronRight className='w-4 h-4 sm:w-5 sm:h-5' />
                            </button>
                        </div>
                    )}
                    
                    {/* Custom Range Header */}
                    {useCustomRange && (
                        <div className='flex items-center justify-center bg-gradient-to-r from-blue-50 to-blue-100 p-2 sm:p-3 border-b'>
                            <h3 className='text-sm sm:text-base md:text-lg font-semibold text-gray-900'>
                                {getPeriodLabel()}
                            </h3>
                        </div>
                    )}

                    {/* Timeline Units */}
                    <div ref={containerRef} className='relative bg-white'>
                        {todayPosition !== null && todayPosition <= containerWidth && (
                            <div
                                className='absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none'
                                style={{ 
                                    left: `${Math.min(todayPosition, containerWidth - 2)}px`,
                                    zIndex: 50
                                }}
                            />
                        )}
                        
                        {/* Month header row - only for days view */}
                        {timeUnit === 'days' && (
                            <div className='flex border-b bg-gray-50'>
                                {timelineUnits.map((unit, index) => {
                                    if (!unit.showMonth) return null;
                                    
                                    // Calculate colspan - how many days in this month
                                    let colspan = 1;
                                    for (let i = index + 1; i < timelineUnits.length; i++) {
                                        if (timelineUnits[i].showMonth) break;
                                        colspan++;
                                    }
                                    
                                    const availableWidth = pixelsPerUnit * colspan;
                                    let monthText = '';
                                    
                                    if (availableWidth > 120) {
                                        monthText = format(unit.date, 'MMMM yyyy');
                                    }
                                    else if (availableWidth > 60) {
                                        monthText = format(unit.date, 'MMM yyyy');
                                    }
                                    else if (availableWidth > 40) {
                                        monthText = format(unit.date, 'MMM');
                                    }
                                    else {
                                        monthText = format(unit.date, 'MMM').charAt(0);
                                    }
                                    
                                    return (
                                        <div
                                            key={`month-${index}`}
                                            className='text-center py-1 text-[0.7rem] sm:text-xs font-semibold text-gray-700 border-r'
                                            style={{
                                                width: `${availableWidth}px`,
                                                minWidth: `${availableWidth}px`
                                            }}
                                        >
                                            {monthText}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        
                        <div style={{ height: '60px', width: '100%' }} className='relative flex overflow-x-hidden'>
                            {timelineUnits.map((unit, index) => {
                                const now = startOfDay(new Date());
                                let isTodayUnit = false;
                                
                                if (timeUnit === 'days') {
                                    isTodayUnit = isSameDay(unit.date, now);
                                }
                                else if (timeUnit === 'weeks') {
                                    const weekStart = startOfWeek(unit.date, { weekStartsOn: 0 });
                                    const weekEnd = endOfWeek(unit.date, { weekStartsOn: 0 });
                                    isTodayUnit = now >= weekStart && now <= weekEnd;
                                }
                                else {
                                    const monthStart = startOfMonth(unit.date);
                                    const monthEnd = endOfMonth(unit.date);
                                    isTodayUnit = now >= monthStart && now <= monthEnd;
                                }
                                
                                return (
                                    <div
                                        key={index}
                                        onClick={() => handleUnitClick(unit.date)}
                                        className={`border-r cursor-pointer hover:bg-blue-50 transition-colors ${
                                            isTodayUnit ? 'bg-blue-100' : ''
                                        }`}
                                        style={{
                                            width: `${pixelsPerUnit}px`,
                                            minWidth: `${pixelsPerUnit}px`
                                        }}
                                    >
                                        <div className='px-0.5 py-1.5 text-center h-full flex flex-col justify-center gap-0.5'>
                                            {timeUnit === 'weeks' && (
                                                <>
                                                    <div
                                                        className={`text-[0.6rem] font-semibold uppercase tracking-wider ${
                                                            isTodayUnit ? 'text-blue-700' : 'text-gray-600'
                                                        }`}
                                                    >
                                                        {unit.sublabel}
                                                    </div>
                                                    <div
                                                        className={`text-xl sm:text-2xl font-bold leading-none ${
                                                            isTodayUnit ? 'text-blue-600' : 'text-gray-900'
                                                        }`}
                                                    >
                                                        {unit.label}
                                                    </div>
                                                    <div className='text-[0.55rem] text-gray-500 leading-tight mt-0.5'>
                                                        {(() => {
                                                            const weekEnd = endOfWeek(unit.date, { weekStartsOn: 0 });
                                                            const startMonth = format(unit.date, 'MMM');
                                                            const endMonth = format(weekEnd, 'MMM');
                                                            
                                                            if (pixelsPerUnit < 50) {
                                                                return startMonth === endMonth ? startMonth.charAt(0) : `${startMonth.charAt(0)}-${endMonth.charAt(0)}`;
                                                            }
                                                            return startMonth === endMonth ? startMonth : `${startMonth}-${endMonth}`;
                                                        })()}
                                                    </div>
                                                </>
                                            )}
                                            {timeUnit === 'days' && (
                                                <>
                                                    <div
                                                        className={`text-[0.65rem] font-medium uppercase ${
                                                            isTodayUnit ? 'text-blue-700' : 'text-gray-500'
                                                        }`}
                                                    >
                                                        {unit.sublabel}
                                                    </div>
                                                    <div
                                                        className={`text-xl sm:text-2xl font-bold leading-none ${
                                                            isTodayUnit ? 'text-blue-600' : 'text-gray-900'
                                                        }`}
                                                    >
                                                        {unit.label}
                                                    </div>
                                                </>
                                            )}
                                            {timeUnit === 'months' && (
                                                <>
                                                    <div
                                                        className={`text-lg sm:text-xl font-bold leading-none ${
                                                            isTodayUnit ? 'text-blue-600' : 'text-gray-900'
                                                        }`}
                                                    >
                                                        {pixelsPerUnit < 60 ? unit.label.charAt(0) : unit.label}
                                                    </div>
                                                    {pixelsPerUnit >= 60 && (
                                                        <div className='text-[0.6rem] font-semibold text-gray-600 mt-1'>
                                                            {unit.sublabel}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Events List */}
                <div className='p-2 sm:p-4 space-y-2 sm:space-y-3 bg-white border rounded-lg'>
                    {filteredEvents.length === 0 ? (
                        <div className='flex items-center justify-center text-gray-500 py-8 sm:py-12'>
                            <div className='text-center'>
                                <Calendar className='w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-gray-400' />
                                <p className='text-sm sm:text-base'>No upcoming events to display</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {filteredEvents.slice(0, visibleEventCount).map((event) => {
                                const start = toZonedTime(new Date(event.startTime), tz);
                                const end = event.endTime ? toZonedTime(new Date(event.endTime), tz) : null;
                                
                                return (
                                    <div
                                        key={event.id}
                                        onClick={() => setSelectedEvent(event)}
                                        className='p-3 sm:p-4 rounded-lg shadow hover:shadow-md cursor-pointer border border-gray-300 bg-white hover:bg-gray-50 transition-colors'
                                    >
                                        <div className='flex items-start justify-between mb-1.5 sm:mb-2'>
                                            <p className='font-bold text-base sm:text-lg text-gray-900'>{event.title}</p>
                                            {event.location?.global ? (
                                                <span className='px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-100 text-blue-700 text-[0.65rem] sm:text-xs font-medium rounded whitespace-nowrap ml-2'>
                                                    🌐 Global
                                                </span>
                                            ) : (
                                                <span className='px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-100 text-green-700 text-[0.65rem] sm:text-xs font-medium rounded whitespace-nowrap ml-2'>
                                                    📍 Local
                                                </span>
                                            )}
                                        </div>
                                        {event.description && (
                                            <p className='text-gray-600 text-xs sm:text-sm mb-1.5 sm:mb-2'>{event.description}</p>
                                        )}
                                        <div className='space-y-0.5 sm:space-y-1'>
                                            <p className='text-xs sm:text-sm text-gray-700 flex items-center gap-1.5 sm:gap-2'>
                                                <Clock className='w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0' />
                                                <span className='truncate'>
                                                    {format(start, 'MMM d, yyyy • h:mm a')} –{' '}
                                                    {end ? format(end, 'MMM d, yyyy • h:mm a') : 'Ongoing'}
                                                </span>
                                            </p>
                                            {event.location?.name && !event.location.global && (
                                                <p className='text-xs sm:text-sm text-gray-600 flex items-center gap-1.5 sm:gap-2'>
                                                    <MapPin className='w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0' />
                                                    <span className='truncate'>{event.location.name}</span>
                                                </p>
                                            )}

                                            {typeof event.participantCount === 'number' && event.participantCount > 0 && (
                                                <p className='text-xs sm:text-sm text-blue-600 flex items-center gap-1.5 sm:gap-2'>
                                                    <Users className='w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0' />
                                                    {event.participantCount} participant{event.participantCount !== 1 ? 's' : ''}
                                                </p>
                                            )}
                                            {event.creatorID && (
                                                <p className='text-xs sm:text-sm text-gray-600 flex items-center gap-1.5 sm:gap-2'>
                                                    {eventIDToUserMap[event.creatorID] ? (
                                                        <UserCard
                                                            user={eventIDToUserMap[event.creatorID]!}
                                                            className='text-xs sm:text-sm'
                                                        />
                                                    ) : (
                                                        <span>Loading organizer...</span>
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {/* Load More Button */}
                            {visibleEventCount < filteredEvents.length && (
                                <div className='text-center pt-3 sm:pt-4'>
                                    <Button
                                        onClick={() => setVisibleEventCount(prev => Math.min(prev + 10, filteredEvents.length))}
                                        variant='secondary'
                                        className='text-xs sm:text-sm'
                                    >
                                        Show More ({filteredEvents.length - visibleEventCount} remaining)
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {selectedEvent && (
                <EventDetailsModal
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                    onViewPeriod={(date, unit) => {
                        setViewDate(date);
                        setViewPeriodType(unit);
                        setShowingRangeEvents(false);
                        const clicked = startOfDay(date);
                        let periodStart: Date, periodEnd: Date;
                        
                        if (unit === 'day') {
                            periodStart = startOfDay(clicked);
                            periodEnd = endOfDay(clicked);
                        }
                        else if (unit === 'week') {
                            periodStart = startOfWeek(clicked, { weekStartsOn: 0 });
                            periodEnd = endOfWeek(clicked, { weekStartsOn: 0 });
                        }
                        else {
                            periodStart = startOfMonth(clicked);
                            periodEnd = endOfMonth(clicked);
                        }
                        
                        const eventsInPeriod = filteredEvents.filter((e) => {
                            const start = new Date(e.startTime);
                            const end = e.endTime ? new Date(e.endTime) : null;
                            
                            if (!end) {
                                return start <= periodEnd;
                            }
                            
                            return start <= periodEnd && end >= periodStart;
                        }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
                        
                        setSelectedPeriodEvents(eventsInPeriod);
                    }}
                />
            )}
        </div>
    );
}