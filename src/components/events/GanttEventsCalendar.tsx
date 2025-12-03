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
    startOfQuarter,
    endOfQuarter,
    addDays,
    addWeeks,
    addMonths,
    addYears,
    addQuarters,
    differenceInDays,
    differenceInMonths,
    differenceInQuarters,
    isSameDay,
    startOfDay,
    endOfDay
} from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Filter, X, MapPin, Users, Clock, Calendar, ChevronLeft, ChevronRight, Globe } from 'lucide-react';
import { EventDTO } from '@/shared/api/types';
import { useEvents } from '@/shared/api/queries/events';
import { getImagePath } from '@/shared/api/config';
import Button from '@/components/common/Button';
import UserCard from '../users/UserCard';
import { apiGet } from '@/shared/api/apiClient';
import MobileEventListView from './MobileEventListView';

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

type TimeUnit = 'days' | 'weeks' | 'months' | 'quarters';

export default function GanttEventsCalendar() {
    const navigate = useNavigate();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);

    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('week');
    const [filterText, setFilterText] = useState('');
    const [selectedEvent, setSelectedEvent] = useState<EventDTO | null>(null);
    const [viewDate, setViewDate] = useState<Date | null>(null);
    const [viewPeriodType, setViewPeriodType] = useState<'day' | 'week' | 'month' | 'quarter' | null>(null);
    const [selectedPeriodEvents, setSelectedPeriodEvents] = useState<EventDTO[] | null>(null);
    const [locationFilter, setLocationFilter] = useState<'all' | 'local' | 'global'>('local');
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

            if (locationFilter === 'global') {
                return event.location?.global === true;
            }
            else if (locationFilter === 'local') {
                return event.location?.global !== true;
            }

            return true;
        });
    }, [events, filterText, locationFilter]);

    const timeUnit: TimeUnit = useMemo(() => {
        if (containerWidth === 0) return 'days';

        const totalDays = differenceInDays(dateRange.end, dateRange.start) + 1;

        // Aggressive minimum pixels to ensure events are readable
        // These values ensure we can display at least medium detail level (180px+ per event)
        const minPixelsPerDay = 120;     // Very comfortable space for daily events
        const minPixelsPerWeek = 200;    // Enough for medium detail view per week
        const minPixelsPerMonth = 250;   // Enough for medium detail view per month
        const minPixelsPerQuarter = 300; // Enough for medium detail view per quarter

        // Try days first
        if (totalDays * minPixelsPerDay <= containerWidth) {
            return 'days';
        }

        // Try weeks
        const totalWeeks = Math.ceil(totalDays / 7);
        if (totalWeeks * minPixelsPerWeek <= containerWidth) {
            return 'weeks';
        }

        // Try months
        const totalMonths = differenceInMonths(dateRange.end, dateRange.start) + 1;
        if (totalMonths * minPixelsPerMonth <= containerWidth) {
            return 'months';
        }

        // Try quarters
        const totalQuarters = differenceInQuarters(dateRange.end, dateRange.start) + 1;
        if (totalQuarters * minPixelsPerQuarter <= containerWidth) {
            return 'quarters';
        }

        // Fall back to quarters even if tight (better than nothing)
        return 'quarters';
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
        else if (timeUnit === 'months') {
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
        else if (timeUnit === 'quarters') {
            let current = startOfQuarter(dateRange.start);
            while (current <= dateRange.end) {
                const quarter = Math.floor(current.getMonth() / 3) + 1;
                units.push({
                    date: current,
                    label: `Q${quarter}`,
                    sublabel: format(current, 'yyyy')
                });
                current = addQuarters(current, 1);
            }
        }
        
        return units;
    }, [dateRange, timeUnit]);

    const pixelsPerUnit = containerWidth > 0 && timelineUnits.length > 0
        ? containerWidth / timelineUnits.length
        : (timeUnit === 'days' ? 60 : timeUnit === 'weeks' ? 80 : timeUnit === 'months' ? 100 : 120);

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
        else if (timeUnit === 'months') {
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
        else {
            // quarters
            const quarterIndex = timelineUnits.findIndex(u => {
                const quarterStart = startOfQuarter(u.date);
                const quarterEnd = endOfQuarter(u.date);
                return now >= quarterStart && now <= quarterEnd;
            });
            if (quarterIndex < 0) return null;

            const quarterStart = startOfQuarter(timelineUnits[quarterIndex].date);
            const quarterEnd = endOfQuarter(timelineUnits[quarterIndex].date);
            const daysInQuarter = differenceInDays(quarterEnd, quarterStart) + 1;
            const daysIntoQuarter = differenceInDays(now, quarterStart);
            const proportionIntoQuarter = daysIntoQuarter / daysInQuarter;

            return quarterIndex * pixelsPerUnit + proportionIntoQuarter * pixelsPerUnit;
        }
    }, [timelineUnits, pixelsPerUnit, timeUnit, dateRange]);

    const calculateEventPosition = (event: EventDTO) => {
        const eventStart = startOfDay(new Date(event.startTime));
        // For eternal events (no end time), extend to the end of visible range
        const eventEnd = event.endTime ? startOfDay(new Date(event.endTime)) : dateRange.end;
        const isEternal = !event.endTime;

        // If event is completely outside the visible range, don't render
        if (eventEnd < dateRange.start || eventStart > dateRange.end) {
            return null;
        }

        // Clamp event to visible range
        const visibleStart = eventStart < dateRange.start ? dateRange.start : eventStart;
        const visibleEnd = eventEnd > dateRange.end ? dateRange.end : eventEnd;

        if (timeUnit === 'days') {
            // Snap to full days
            const snappedStart = startOfDay(visibleStart);
            const snappedEnd = endOfDay(visibleEnd);

            const startDayIndex = differenceInDays(snappedStart, dateRange.start);
            const endDayIndex = differenceInDays(snappedEnd, dateRange.start);

            const left = startDayIndex * pixelsPerUnit;
            const width = Math.max((endDayIndex - startDayIndex + 1) * pixelsPerUnit, pixelsPerUnit * 0.8);

            return { left, width, isCompressed: startDayIndex === endDayIndex && !isEternal, isEternal };
        }
        else if (timeUnit === 'weeks') {
            // Snap to full weeks
            const snappedStart = startOfWeek(visibleStart, { weekStartsOn: 0 });
            const snappedEnd = endOfWeek(visibleEnd, { weekStartsOn: 0 });

            // Timeline starts from the week boundary of dateRange.start
            const timelineStart = startOfWeek(dateRange.start, { weekStartsOn: 0 });

            const startWeekIndex = Math.floor(differenceInDays(snappedStart, timelineStart) / 7);
            const endWeekIndex = Math.floor(differenceInDays(snappedEnd, timelineStart) / 7);

            const left = startWeekIndex * pixelsPerUnit;
            const width = Math.max((endWeekIndex - startWeekIndex + 1) * pixelsPerUnit, pixelsPerUnit * 0.15);

            const durationInWeeks = endWeekIndex - startWeekIndex + 1;
            return { left, width, isCompressed: durationInWeeks <= 1 && !isEternal, isEternal };
        }
        else if (timeUnit === 'months') {
            // Snap to full months
            const snappedStart = startOfMonth(visibleStart);
            const snappedEnd = endOfMonth(visibleEnd);

            // Timeline starts from the month boundary of dateRange.start
            const timelineStart = startOfMonth(dateRange.start);

            const startMonthIndex = differenceInMonths(snappedStart, timelineStart);
            const endMonthIndex = differenceInMonths(snappedEnd, timelineStart);

            const left = startMonthIndex * pixelsPerUnit;
            const width = Math.max((endMonthIndex - startMonthIndex + 1) * pixelsPerUnit, pixelsPerUnit * 0.1);

            const durationInMonths = endMonthIndex - startMonthIndex + 1;
            return { left, width, isCompressed: durationInMonths <= 1 && !isEternal, isEternal };
        }
        else {
            // Snap to full quarters
            const snappedStart = startOfQuarter(visibleStart);
            const snappedEnd = endOfQuarter(visibleEnd);

            // Timeline starts from the quarter boundary of dateRange.start
            const timelineStart = startOfQuarter(dateRange.start);

            const startQuarterIndex = differenceInQuarters(snappedStart, timelineStart);
            const endQuarterIndex = differenceInQuarters(snappedEnd, timelineStart);

            const left = startQuarterIndex * pixelsPerUnit;
            const width = Math.max((endQuarterIndex - startQuarterIndex + 1) * pixelsPerUnit, pixelsPerUnit * 0.1);

            const durationInQuarters = endQuarterIndex - startQuarterIndex + 1;
            return { left, width, isCompressed: durationInQuarters <= 1 && !isEternal, isEternal };
        }
    };

    const eventBars = useMemo(() => {
        const bars: Array<{ event: EventDTO; left: number; width: number; isCompressed: boolean; isEternal: boolean; row: number }> = [];
        const rowEndPositions: number[] = [];

        filteredEvents.forEach((event) => {
            const position = calculateEventPosition(event);
            if (!position) return;

            // Find row where this event fits
            let row = 0;
            while (row < rowEndPositions.length && rowEndPositions[row] > position.left) {
                row++;
            }

            if (row >= rowEndPositions.length) {
                rowEndPositions.push(position.left + position.width);
            }
            else {
                rowEndPositions[row] = position.left + position.width;
            }

            bars.push({ event, ...position, row });
        });

        return bars;
    }, [filteredEvents, dateRange, timeUnit, pixelsPerUnit, timelineUnits]);

    const handleUnitClick = (date: Date) => {
        const clicked = startOfDay(date);
        let periodStart: Date, periodEnd: Date, periodType: 'day' | 'week' | 'month' | 'quarter';

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
        else if (timeUnit === 'months') {
            periodStart = startOfMonth(clicked);
            periodEnd = endOfMonth(clicked);
            periodType = 'month';
        }
        else {
            // quarters
            periodStart = startOfQuarter(clicked);
            periodEnd = endOfQuarter(clicked);
            periodType = 'quarter';
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
        else if (viewPeriodType === 'month') {
            newDate = addMonths(viewDate, -1);
        }
        else {
            newDate = addQuarters(viewDate, -1);
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
        else if (viewPeriodType === 'month') {
            periodStart = startOfMonth(clicked);
            periodEnd = endOfMonth(clicked);
        }
        else {
            periodStart = startOfQuarter(clicked);
            periodEnd = endOfQuarter(clicked);
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
        else if (viewPeriodType === 'month') {
            newDate = addMonths(viewDate, 1);
        }
        else {
            newDate = addQuarters(viewDate, 1);
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
        else if (viewPeriodType === 'month') {
            periodStart = startOfMonth(clicked);
            periodEnd = endOfMonth(clicked);
        }
        else {
            periodStart = startOfQuarter(clicked);
            periodEnd = endOfQuarter(clicked);
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
        else if (viewPeriodType === 'month') {
            return format(viewDate, 'MMMM yyyy');
        }
        else {
            // quarter
            const quarter = Math.floor(viewDate.getMonth() / 3) + 1;
            const year = format(viewDate, 'yyyy');
            return `Q${quarter} ${year}`;
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
            else if (viewPeriodType === 'month') {
                periodStart = startOfMonth(clicked);
                periodEnd = endOfMonth(clicked);
            }
            else {
                periodStart = startOfQuarter(clicked);
                periodEnd = endOfQuarter(clicked);
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
                                    {event.creator && (
                                        <p className='text-xs sm:text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5 sm:gap-2'>
                                            <UserCard user={event.creator} />
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

    // Handler for mobile view period selection
    const handleMobilePeriodSelect = (startDate: Date, endDate: Date, periodType: 'day' | 'week' | 'month') => {
        setSelectedPeriodEvents(filteredEvents.filter((e) => {
            const eventStart = new Date(e.startTime);
            const eventEnd = e.endTime ? new Date(e.endTime) : null;

            if (!eventEnd) {
                return eventStart <= endDate;
            }

            return eventStart <= endDate && eventEnd >= startDate;
        }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()));
        setViewDate(startDate);
        setViewPeriodType(periodType);
        setShowingRangeEvents(false);
    };

    return (
        <>
            {/* Mobile View - Show on small screens only */}
            <div className='md:hidden'>
                <MobileEventListView
                    events={filteredEvents}
                    onSelectPeriod={handleMobilePeriodSelect}
                    locationFilter={locationFilter}
                    setLocationFilter={setLocationFilter}
                    filterText={filterText}
                    setFilterText={setFilterText}
                />
            </div>

            {/* Desktop View - Show on medium+ screens */}
            <div className='hidden md:block max-w-full mx-auto p-3 sm:p-4'>
                <div className='mb-3 sm:mb-4'>
                    <div className='flex items-center justify-between mb-4 gap-3'>
                        <div>
                            <h1 className='text-xl sm:text-2xl font-bold text-gray-900 dark:text-zinc-100'>Events Calendar</h1>
                            <p className='text-xs sm:text-sm text-gray-600 dark:text-zinc-400 mt-1'>
                            Viewing {timelineUnits.length} {timeUnit} • {filteredEvents.length} events
                            </p>
                        </div>
                        <div className='flex gap-2'>
                            <button
                                onClick={() => setLocationFilter('local')}
                                className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-full transition-all duration-200 transform hover:scale-105 ${
                                    locationFilter === 'local'
                                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/50 dark:shadow-green-500/30'
                                        : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-2 border-gray-300 dark:border-zinc-600 hover:border-green-500 dark:hover:border-green-500 hover:text-green-600 dark:hover:text-green-400'
                                }`}
                            >
                                <MapPin className='w-4 h-4' />
                            Local
                            </button>
                            <button
                                onClick={() => setLocationFilter('global')}
                                className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-full transition-all duration-200 transform hover:scale-105 ${
                                    locationFilter === 'global'
                                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/50 dark:shadow-blue-500/30'
                                        : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-2 border-gray-300 dark:border-zinc-600 hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400'
                                }`}
                            >
                                <Globe className='w-4 h-4' />
                            Global
                            </button>
                            <button
                                onClick={() => setLocationFilter('all')}
                                className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-full transition-all duration-200 transform hover:scale-105 ${
                                    locationFilter === 'all'
                                        ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/50 dark:shadow-purple-500/30'
                                        : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-2 border-gray-300 dark:border-zinc-600 hover:border-purple-500 dark:hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400'
                                }`}
                            >
                                <Filter className='w-4 h-4' />
                            All
                            </button>

                        </div>
                    </div>

                    {/* Search Events + Jump to Period + Create Event */}
                    <div className='flex gap-2 sm:gap-3 mb-3 sm:mb-4'>
                        <input
                            type='text'
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            placeholder='Search events by title, description, or location...'
                            className='flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600'
                        />
                        <Button
                            onClick={() => setShowPeriodPicker(!showPeriodPicker)}
                            variant='secondary'
                            className='text-xs sm:text-sm whitespace-nowrap'
                        >
                            <Calendar className='w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2' />
                            <span className='hidden sm:inline'>Jump to Period</span>
                            <span className='sm:hidden'>Period</span>
                            {useCustomRange && (
                                <span className='ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full'>
                                Custom
                                </span>
                            )}
                        </Button>
                        <Button onClick={() => navigate('/create-event')} className='text-sm sm:text-base whitespace-nowrap'>
                            <span className='hidden sm:inline'>+ Create Event</span>
                            <span className='sm:hidden'>+ New</span>
                        </Button>
                    </div>


                    {showPeriodPicker && (
                        <div className='mb-3 sm:mb-4 p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800 space-y-4'>
                            <div className='flex items-center justify-between'>
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

                            {/* Time Range Buttons */}
                            <div>
                                <label className='block text-xs sm:text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2'>
                                View Range
                                </label>
                                <div className='flex gap-2'>
                                    {(['week', 'month', 'year', 'all'] as const).map((range) => (
                                        <button
                                            key={range}
                                            onClick={() => {
                                                setTimeRange(range);
                                                setUseCustomRange(false);
                                            }}
                                            className={`flex-1 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                                                timeRange === range && !useCustomRange
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                                            }`}
                                        >
                                            {range === 'all' ? 'All' : range.charAt(0).toUpperCase() + range.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Quick Jump Buttons */}
                            <div>
                                <label className='block text-xs sm:text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2'>
                                Quick Jump
                                </label>
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
                            </div>

                            {/* Custom Date Range */}
                            <div className='border-t border-blue-200 dark:border-blue-800 pt-3'>
                                <div className='flex items-center gap-2 mb-3'>
                                    <input
                                        type='checkbox'
                                        id='customRangePicker'
                                        checked={useCustomRange}
                                        onChange={(e) => {
                                            setUseCustomRange(e.target.checked);
                                            if (!e.target.checked) {
                                                setCustomStartDate('');
                                                setCustomEndDate('');
                                            }
                                        }}
                                        className='w-4 h-4'
                                    />
                                    <label htmlFor='customRangePicker' className='text-xs sm:text-sm font-medium text-gray-700 dark:text-zinc-300'>
                                    Custom Date Range
                                    </label>
                                </div>

                                {useCustomRange && (
                                    <div className='space-y-3 ml-6'>
                                        <div>
                                            <label className='block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1'>
                                            Start Date
                                            </label>
                                            <input
                                                type='date'
                                                value={customStartDate}
                                                onChange={(e) => setCustomStartDate(e.target.value)}
                                                className='w-full px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600'
                                            />
                                        </div>

                                        <div className='flex items-center gap-2'>
                                            <input
                                                type='radio'
                                                id='useEndDatePicker'
                                                checked={!useDuration}
                                                onChange={() => setUseDuration(false)}
                                                className='w-4 h-4'
                                            />
                                            <label htmlFor='useEndDatePicker' className='text-xs font-medium text-gray-700 dark:text-zinc-300'>
                                            Specify End Date
                                            </label>
                                        </div>

                                        {!useDuration && (
                                            <div className='ml-6'>
                                                <input
                                                    type='date'
                                                    value={customEndDate}
                                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                                    min={customStartDate}
                                                    className='w-full px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600'
                                                />
                                            </div>
                                        )}

                                        <div className='flex items-center gap-2'>
                                            <input
                                                type='radio'
                                                id='useDurationPicker'
                                                checked={useDuration}
                                                onChange={() => setUseDuration(true)}
                                                className='w-4 h-4'
                                            />
                                            <label htmlFor='useDurationPicker' className='text-xs font-medium text-gray-700 dark:text-zinc-300'>
                                            Specify Duration
                                            </label>
                                        </div>

                                        {useDuration && (
                                            <div className='ml-6 flex gap-2'>
                                                <input
                                                    type='number'
                                                    min='1'
                                                    value={durationValue}
                                                    onChange={(e) => setDurationValue(parseInt(e.target.value) || 1)}
                                                    className='flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600'
                                                />
                                                <select
                                                    value={durationUnit}
                                                    onChange={(e) => setDurationUnit(e.target.value as 'days' | 'weeks' | 'months')}
                                                    className='px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600'
                                                >
                                                    <option value='days'>Days</option>
                                                    <option value='weeks'>Weeks</option>
                                                    <option value='months'>Months</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
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
                                    else if (timeUnit === 'months') {
                                        const monthStart = startOfMonth(unit.date);
                                        const monthEnd = endOfMonth(unit.date);
                                        isTodayUnit = now >= monthStart && now <= monthEnd;
                                    }
                                    else {
                                        // quarters
                                        const quarterStart = startOfQuarter(unit.date);
                                        const quarterEnd = endOfQuarter(unit.date);
                                        isTodayUnit = now >= quarterStart && now <= quarterEnd;
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
                                                                isTodayUnit ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-zinc-100'
                                                            }`}
                                                        >
                                                            {pixelsPerUnit < 60 ? unit.label.charAt(0) : unit.label}
                                                        </div>
                                                        {pixelsPerUnit >= 60 && (
                                                            <div className='text-[0.6rem] font-semibold text-gray-600 dark:text-zinc-400 mt-1'>
                                                                {unit.sublabel}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                                {timeUnit === 'quarters' && (
                                                    <>
                                                        <div
                                                            className={`text-lg sm:text-xl font-bold leading-none ${
                                                                isTodayUnit ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-zinc-100'
                                                            }`}
                                                        >
                                                            {unit.label}
                                                        </div>
                                                        <div className='text-[0.6rem] font-semibold text-gray-600 dark:text-zinc-400 mt-1'>
                                                            {unit.sublabel}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Event Bars - Main Event Display */}
                        {eventBars.length > 0 && (
                            <div className='relative mt-2 bg-white dark:bg-zinc-900 border-t dark:border-zinc-700' style={{ minHeight: `${Math.max(eventBars.length > 0 ? Math.max(...eventBars.map(b => b.row)) + 1 : 1, 3) * 270}px` }}>
                                {eventBars.map((bar, idx) => {
                                    const start = toZonedTime(new Date(bar.event.startTime), tz);
                                    const end = bar.event.endTime ? toZonedTime(new Date(bar.event.endTime), tz) : null;

                                    // Determine detail level based on width
                                    const detailLevel = bar.width >= 350 ? 'full' : bar.width >= 180 ? 'medium' : bar.width >= 80 ? 'minimal' : 'icon';

                                    return (
                                        <div
                                            key={`${bar.event.id}-${idx}`}
                                            onClick={() => setSelectedEvent(bar.event)}
                                            className={`absolute cursor-pointer transition-all hover:shadow-md hover:z-10 rounded-lg border overflow-hidden ${
                                                bar.isEternal
                                                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-400 dark:border-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                                                    : bar.isCompressed
                                                        ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                                                        : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700'
                                            }`}
                                            style={{
                                                left: `${bar.left}px`,
                                                width: `${bar.width}px`,
                                                top: `${bar.row * 270 + 4}px`,
                                                height: '258px'
                                            }}
                                            title={detailLevel === 'icon' ? bar.event.title : undefined}
                                        >
                                            {/* Full detail - original event card design */}
                                            {detailLevel === 'full' && (
                                                <div className='p-3 sm:p-4 h-full flex flex-col'>
                                                    <div className='flex items-start justify-between mb-1.5 sm:mb-2'>
                                                        <div className='flex items-center gap-1.5 flex-1 overflow-hidden'>
                                                            {bar.isEternal && <span className='text-amber-600 dark:text-amber-400 text-sm flex-shrink-0'>∞</span>}
                                                            <p className='font-bold text-base sm:text-lg text-gray-900 dark:text-zinc-100 line-clamp-2 flex-1 overflow-hidden'>
                                                                {bar.event.title}
                                                            </p>
                                                        </div>
                                                        {bar.event.location?.global ? (
                                                            <span className='px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-100 text-blue-700 text-[0.65rem] sm:text-xs font-medium rounded whitespace-nowrap ml-2 flex-shrink-0'>
                                                            🌐 Global
                                                            </span>
                                                        ) : (
                                                            <span className='px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-100 text-green-700 text-[0.65rem] sm:text-xs font-medium rounded whitespace-nowrap ml-2 flex-shrink-0'>
                                                            📍 Local
                                                            </span>
                                                        )}
                                                    </div>
                                                    {bar.event.description && (
                                                        <p className='text-gray-600 dark:text-zinc-400 text-xs sm:text-sm mb-2 line-clamp-2 overflow-hidden'>
                                                            {bar.event.description}
                                                        </p>
                                                    )}
                                                    <div className='space-y-0.5 sm:space-y-1 mt-auto min-h-0'>
                                                        <p className='text-[0.7rem] sm:text-sm text-gray-700 dark:text-zinc-300 flex items-center gap-1 sm:gap-2'>
                                                            <Clock className='w-3 h-3 flex-shrink-0' />
                                                            <span className='truncate'>
                                                                {format(start, 'MMM d, yyyy • h:mm a')}
                                                                {end && <span className='hidden sm:inline'> – {format(end, 'MMM d, yyyy • h:mm a')}</span>}
                                                                {end && <span className='sm:hidden'> – {format(end, 'h:mm a')}</span>}
                                                            </span>
                                                        </p>
                                                        {bar.event.location?.name && !bar.event.location.global && (
                                                            <p className='text-[0.7rem] sm:text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1 sm:gap-2'>
                                                                <MapPin className='w-3 h-3 flex-shrink-0' />
                                                                <span className='truncate'>{bar.event.location.name}</span>
                                                            </p>
                                                        )}
                                                        {typeof bar.event.participantCount === 'number' && bar.event.participantCount > 0 && (
                                                            <p className='text-[0.7rem] sm:text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1 sm:gap-2'>
                                                                <Users className='w-3 h-3 flex-shrink-0' />
                                                                <span className='sm:hidden'>{bar.event.participantCount}</span>
                                                                <span className='hidden sm:inline'>
                                                                    {bar.event.participantCount} participant{bar.event.participantCount !== 1 ? 's' : ''}
                                                                </span>
                                                            </p>
                                                        )}
                                                        {bar.event.creator && (
                                                            <div className='text-xs sm:text-sm text-gray-600 dark:text-zinc-400'>
                                                                <UserCard
                                                                    user={bar.event.creator}
                                                                    className='text-xs sm:text-sm'
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Medium detail - title, time, location badge */}
                                            {detailLevel === 'medium' && (
                                                <div className='p-2.5 h-full flex flex-col'>
                                                    <div className='flex items-start gap-1.5 mb-1'>
                                                        {bar.isEternal && <span className='text-amber-600 dark:text-amber-400 text-xs'>∞</span>}
                                                        {!bar.isEternal && bar.event.location?.global && <span className='text-xs'>🌐</span>}
                                                        {!bar.isEternal && !bar.event.location?.global && <span className='text-xs'>📍</span>}
                                                        <p className='font-bold text-sm text-gray-900 dark:text-zinc-100 line-clamp-2 flex-1 overflow-hidden'>
                                                            {bar.event.title}
                                                        </p>
                                                    </div>
                                                    {bar.event.description && (
                                                        <p className='text-gray-600 dark:text-zinc-400 text-xs mb-1 line-clamp-1 overflow-hidden'>
                                                            {bar.event.description}
                                                        </p>
                                                    )}
                                                    <div className='space-y-1 mt-auto min-h-0'>
                                                        <p className='text-xs text-gray-700 dark:text-zinc-300 flex items-center gap-1'>
                                                            <Clock className='w-3 h-3 flex-shrink-0' />
                                                            <span className='truncate'>{format(start, 'MMM d, h:mm a')}</span>
                                                        </p>
                                                        {bar.event.location?.name && !bar.event.location.global && (
                                                            <p className='text-xs text-gray-600 dark:text-zinc-400 truncate'>
                                                                {bar.event.location.name}
                                                            </p>
                                                        )}
                                                        <div className='flex items-center gap-2'>
                                                            {typeof bar.event.participantCount === 'number' && bar.event.participantCount > 0 && (
                                                                <p className='text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1'>
                                                                    <Users className='w-3 h-3 flex-shrink-0' />
                                                                    {bar.event.participantCount}
                                                                </p>
                                                            )}
                                                            {bar.event.creator && (
                                                                <div className='text-xs text-gray-600 dark:text-zinc-400 truncate'>
                                                                    <UserCard
                                                                        user={bar.event.creator}
                                                                        className='text-xs'
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Minimal detail - title and basic info */}
                                            {detailLevel === 'minimal' && (
                                                <div className='px-2 py-1.5 h-full flex flex-col justify-center'>
                                                    <div className='flex items-center gap-1 mb-1'>
                                                        {bar.isEternal && <span className='text-xs text-amber-600 dark:text-amber-400'>∞</span>}
                                                        {!bar.isEternal && bar.isCompressed && <span className='text-xs'>📌</span>}
                                                        {!bar.isEternal && bar.event.location?.global && <span className='text-xs'>🌐</span>}
                                                        {!bar.isEternal && !bar.event.location?.global && <span className='text-xs'>📍</span>}
                                                    </div>
                                                    <p className='font-semibold text-xs text-gray-900 dark:text-zinc-100 line-clamp-2 mb-1'>
                                                        {bar.event.title}
                                                    </p>
                                                    <p className='text-[0.65rem] text-gray-600 dark:text-zinc-400 truncate'>
                                                        {format(start, 'MMM d')}
                                                    </p>
                                                    {typeof bar.event.participantCount === 'number' && bar.event.participantCount > 0 && (
                                                        <p className='text-[0.65rem] text-blue-600 dark:text-blue-400 flex items-center gap-0.5'>
                                                            <Users className='w-2.5 h-2.5' />
                                                            {bar.event.participantCount}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Icon only - very compressed */}
                                            {detailLevel === 'icon' && (
                                                <div className='h-full flex items-center justify-center px-1'>
                                                    <div className='flex flex-col items-center gap-0.5'>
                                                        {bar.isEternal && <span className='text-base text-amber-600 dark:text-amber-400'>∞</span>}
                                                        {!bar.isEternal && bar.isCompressed && <span className='text-base'>📌</span>}
                                                        {!bar.isEternal && !bar.isCompressed && bar.event.location?.global && <span className='text-base'>🌐</span>}
                                                        {!bar.isEternal && !bar.isCompressed && !bar.event.location?.global && <span className='text-base'>📍</span>}
                                                        {typeof bar.event.participantCount === 'number' && bar.event.participantCount > 0 && (
                                                            <span className='text-[0.6rem] font-bold text-blue-600 dark:text-blue-400'>
                                                                {bar.event.participantCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Empty State */}
                        {eventBars.length === 0 && (
                            <div className='p-8 sm:p-12 bg-white dark:bg-zinc-900 border dark:border-zinc-700 rounded-lg'>
                                <div className='flex items-center justify-center text-gray-500 dark:text-zinc-400'>
                                    <div className='text-center'>
                                        <Calendar className='w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-gray-400 dark:text-zinc-500' />
                                        <p className='text-sm sm:text-base'>No upcoming events to display</p>
                                    </div>
                                </div>
                            </div>
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
        </>
    );
}