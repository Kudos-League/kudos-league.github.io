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
    const [fullEvent, setFullEvent] = useState<EventDTO | null>(null);
    const [loadingParticipants, setLoadingParticipants] = useState(false);

    useEffect(() => {
        const fetchFullEvent = async () => {
            if (!event?.id) return;

            setLoadingParticipants(true);
            setFullEvent(null);
            try {
                const eventData = await apiGet<EventDTO>(`/events/${event.id}`);
                setFullEvent(eventData);
            }
            catch (error) {
                console.error('Failed to fetch event details:', error);
                setFullEvent(event);
            }
            finally {
                setLoadingParticipants(false);
            }
        };

        fetchFullEvent();
    }, [event?.id, event]);

    if (!event) return null;

    const displayEvent = fullEvent || event;

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
            <div className='bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
                <div className='sticky top-0 bg-white dark:bg-zinc-900 border-b dark:border-zinc-700 p-6'>
                    <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                            <h2 className='text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-2'>{event.title}</h2>
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
                            className='p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors'
                        >
                            <X className='w-5 h-5 text-gray-900 dark:text-zinc-100' />
                        </button>
                    </div>
                </div>

                <div className='p-6 space-y-6'>
                    <div>
                        <h3 className='font-semibold text-gray-900 dark:text-zinc-100 mb-2 flex items-center gap-2'>
                            <span className='text-lg'>📝</span>
                            Description
                        </h3>
                        <p className='text-gray-700 dark:text-zinc-300 leading-relaxed'>{event.description}</p>
                    </div>

                    <div className='border-t dark:border-zinc-700 pt-4'>
                        <h3 className='font-semibold text-gray-900 dark:text-zinc-100 mb-3 flex items-center gap-2'>
                            <Clock className='w-5 h-5 text-blue-600 dark:text-blue-400' />
                            Schedule
                        </h3>
                        <div className='space-y-2 text-sm'>
                            <div className='flex items-start gap-3'>
                                <span className='font-medium text-gray-600 dark:text-zinc-400 w-16'>Start:</span>
                                <span className='text-gray-900 dark:text-zinc-100'>{format(start, 'EEEE, MMMM d, yyyy')}</span>
                            </div>
                            <div className='flex items-start gap-3'>
                                <span className='font-medium text-gray-600 dark:text-zinc-400 w-16'></span>
                                <span className='text-gray-700 dark:text-zinc-300'>{format(start, 'h:mm a')}</span>
                            </div>
                            {event.endTime && (
                                <>
                                    <div className='flex items-start gap-3'>
                                        <span className='font-medium text-gray-600 dark:text-zinc-400 w-16'>End:</span>
                                        <span className='text-gray-900 dark:text-zinc-100'>{format(end!, 'EEEE, MMMM d, yyyy')}</span>
                                    </div>
                                    <div className='flex items-start gap-3'>
                                        <span className='font-medium text-gray-600 dark:text-zinc-400 w-16'></span>
                                        <span className='text-gray-700 dark:text-zinc-300'>{format(end!, 'h:mm a')}</span>
                                    </div>
                                </>
                            )}
                            <div className='flex items-start gap-3 pt-2 border-t dark:border-zinc-700'>
                                <span className='font-medium text-gray-600 dark:text-zinc-400 w-16'>Duration:</span>
                                <span className='text-blue-600 dark:text-blue-400 font-medium'>{getDuration()}</span>
                            </div>
                        </div>
                    </div>

                    {event.location && (
                        <div className='border-t dark:border-zinc-700 pt-4'>
                            <h3 className='font-semibold text-gray-900 dark:text-zinc-100 mb-3 flex items-center gap-2'>
                                <MapPin className='w-5 h-5 text-green-600 dark:text-green-400' />
                                Location
                            </h3>
                            <p className='text-gray-700 dark:text-zinc-300'>
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

                    <div className='border-t dark:border-zinc-700 pt-4'>
                        <h3 className='font-semibold text-gray-900 dark:text-zinc-100 mb-3 flex items-center gap-2'>
                            <Users className='w-5 h-5 text-purple-600 dark:text-purple-400' />
                            Participants
                            <span className='ml-1 text-sm font-normal text-gray-600 dark:text-zinc-400'>
                                ({displayEvent.participantCount || 0})
                            </span>
                        </h3>
                        {loadingParticipants ? (
                            <p className='text-gray-500 dark:text-zinc-400 italic'>Loading participants...</p>
                        ) : displayEvent.participants && displayEvent.participants.length > 0 ? (
                            <div className='space-y-2'>
                                {displayEvent.participants.slice(0, 8).map((p: any) => (
                                    <div key={p.id} className='flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors'>
                                        <img
                                            src={getImagePath(p.avatar)}
                                            alt={p.username}
                                            className='w-10 h-10 rounded-full border-2 border-gray-200 dark:border-zinc-700'
                                        />
                                        <span className='font-medium text-gray-900 dark:text-zinc-100'>{p.username}</span>
                                    </div>
                                ))}
                                {displayEvent.participants.length > 8 && (
                                    <p className='text-sm text-gray-500 dark:text-zinc-400 pl-2 pt-2'>
                                        +{displayEvent.participants.length - 8} more participant{displayEvent.participants.length - 8 !== 1 ? 's' : ''}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className='text-gray-500 dark:text-zinc-400 italic'>No participants yet</p>
                        )}
                    </div>

                    <div className='flex gap-3 pt-4 border-t dark:border-zinc-700'>
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
        if (useCustomRange && customStartDate) {
            const start = startOfDay(new Date(customStartDate));
            let end: Date;
            
            if (useDuration) {
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
                end = endOfMonth(start);
            }
            
            return { start, end };
        }
        
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

    const handleNavigatePeriodPrevious = () => {
        if (!viewDate || !viewPeriodType) return;
        
        let newDate: Date;
        if (viewPeriodType === 'day') {
            newDate = addDays(viewDate, -1);
        }
        else if (viewPeriodType === 'week') {
            newDate = addWeeks(viewDate, -1);
        }
        else {
            newDate = addMonths(viewDate, -1);
        }
        
        setViewDate(newDate);
        
        let periodStart: Date, periodEnd: Date;
        const clicked = startOfDay(newDate);
        
        if (viewPeriodType === 'day') {
            periodStart = startOfDay(clicked);
            periodEnd = endOfDay(clicked);
        }
        else if (viewPeriodType === 'week') {
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
    };

    const handleNavigatePeriodNext = () => {
        if (!viewDate || !viewPeriodType) return;
        
        let newDate: Date;
        if (viewPeriodType === 'day') {
            newDate = addDays(viewDate, 1);
        }
        else if (viewPeriodType === 'week') {
            newDate = addWeeks(viewDate, 1);
        }
        else {
            newDate = addMonths(viewDate, 1);
        }
        
        setViewDate(newDate);
        
        let periodStart: Date, periodEnd: Date;
        const clicked = startOfDay(newDate);
        
        if (viewPeriodType === 'day') {
            periodStart = startOfDay(clicked);
            periodEnd = endOfDay(clicked);
        }
        else if (viewPeriodType === 'week') {
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
            const creatorIdsToFetch = new Array<number>();
        
            events.forEach(event => {
                if (event.creatorID && !fetchedCreatorIds.includes(event.creatorID)) {
                    creatorIdsToFetch.push(event.creatorID);
                }
            });

            if (creatorIdsToFetch.length === 0) return;
        
            console.log(`Fetching ${creatorIdsToFetch.length} unique creators`);

            setFetchedCreatorIds(prev => Array.from(new Set([...prev, ...creatorIdsToFetch])));

            const updates: Record<number, UserDTO> = {};
    
            for (const creatorId of creatorIdsToFetch) {
                try {
                    const creator = await apiGet<UserDTO>(`/users/${creatorId}`);
                    updates[creatorId] = creator;
                    console.log(`✓ Fetched creator ${creatorId}: ${creator.username}`);
                
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                catch (error) {
                    console.error(`✗ Failed to fetch creator ${creatorId}:`, error);
                }
            }

            if (Object.keys(updates).length > 0) {
                setEventIDToUserMap(prev => {
                    const newMap = { ...prev, ...updates };
                    console.log(`Updated map: ${Object.keys(newMap).length} total creators`);
                    return newMap;
                });
            }
        };

        fetchCreators();
    }, [events, fetchedCreatorIds]);

    useEffect(() => {
        console.log(`eventIDToUserMap updated: ${Object.keys(eventIDToUserMap).length} entries`);
    }, [eventIDToUserMap]);

    useEffect(() => {
        if (viewDate && viewPeriodType && !showingRangeEvents) {
            let periodStart: Date, periodEnd: Date;
            const clicked = startOfDay(viewDate);

            if (viewPeriodType === 'day') {
                periodStart = startOfDay(clicked);
                periodEnd = endOfDay(clicked);
            }
            else if (viewPeriodType === 'week') {
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
        }
        else if (showingRangeEvents) {
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
        }
    }, [filterText, locationFilter, filteredEvents, viewDate, viewPeriodType, showingRangeEvents, dateRange]);

    if (selectedPeriodEvents && viewDate) {
        return (
            <div className='max-w-5xl mx-auto p-3 sm:p-4'>
                <div className='flex flex-col gap-3 sm:gap-4 mb-4'>
                    <div className='flex flex-col items-start gap-2 sm:gap-3'>
                        <Button onClick={handleBackToGantt} variant='primary' className='text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg'>
                            <ChevronLeft className='w-4 h-4 sm:w-5 sm:h-5' />
                            <span className='hidden sm:inline'>Back to Calendar</span>
                            <span className='sm:hidden'>Back</span>
                        </Button>
                        
                        {!showingRangeEvents ? (
                            <div className='flex items-center justify-between gap-3 sm:gap-4 w-full'>
                                <button
                                    onClick={handleNavigatePeriodPrevious}
                                    className='p-2.5 sm:p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all border-2 border-gray-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md'
                                    title={`Previous ${viewPeriodType}`}
                                >
                                    <ChevronLeft className='w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-zinc-300' />
                                </button>

                                <div className='flex-1 text-center'>
                                    <h2 className='text-base sm:text-xl font-semibold text-gray-900 dark:text-zinc-100'>
                                    Events {viewPeriodType === 'day' ? 'on' : 'during'} {getViewPeriodLabel()}
                                    </h2>
                                    <p className='text-xs sm:text-sm text-gray-600 dark:text-zinc-400 mt-0.5'>
                                        {selectedPeriodEvents.length} event{selectedPeriodEvents.length !== 1 ? 's' : ''} found
                                    </p>
                                </div>

                                <button
                                    onClick={handleNavigatePeriodNext}
                                    className='p-2.5 sm:p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all border-2 border-gray-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md'
                                    title={`Next ${viewPeriodType}`}
                                >
                                    <ChevronRight className='w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-zinc-300' />
                                </button>
                            </div>
                        ) : (
                            <div className='text-center'>
                                <h2 className='text-base sm:text-xl font-semibold text-gray-900 dark:text-zinc-100'>
                                Events during {getViewPeriodLabel()}
                                </h2>
                                <p className='text-xs sm:text-sm text-gray-600 dark:text-zinc-400 mt-0.5'>
                                    {selectedPeriodEvents.length} event{selectedPeriodEvents.length !== 1 ? 's' : ''} found
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {selectedPeriodEvents.length === 0 ? (
                    <div className='flex items-center justify-center text-gray-500 dark:text-zinc-400 py-12 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-zinc-700'>
                        <div className='text-center'>
                            <Calendar className='w-12 h-12 mx-auto mb-2 text-gray-400 dark:text-zinc-500' />
                            <p className='text-sm sm:text-base font-medium'>No events during this period</p>
                            <p className='text-xs text-gray-400 dark:text-zinc-500 mt-1'>Try selecting a different time range</p>
                        </div>
                    </div>
                ) : (
                    <ul className='space-y-2 sm:space-y-3'>
                        {selectedPeriodEvents.map((event) => (
                            <li
                                key={event.id}
                                onClick={() => navigate(`/event/${event.id}`)}
                                className='p-3 sm:p-4 rounded-lg shadow hover:shadow-md cursor-pointer border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors'
                            >
                                <div className='flex items-start justify-between mb-1.5 sm:mb-2'>
                                    <p className='font-bold text-base sm:text-lg text-gray-900 dark:text-zinc-100'>{event.title}</p>
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
                                    <p className='text-gray-600 dark:text-zinc-400 text-xs sm:text-sm mb-1.5 sm:mb-2'>{event.description}</p>
                                )}
                                <div className='space-y-0.5 sm:space-y-1'>
                                    <p className='text-xs sm:text-sm text-gray-700 dark:text-zinc-300 flex items-center gap-1.5 sm:gap-2'>
                                        <Clock className='w-3 h-3 sm:w-4 sm:h-4' />
                                        <span className='truncate'>
                                            {format(toZonedTime(new Date(event.startTime), tz), 'MMM d, yyyy • h:mm a')} –{' '}
                                            {event.endTime
                                                ? format(toZonedTime(new Date(event.endTime), tz), 'MMM d, yyyy • h:mm a')
                                                : 'Ongoing'}
                                        </span>
                                    </p>
                                    {event.location?.name && !event.location.global && (
                                        <p className='text-xs sm:text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5 sm:gap-2'>
                                            <MapPin className='w-3 h-3 sm:w-4 sm:h-4' />
                                            {event.location.name}
                                        </p>
                                    )}
                                    {event.creatorID && eventIDToUserMap[event.creatorID] && (
                                        <p className='text-xs sm:text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5 sm:gap-2'>
                                            <UserCard user={eventIDToUserMap[event.creatorID]} />
                                        </p>
                                    )}
                                    {typeof event.participantCount === 'number' && event.participantCount > 0 && (
                                        <p className='text-xs sm:text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1.5 sm:gap-2'>
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
                    <div className='text-base sm:text-lg text-gray-600 dark:text-zinc-400'>Loading events...</div>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className='max-w-full mx-auto p-3 sm:p-4'>
                <div className='flex items-center justify-center h-64'>
                    <div className='text-base sm:text-lg text-red-600 dark:text-red-400'>Failed to load events</div>
                </div>
            </div>
        );
    }

    return (
        <div className='max-w-full mx-auto p-3 sm:p-4'>
            <div className='mb-3 sm:mb-4'>
                <div className='flex items-center justify-between mb-4'>
                    <div>
                        <h1 className='text-xl sm:text-2xl font-bold text-gray-900 dark:text-zinc-100'>Events Calendar</h1>
                        <p className='text-xs sm:text-sm text-gray-600 dark:text-zinc-400 mt-1'>
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
                    <div className='mb-3 sm:mb-4 p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800'>
                        <div className='flex items-center justify-between mb-3'>
                            <h3 className='text-sm sm:text-base font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-2'>
                                <Calendar className='w-4 h-4' />
                                Jump to Period
                            </h3>
                            <button
                                onClick={() => setShowPeriodPicker(false)}
                                className='text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
                            >
                                <X className='w-4 h-4' />
                            </button>
                        </div>

                        <div className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
                            <button
                                onClick={() => handleJumpToPeriod('this-week')}
                                className='px-3 py-2 bg-white dark:bg-zinc-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg text-xs sm:text-sm font-medium text-gray-700 dark:text-zinc-300 hover:text-blue-700 dark:hover:text-blue-400 transition-colors'
                            >
                                This Week
                            </button>
                            <button
                                onClick={() => handleJumpToPeriod('next-week')}
                                className='px-3 py-2 bg-white dark:bg-zinc-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg text-xs sm:text-sm font-medium text-gray-700 dark:text-zinc-300 hover:text-blue-700 dark:hover:text-blue-400 transition-colors'
                            >
                                Next Week
                            </button>
                            <button
                                onClick={() => handleJumpToPeriod('this-month')}
                                className='px-3 py-2 bg-white dark:bg-zinc-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg text-xs sm:text-sm font-medium text-gray-700 dark:text-zinc-300 hover:text-blue-700 dark:hover:text-blue-400 transition-colors'
                            >
                                This Month
                            </button>
                            <button
                                onClick={() => handleJumpToPeriod('next-month')}
                                className='px-3 py-2 bg-white dark:bg-zinc-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg text-xs sm:text-sm font-medium text-gray-700 dark:text-zinc-300 hover:text-blue-700 dark:hover:text-blue-400 transition-colors'
                            >
                                Next Month
                            </button>
                        </div>

                        <div className='mt-3 pt-3 border-t border-blue-200 dark:border-blue-800'>
                            <label className='block text-xs sm:text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2'>
                                Jump to Week Number
                            </label>
                            <div className='flex gap-2'>
                                <input
                                    type='number'
                                    min='1'
                                    max='53'
                                    placeholder='Week #'
                                    id='week-number-input'
                                    className='flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600'
                                />
                                <button
                                    onClick={() => {
                                        const input = document.getElementById('week-number-input') as HTMLInputElement;
                                        const weekNum = parseInt(input.value);
                                        if (weekNum >= 1 && weekNum <= 53) {
                                            handleJumpToPeriod('week-number', weekNum);
                                        }
                                    }}
                                    className='px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors'
                                >
                                    Go
                                </button>
                            </div>
                            <p className='mt-1 text-[0.65rem] sm:text-xs text-gray-600 dark:text-zinc-400'>
                                Current week: {format(new Date(), 'w')} of {format(new Date(), 'yyyy')}
                            </p>
                        </div>
                    </div>
                )}

                {showFilters && (
                    <div className='mb-3 sm:mb-4 p-3 sm:p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg space-y-3 sm:space-y-4'>
                        <div>
                            <label className='block text-xs sm:text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5 sm:mb-2'>
                                Search Events
                            </label>
                            <input
                                type='text'
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                                placeholder='Filter by title, description, or location...'
                                className='w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600'
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
                                <span className='text-xs sm:text-sm font-medium text-gray-700 dark:text-zinc-300'>
                                    Global events only
                                </span>
                            </label>
                        </div>

                        <div className='border-t dark:border-zinc-700 pt-3 sm:pt-4'>
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
                {/* Timeline Ruler - Sticky */}
                <div className='sticky top-0 z-40 bg-white dark:bg-zinc-900 shadow-md rounded-lg border dark:border-zinc-700'>
                    {/* Navigation and Month/Year Header */}
                    {(timeRange !== 'all' && !useCustomRange) && (
                        <div className='flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 dark:from-zinc-800 dark:to-zinc-800/50 p-2 sm:p-3 border-b dark:border-zinc-700'>
                            <button
                                onClick={handleNavigatePrevious}
                                className='p-1.5 sm:p-2 hover:bg-white dark:hover:bg-zinc-700 rounded-lg transition-colors'
                            >
                                <ChevronLeft className='w-4 h-4 sm:w-5 sm:h-5 text-gray-900 dark:text-zinc-100' />
                            </button>

                            <div className='flex items-center gap-2 sm:gap-3'>
                                <button
                                    onClick={handleShowRangeEvents}
                                    className='text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-zinc-100 hover:bg-white dark:hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition-colors hover:shadow-sm border border-transparent hover:border-gray-300 dark:hover:border-zinc-600'
                                >
                                    {getPeriodLabel()}
                                </button>
                                {periodOffset !== 0 && (
                                    <button
                                        onClick={handleNavigateToday}
                                        className='px-2 py-0.5 sm:px-3 sm:py-1 text-xs sm:text-sm bg-blue-600 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-700 transition-colors'
                                    >
                                        Today
                                    </button>
                                )}
                            </div>

                            <button
                                onClick={handleNavigateNext}
                                className='p-1.5 sm:p-2 hover:bg-white dark:hover:bg-zinc-700 rounded-lg transition-colors'
                            >
                                <ChevronRight className='w-4 h-4 sm:w-5 sm:h-5 text-gray-900 dark:text-zinc-100' />
                            </button>
                        </div>
                    )}

                    {/* Custom Range Header */}
                    {useCustomRange && (
                        <div className='flex items-center justify-center bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 p-2 sm:p-3 border-b dark:border-zinc-700'>
                            <button
                                onClick={handleShowRangeEvents}
                                className='text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-zinc-100 hover:bg-white dark:hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition-colors hover:shadow-sm border border-transparent hover:border-blue-300 dark:hover:border-blue-700'
                            >
                                {getPeriodLabel()}
                            </button>
                        </div>
                    )}

                    {/* Timeline Units */}
                    <div ref={containerRef} className='relative bg-white dark:bg-zinc-900'>
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
                            <div className='flex border-b dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800'>
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
                                            className='text-center py-1 text-[0.7rem] sm:text-xs font-semibold text-gray-700 dark:text-zinc-300 border-r dark:border-zinc-700'
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
                                        className={`border-r dark:border-zinc-700 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ${
                                            isTodayUnit ? 'bg-blue-100 dark:bg-blue-900/30' : ''
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
                                                            isTodayUnit ? 'text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-zinc-400'
                                                        }`}
                                                    >
                                                        {unit.sublabel}
                                                    </div>
                                                    <div
                                                        className={`text-xl sm:text-2xl font-bold leading-none ${
                                                            isTodayUnit ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-zinc-100'
                                                        }`}
                                                    >
                                                        {unit.label}
                                                    </div>
                                                    <div className='text-[0.55rem] text-gray-500 dark:text-zinc-500 leading-tight mt-0.5'>
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
                                                            isTodayUnit ? 'text-blue-700 dark:text-blue-400' : 'text-gray-500 dark:text-zinc-500'
                                                        }`}
                                                    >
                                                        {unit.sublabel}
                                                    </div>
                                                    <div
                                                        className={`text-xl sm:text-2xl font-bold leading-none ${
                                                            isTodayUnit ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-zinc-100'
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
                                        className='p-2.5 sm:p-4 rounded-lg shadow hover:shadow-md cursor-pointer border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors'
                                    >
                                        <div className='flex items-start justify-between gap-2 mb-1'>
                                            <p className='font-bold text-sm sm:text-lg text-gray-900 dark:text-zinc-100 line-clamp-1 flex-1'>
                                                {event.title}
                                            </p>
                                            {event.location?.global ? (
                                                <span className='px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[0.65rem] sm:text-xs font-medium rounded whitespace-nowrap flex-shrink-0'>
                                    🌐<span className='hidden sm:inline'> Global</span>
                                                </span>
                                            ) : (
                                                <span className='px-1.5 py-0.5 bg-green-100 text-green-700 text-[0.65rem] sm:text-xs font-medium rounded whitespace-nowrap flex-shrink-0'>
                                    📍<span className='hidden sm:inline'> Local</span>
                                                </span>
                                            )}
                                        </div>
                                        {event.description && (
                                            <p className='hidden md:block text-gray-600 dark:text-zinc-400 text-xs sm:text-sm mb-1.5 line-clamp-1'>
                                                {event.description}
                                            </p>
                                        )}
                                        <div className='space-y-0.5'>
                                            <p className='text-[0.7rem] sm:text-sm text-gray-700 dark:text-zinc-300 flex items-center gap-1 sm:gap-2'>
                                                <Clock className='w-3 h-3 flex-shrink-0' />
                                                <span className='truncate'>
                                                    {format(start, 'MMM d, yyyy • h:mm a')}
                                                    {end && <span className='hidden sm:inline'> – {format(end, 'MMM d, yyyy • h:mm a')}</span>}
                                                    {end && <span className='sm:hidden'> – {format(end, 'h:mm a')}</span>}
                                                </span>
                                            </p>
                                            {event.location?.name && !event.location.global && (
                                                <p className='text-[0.7rem] sm:text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1 sm:gap-2'>
                                                    <MapPin className='w-3 h-3 flex-shrink-0' />
                                                    <span className='truncate'>{event.location.name}</span>
                                                </p>
                                            )}

                                            {typeof event.participantCount === 'number' && event.participantCount > 0 && (
                                                <p className='text-[0.7rem] sm:text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1 sm:gap-2'>
                                                    <Users className='w-3 h-3 flex-shrink-0' />
                                                    <span className='sm:hidden'>{event.participantCount}</span>
                                                    <span className='hidden sm:inline'>
                                                        {event.participantCount} participant{event.participantCount !== 1 ? 's' : ''}
                                                    </span>
                                                </p>
                                            )}
                                            {event.creatorID && (
                                                <div className='hidden sm:block text-xs sm:text-sm text-gray-600 dark:text-zinc-400'>
                                                    {eventIDToUserMap[event.creatorID] ? (
                                                        <UserCard
                                                            user={eventIDToUserMap[event.creatorID]!}
                                                            className='text-xs sm:text-sm'
                                                        />
                                                    ) : (
                                                        <span>Loading organizer...</span>
                                                    )}
                                                </div>
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