import React, { useEffect, useState } from 'react';
import type { LogFilter, LogLevel, LogType, HttpMethod } from '@/services/logCollector/types';

interface LogsFilterBarProps {
    onFilterChange: (filter: LogFilter) => void;
    latestLogTimestamp?: number;
    currentFilter?: LogFilter;
}

const LOG_TYPES_BASE: Exclude<LogType, 'all'>[] = ['console', 'network', 'websocket', 'react-query'];
const LOG_TYPES: LogType[] = ['all', ...LOG_TYPES_BASE];
const LOG_LEVELS: LogLevel[] = ['log', 'info', 'warn', 'error', 'debug'];
const HTTP_METHODS_BASE: Exclude<HttpMethod, 'all'>[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];
const HTTP_METHODS: HttpMethod[] = ['all', ...HTTP_METHODS_BASE];

export default function LogsFilterBar({ onFilterChange, latestLogTimestamp, currentFilter }: LogsFilterBarProps) {
    const [selectedTypes, setSelectedTypes] = useState<LogType[]>(() => {
        if (currentFilter?.logTypes && currentFilter.logTypes.length > 0) {
            const types = currentFilter.logTypes as LogType[];
            return types.length === LOG_TYPES_BASE.length ? ['all'] : types;
        }
        return ['all'];
    });
    const [selectedLevel, setSelectedLevel] = useState<LogLevel>(() => currentFilter?.logLevels?.[0] || 'log');
    const [selectedMethods, setSelectedMethods] = useState<HttpMethod[]>(() => {
        if (currentFilter?.httpMethods && currentFilter.httpMethods.length > 0) {
            const methods = currentFilter.httpMethods as HttpMethod[];
            return methods.length === HTTP_METHODS_BASE.length ? ['all'] : methods;
        }
        return ['all'];
    });
    const [searchText, setSearchText] = useState(() => currentFilter?.searchText || '');
    const [timeRange, setTimeRange] = useState<'200ms' | '1s' | '5s' | '10s' | '1m' | '5m' | 'all'>('5m');
    const [lastClickTime, setLastClickTime] = useState<{ [key: string]: number }>({});
    const [timeRangeExpanded, setTimeRangeExpanded] = useState(false);
    const [timeRangeModalOpen, setTimeRangeModalOpen] = useState(false);
    const [levelFilterExpanded, setLevelFilterExpanded] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [severityTouchActive, setSeverityTouchActive] = useState(false);
    const [timeTouchActive, setTimeTouchActive] = useState(false);
    const DOUBLE_CLICK_THRESHOLD = 300; // ms

    // Sync with currentFilter when it changes from external sources (like statistic buttons)
    useEffect(() => {
        if (currentFilter) {
            if (currentFilter.logTypes && currentFilter.logTypes.length > 0) {
                const types = currentFilter.logTypes as LogType[];
                setSelectedTypes(types.length === LOG_TYPES_BASE.length ? ['all'] : types);
            }
            if (currentFilter.logLevels && currentFilter.logLevels.length > 0) {
                setSelectedLevel(currentFilter.logLevels[0]);
            }
            if (currentFilter.httpMethods && currentFilter.httpMethods.length > 0) {
                const methods = currentFilter.httpMethods as HttpMethod[];
                setSelectedMethods(methods.length === HTTP_METHODS_BASE.length ? ['all'] : methods);
            }
            if (currentFilter.searchText !== undefined) {
                setSearchText(currentFilter.searchText);
            }
        }
    }, [currentFilter?.logTypes, currentFilter?.logLevels, currentFilter?.httpMethods, currentFilter?.searchText]);

    // Detect mobile screen size
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Close touch-expanded sections when user taps outside (mobile)
    useEffect(() => {
        const handleTouchOutside = () => {
            setSeverityTouchActive(false);
            setTimeTouchActive(false);
        };

        if (isMobile && (severityTouchActive || timeTouchActive)) {
            document.addEventListener('touchstart', handleTouchOutside);
            return () => document.removeEventListener('touchstart', handleTouchOutside);
        }
    }, [isMobile, severityTouchActive, timeTouchActive]);

    // Debounced filter application
    useEffect(() => {
        const timer = setTimeout(() => {
            let timeRangeFilter = {
                start: null as number | null,
                end: null as number | null,
            };

            const baseTime = latestLogTimestamp || Date.now();
            if (timeRange === 'all') {
                timeRangeFilter = { start: null, end: null };
            }
            else if (timeRange === '200ms') {
                timeRangeFilter.start = baseTime - 200;
            }
            else if (timeRange === '1s') {
                timeRangeFilter.start = baseTime - 1000;
            }
            else if (timeRange === '5s') {
                timeRangeFilter.start = baseTime - 5 * 1000;
            }
            else if (timeRange === '10s') {
                timeRangeFilter.start = baseTime - 10 * 1000;
            }
            else if (timeRange === '1m') {
                timeRangeFilter.start = baseTime - 60 * 1000;
            }
            else if (timeRange === '5m') {
                timeRangeFilter.start = baseTime - 5 * 60 * 1000;
            }

            // Handle 'all' type - convert to actual types to filter
            const typesToFilter = selectedTypes.includes('all') ? LOG_TYPES_BASE : selectedTypes.filter((t) => t !== 'all');

            // Handle 'all' method - convert to actual methods to filter
            const methodsToFilter = selectedMethods.includes('all') ? HTTP_METHODS_BASE : selectedMethods.filter((m) => m !== 'all');

            onFilterChange({
                logTypes: typesToFilter,
                logLevels: [selectedLevel],
                httpMethods: methodsToFilter,
                searchText,
                timeRange: timeRangeFilter,
            });
        }, 300);

        return () => clearTimeout(timer);
    }, [selectedTypes, selectedLevel, selectedMethods, searchText, timeRange, onFilterChange, latestLogTimestamp]);

    const toggleType = (type: LogType) => {
        setSelectedTypes((prev) => {
            if (type === 'all') {
                // Clicking "all" selects all types
                return prev.includes('all') ? ['all'] : ['all'];
            }

            // Toggling a specific type
            const hasType = prev.includes(type);
            if (hasType) {
                // Remove the type and also remove "all"
                return prev.filter((t) => t !== type && t !== 'all');
            }
            else {
                // Add the type
                const newTypes = [...prev.filter((t) => t !== 'all'), type];
                // If all individual types are selected, show "all"
                if (newTypes.length === LOG_TYPES_BASE.length) {
                    return ['all'];
                }
                return newTypes;
            }
        });
    };


    const onTypeClick = (type: LogType) => {
        const now = Date.now();
        const prevClickTime = lastClickTime[`type-${type}`] || 0;
        const timeSinceLastClick = now - prevClickTime;
        setLastClickTime((prev) => ({ ...prev, [`type-${type}`]: now }));

        if (timeSinceLastClick < DOUBLE_CLICK_THRESHOLD) {
            // Double click: isolate this type
            setSelectedTypes([type === 'all' ? 'all' : type]);
        }
        else {
            // Single click: toggle
            toggleType(type);
        }
    };

    const onLevelClick = (level: LogLevel) => {
        setSelectedLevel(level);
    };

    const onMethodClick = (method: HttpMethod) => {
        const now = Date.now();
        const prevClickTime = lastClickTime[`method-${method}`] || 0;
        const timeSinceLastClick = now - prevClickTime;
        setLastClickTime((prev) => ({ ...prev, [`method-${method}`]: now }));

        if (timeSinceLastClick < DOUBLE_CLICK_THRESHOLD) {
            // Double click: isolate this method
            setSelectedMethods([method === 'all' ? 'all' : method]);
        }
        else {
            // Single click: toggle
            toggleMethod(method);
        }
    };

    const toggleMethod = (method: HttpMethod) => {
        setSelectedMethods((prev) => {
            if (method === 'all') {
                // Clicking "all" selects all methods
                return prev.includes('all') ? ['all'] : ['all'];
            }

            // Toggling a specific method
            const hasMethod = prev.includes(method);
            if (hasMethod) {
                // Remove the method and also remove "all"
                return prev.filter((m) => m !== method && m !== 'all');
            }
            else {
                // Add the method
                const newMethods = [...prev.filter((m) => m !== 'all'), method];
                // If all individual methods are selected, show "all"
                if (newMethods.length === HTTP_METHODS_BASE.length) {
                    return ['all'];
                }
                return newMethods;
            }
        });
    };

    const showHttpMethods = selectedTypes.includes('all') || selectedTypes.includes('network');

    return (
        <div className='p-2 bg-gray-50 dark:bg-slate-900 rounded border border-gray-200 dark:border-gray-700 space-y-1.5'>
            {/* Search Input */}
            <input
                type='text'
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder='Search logs...'
                className='w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500'
            />

            {/* Filters - All on one row */}
            <div className='flex items-center gap-1.5 flex-wrap'>
                {/* Log Types */}
                <span className='text-xs font-semibold text-gray-600 dark:text-gray-400'>Type:</span>
                {LOG_TYPES.map((type) => (
                    <button
                        key={type}
                        onClick={() => onTypeClick(type)}
                        className={`px-1.5 py-0.5 text-xs rounded transition-colors ${
                            selectedTypes.includes(type)
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-600'
                        }`}
                        title='Click to toggle, double-click to isolate'
                    >
                        {type}
                    </button>
                ))}

                {/* Severity - Collapsible on Hover (Desktop) or Touch (Mobile) */}
                {isMobile ? (
                    severityTouchActive ? (
                        <div className='w-full flex flex-col gap-1.5 border border-blue-300 dark:border-blue-600 rounded p-1.5 bg-blue-50 dark:bg-blue-950'>
                            <span className='text-xs font-semibold text-gray-600 dark:text-gray-400 px-1.5'>Severity:</span>
                            {LOG_LEVELS.map((level) => (
                                <button
                                    key={level}
                                    onClick={() => {
                                        onLevelClick(level);
                                        setSeverityTouchActive(false);
                                    }}
                                    className={`w-full text-left px-2 py-1.5 text-xs rounded transition-colors ${
                                        selectedLevel === level
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <button
                            onClick={() => setSeverityTouchActive(true)}
                            className='px-2 py-1 text-xs rounded bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors flex-shrink-0'
                        >
                            Severity: {selectedLevel}
                        </button>
                    )
                ) : (
                    <>
                        <span className='text-gray-400 dark:text-gray-600'>|</span>
                        <div
                            className='relative'
                            onMouseEnter={() => setLevelFilterExpanded(true)}
                            onMouseLeave={() => setLevelFilterExpanded(false)}
                        >
                            <button
                                onClick={() => setLevelFilterExpanded(!levelFilterExpanded)}
                                className='px-2 py-1 text-xs rounded bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors flex-shrink-0'
                            >
                                Severity: {selectedLevel}
                            </button>
                            {levelFilterExpanded && (
                                <div className='absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-600 rounded shadow-lg z-10 min-w-max'>
                                    {LOG_LEVELS.map((level) => (
                                        <button
                                            key={level}
                                            onClick={() => {
                                                onLevelClick(level);
                                                setLevelFilterExpanded(false);
                                            }}
                                            className={`block w-full text-left px-3 py-2 text-xs rounded-none transition-colors first:rounded-t last:rounded-b ${
                                                selectedLevel === level
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* HTTP Methods - Conditional */}
                {showHttpMethods && (
                    <>
                        <span className='text-gray-400 dark:text-gray-600'>|</span>
                        <span className='text-xs font-semibold text-gray-600 dark:text-gray-400'>Method:</span>
                        {HTTP_METHODS.map((method) => (
                            <button
                                key={method}
                                onClick={() => onMethodClick(method)}
                                className={`px-1.5 py-0.5 text-xs rounded transition-colors font-mono ${
                                    selectedMethods.includes(method)
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-600'
                                }`}
                                title='Click to toggle, double-click to isolate'
                            >
                                {method}
                            </button>
                        ))}
                    </>
                )}

                {/* Time Range - Collapsible on Hover (Desktop) or Touch (Mobile) */}
                {isMobile ? (
                    timeTouchActive ? (
                        <div className='w-full flex flex-col gap-1.5 border border-orange-300 dark:border-orange-600 rounded p-1.5 bg-orange-50 dark:bg-orange-950'>
                            <span className='text-xs font-semibold text-gray-600 dark:text-gray-400 px-1.5'>Time Range:</span>
                            {(['200ms', '1s', '5s', '10s', '1m', '5m', 'all'] as const).map((range) => (
                                <button
                                    key={range}
                                    onClick={() => {
                                        setTimeRange(range);
                                        setTimeTouchActive(false);
                                    }}
                                    className={`w-full text-left px-2 py-1.5 text-xs rounded transition-colors ${
                                        timeRange === range
                                            ? 'bg-orange-600 text-white font-medium'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    {range === 'all' ? 'All Time' : range}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <button
                            onClick={() => setTimeTouchActive(true)}
                            className='px-2 py-1 text-xs rounded bg-orange-600 text-white font-medium hover:bg-orange-700 transition-colors flex-shrink-0'
                        >
                            Time: {timeRange === 'all' ? 'All' : timeRange}
                        </button>
                    )
                ) : (
                    <>
                        <span className='text-gray-400 dark:text-gray-600'>|</span>
                        <div
                            className='relative'
                            onMouseEnter={() => setTimeRangeExpanded(true)}
                            onMouseLeave={() => setTimeRangeExpanded(false)}
                        >
                            <button
                                onClick={() => setTimeRangeExpanded(!timeRangeExpanded)}
                                className='px-2 py-1 text-xs rounded bg-orange-600 text-white font-medium hover:bg-orange-700 transition-colors flex-shrink-0'
                            >
                                Time: {timeRange === 'all' ? 'All' : timeRange}
                            </button>
                            {timeRangeExpanded && (
                                <div className='absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-orange-300 dark:border-orange-600 rounded shadow-lg z-10 min-w-max'>
                                    {(['200ms', '1s', '5s', '10s', '1m', '5m', 'all'] as const).map((range) => (
                                        <button
                                            key={range}
                                            onClick={() => {
                                                setTimeRange(range);
                                                setTimeRangeExpanded(false);
                                            }}
                                            className={`block w-full text-left px-3 py-2 text-xs rounded-none transition-colors first:rounded-t last:rounded-b ${
                                                timeRange === range
                                                    ? 'bg-orange-600 text-white font-medium'
                                                    : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            {range === 'all' ? 'All Time' : range}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Mobile Time Range Modal */}
            {timeRangeModalOpen && isMobile && (
                <div className='fixed inset-0 z-50 bg-gray-900 dark:bg-slate-950 flex flex-col'>
                    {/* Header */}
                    <div className='flex items-center justify-between p-4 border-b border-gray-700 dark:border-gray-600'>
                        <h2 className='text-sm font-semibold text-white'>Select Time Range</h2>
                        <button
                            onClick={() => setTimeRangeModalOpen(false)}
                            className='text-xl text-gray-400 hover:text-white transition-colors'
                            title='Back'
                        >
                            ← Back
                        </button>
                    </div>

                    {/* Options */}
                    <div className='flex-1 overflow-y-auto p-4 space-y-2'>
                        {(['200ms', '1s', '5s', '10s', '1m', '5m', 'all'] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => {
                                    setTimeRange(range);
                                    setTimeRangeModalOpen(false);
                                }}
                                className={`w-full px-4 py-3 text-sm rounded transition-colors text-left ${
                                    timeRange === range
                                        ? 'bg-orange-600 text-white font-medium'
                                        : 'bg-gray-800 dark:bg-gray-700 text-gray-200 hover:bg-gray-700 dark:hover:bg-gray-600'
                                }`}
                            >
                                {range === 'all' ? 'All Time' : range}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
