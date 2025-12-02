import React, { useMemo } from 'react';
import {
    format,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    addDays,
    addMonths,
    startOfDay,
    endOfDay,
    isSameDay
} from 'date-fns';
import { Calendar, ChevronRight, MapPin, Globe, Filter, Search } from 'lucide-react';
import { EventDTO } from '@/shared/api/types';

interface MobileEventListViewProps {
    events: EventDTO[];
    onSelectPeriod: (startDate: Date, endDate: Date, periodType: 'day' | 'week' | 'month') => void;
    locationFilter: 'all' | 'local' | 'global';
    setLocationFilter: (filter: 'all' | 'local' | 'global') => void;
    filterText: string;
    setFilterText: (text: string) => void;
}

type ViewType = 'week' | 'month' | 'year';

export default function MobileEventListView({ events, onSelectPeriod, locationFilter, setLocationFilter, filterText, setFilterText }: MobileEventListViewProps) {
    const [viewType, setViewType] = React.useState<ViewType>('week');
    const [currentOffset, setCurrentOffset] = React.useState(0);

    const periods = useMemo(() => {
        const now = new Date();
        const periodList: Array<{
            label: string;
            startDate: Date;
            endDate: Date;
            periodType: 'day' | 'week' | 'month';
            eventCount: number;
            events: EventDTO[];
        }> = [];

        if (viewType === 'week') {
            // Show 7 days starting from current week + offset
            const baseStart = startOfWeek(now, { weekStartsOn: 0 });
            const weekStart = addDays(baseStart, currentOffset * 7);

            for (let i = 0; i < 7; i++) {
                const dayStart = startOfDay(addDays(weekStart, i));
                const dayEnd = endOfDay(addDays(weekStart, i));

                const periodEvents = events.filter(e => {
                    const eventStart = new Date(e.startTime);
                    const eventEnd = e.endTime ? new Date(e.endTime) : null;

                    if (!eventEnd) {
                        return eventStart <= dayEnd;
                    }

                    return eventStart <= dayEnd && eventEnd >= dayStart;
                });

                const isToday = isSameDay(dayStart, now);
                const dayLabel = isToday ? 'Today' : format(dayStart, 'EEEE, MMM d');

                periodList.push({
                    label: dayLabel,
                    startDate: dayStart,
                    endDate: dayEnd,
                    periodType: 'day',
                    eventCount: periodEvents.length,
                    events: periodEvents
                });
            }
        } 
        else if (viewType === 'month') {
            // Show 30 days starting from current month + offset
            const baseStart = startOfMonth(now);
            const monthStart = addMonths(baseStart, currentOffset);

            for (let i = 0; i < 30; i++) {
                const dayStart = startOfDay(addDays(monthStart, i));
                const dayEnd = endOfDay(addDays(monthStart, i));

                const periodEvents = events.filter(e => {
                    const eventStart = new Date(e.startTime);
                    const eventEnd = e.endTime ? new Date(e.endTime) : null;

                    if (!eventEnd) {
                        return eventStart <= dayEnd;
                    }

                    return eventStart <= dayEnd && eventEnd >= dayStart;
                });

                const isToday = isSameDay(dayStart, now);
                const dayLabel = isToday ? 'Today' : format(dayStart, 'EEEE, MMM d');

                periodList.push({
                    label: dayLabel,
                    startDate: dayStart,
                    endDate: dayEnd,
                    periodType: 'day',
                    eventCount: periodEvents.length,
                    events: periodEvents
                });
            }
        } 
        else {
            // Show 12 months starting from current year + offset
            const baseStart = startOfMonth(now);
            const yearStart = addMonths(baseStart, currentOffset * 12);

            for (let i = 0; i < 12; i++) {
                const monthStart = startOfMonth(addMonths(yearStart, i));
                const monthEnd = endOfMonth(addMonths(yearStart, i));

                const periodEvents = events.filter(e => {
                    const eventStart = new Date(e.startTime);
                    const eventEnd = e.endTime ? new Date(e.endTime) : null;

                    if (!eventEnd) {
                        return eventStart <= monthEnd;
                    }

                    return eventStart <= monthEnd && eventEnd >= monthStart;
                });

                periodList.push({
                    label: format(monthStart, 'MMMM yyyy'),
                    startDate: monthStart,
                    endDate: monthEnd,
                    periodType: 'month',
                    eventCount: periodEvents.length,
                    events: periodEvents
                });
            }
        }

        return periodList;
    }, [events, viewType, currentOffset]);

    const getViewLabel = () => {
        const now = new Date();
        if (viewType === 'week') {
            const baseStart = startOfWeek(now, { weekStartsOn: 0 });
            const weekStart = addDays(baseStart, currentOffset * 7);
            const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
            return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
        }
        else if (viewType === 'month') {
            const monthStart = addMonths(startOfMonth(now), currentOffset);
            return format(monthStart, 'MMMM yyyy');
        }
        else {
            const yearStart = addMonths(startOfMonth(now), currentOffset * 12);
            return format(yearStart, 'yyyy');
        }
    };

    return (
        <div className="max-w-full mx-auto p-3 sm:p-4">
            {/* Header and Filters */}
            <div className="mb-4">
                <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100 mb-3">Events</h1>

                {/* Search Input */}
                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500" />
                    <input
                        type="text"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        placeholder="Search events..."
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent"
                    />
                </div>

                {/* Combined Filters - Single Row with Separator */}
                <div className="flex items-center gap-2 mb-3">
                    {/* Location Filters Group */}
                    <div className="flex gap-1.5 flex-1">
                        <button
                            onClick={() => setLocationFilter('local')}
                            className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-lg transition-all font-semibold ${
                                locationFilter === 'local'
                                    ? 'bg-gradient-to-b from-green-500 to-green-600 text-white shadow-lg'
                                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300'
                            }`}
                        >
                            <MapPin className="w-4 h-4 mb-0.5" />
                            <span className="text-[0.65rem]">Local</span>
                        </button>
                        <button
                            onClick={() => setLocationFilter('global')}
                            className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-lg transition-all font-semibold ${
                                locationFilter === 'global'
                                    ? 'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-lg'
                                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300'
                            }`}
                        >
                            <Globe className="w-4 h-4 mb-0.5" />
                            <span className="text-[0.65rem]">Global</span>
                        </button>
                        <button
                            onClick={() => setLocationFilter('all')}
                            className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-lg transition-all font-semibold ${
                                locationFilter === 'all'
                                    ? 'bg-gradient-to-b from-purple-500 to-purple-600 text-white shadow-lg'
                                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300'
                            }`}
                        >
                            <Filter className="w-4 h-4 mb-0.5" />
                            <span className="text-[0.65rem]">All</span>
                        </button>
                    </div>

                    {/* Vertical Separator */}
                    <div className="h-12 w-px bg-gray-300 dark:bg-zinc-600"></div>

                    {/* View Type Filters Group */}
                    <div className="flex gap-1.5 flex-1">
                        <button
                            onClick={() => {
                                setViewType('week');
                                setCurrentOffset(0);
                            }}
                            className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-lg transition-all font-semibold ${
                                viewType === 'week'
                                    ? 'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-lg'
                                    : 'bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300'
                            }`}
                        >
                            <Calendar className="w-4 h-4 mb-0.5" />
                            <span className="text-[0.65rem]">Week</span>
                        </button>
                        <button
                            onClick={() => {
                                setViewType('month');
                                setCurrentOffset(0);
                            }}
                            className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-lg transition-all font-semibold ${
                                viewType === 'month'
                                    ? 'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-lg'
                                    : 'bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300'
                            }`}
                        >
                            <Calendar className="w-4 h-4 mb-0.5" />
                            <span className="text-[0.65rem]">Month</span>
                        </button>
                        <button
                            onClick={() => {
                                setViewType('year');
                                setCurrentOffset(0);
                            }}
                            className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-lg transition-all font-semibold ${
                                viewType === 'year'
                                    ? 'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-lg'
                                    : 'bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300'
                            }`}
                        >
                            <Calendar className="w-4 h-4 mb-0.5" />
                            <span className="text-[0.65rem]">Year</span>
                        </button>
                    </div>
                </div>

                {/* Current Period Label */}
                <div className="text-center mb-3">
                    <p className="text-sm text-gray-600 dark:text-zinc-400">{getViewLabel()}</p>
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center gap-2">
                    <button
                        onClick={() => setCurrentOffset(prev => prev - 1)}
                        className="px-3 py-2 bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-zinc-600"
                    >
                        ← Previous
                    </button>
                    {currentOffset !== 0 && (
                        <button
                            onClick={() => setCurrentOffset(0)}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                        >
                            Today
                        </button>
                    )}
                    <button
                        onClick={() => setCurrentOffset(prev => prev + 1)}
                        className="px-3 py-2 bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-zinc-600"
                    >
                        Next →
                    </button>
                </div>
            </div>

            {/* Period List */}
            <div className="space-y-2">
                {periods.map((period, index) => (
                    <div
                        key={index}
                        onClick={() => onSelectPeriod(period.startDate, period.endDate, period.periodType)}
                        className="p-4 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                    >
                        {/* Header Row */}
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3 flex-1">
                                <Calendar className="w-5 h-5 text-gray-500 dark:text-zinc-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 dark:text-zinc-100">{period.label}</p>
                                    <p className="text-sm text-gray-500 dark:text-zinc-400">
                                        {period.eventCount === 0
                                            ? 'No events'
                                            : `${period.eventCount} event${period.eventCount !== 1 ? 's' : ''}`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {period.eventCount > 0 && (
                                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm font-semibold rounded-full">
                                        {period.eventCount}
                                    </span>
                                )}
                                <ChevronRight className="w-5 h-5 text-gray-400 dark:text-zinc-500" />
                            </div>
                        </div>

                        {/* Event Titles Preview */}
                        {period.events.length > 0 && (
                            <div className="ml-8 space-y-1">
                                {period.events.slice(0, 3).map((event, eventIndex) => (
                                    <div key={event.id} className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 flex-shrink-0"></div>
                                        <p className="text-sm text-gray-700 dark:text-zinc-300 truncate">
                                            {event.title}
                                            {event.location?.global && (
                                                <span className="ml-1.5 text-xs">🌐</span>
                                            )}
                                        </p>
                                    </div>
                                ))}
                                {period.events.length > 3 && (
                                    <p className="text-xs text-gray-500 dark:text-zinc-500 italic pl-3.5">
                                        +{period.events.length - 3} more...
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
