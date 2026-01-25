import React, { useState, useRef, useEffect } from 'react';
import { useLogCollector } from '@/hooks/useLogCollector';
import LogsFilterBar from './LogsFilterBar';
import type { LogEntry, LogFilter } from '@/services/logCollector/types';

// Configurable truncation limits
const PAYLOAD_TRUNCATE_LENGTH = 500; // Characters to show before truncation

// Modal component for viewing full payloads
const PayloadModal = ({
    isOpen,
    payload,
    title,
    onClose
}: {
    isOpen: boolean;
    payload: any;
    title: string;
    onClose: () => void;
}) => {
    if (!isOpen) return null;

    const handleCopy = () => {
        const text = JSON.stringify(payload, null, 2);
        navigator.clipboard.writeText(text);
    };

    return (
        <div className='fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4'>
            <div className='bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col'>
                {/* Header */}
                <div className='flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0'>
                    <h2 className='text-sm font-semibold text-gray-900 dark:text-white'>
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl font-bold'
                        title='Close'
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <pre className='flex-1 overflow-auto px-4 py-3 bg-gray-50 dark:bg-slate-900 text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words'>
                    {JSON.stringify(payload, null, 2)}
                </pre>

                {/* Footer */}
                <div className='flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0'>
                    <button
                        onClick={handleCopy}
                        className='px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium transition-colors'
                    >
                        Copy
                    </button>
                    <button
                        onClick={onClose}
                        className='px-3 py-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded text-xs font-medium transition-colors'
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

const LogRow = React.memo(
    ({
        log,
        onAddToRecording,
        onAddFromHere,
        onSelectRangeStart,
        isRangeStart,
        isPinned,
        onPin
    }: {
        log: LogEntry;
        onAddToRecording: (logId: string) => void;
        onAddFromHere: (logId: string) => void;
        onSelectRangeStart: (logId: string) => void;
        isRangeStart: boolean;
        isPinned: boolean;
        onPin: (logId: string) => void;
    }) => {
        const [expanded, setExpanded] = useState(false);
        const [payloadModal, setPayloadModal] = useState<{
            isOpen: boolean;
            payload: any;
            title: string;
        }>({
            isOpen: false,
            payload: null,
            title: ''
        });
        const time = new Date(log.timestamp).toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3
        });

        const getTypeColor = () => {
            switch (log.type) {
            case 'console':
                return 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100';
            case 'network':
                return 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100';
            case 'websocket':
                return 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100';
            case 'react-query':
                return 'bg-orange-100 dark:bg-orange-900 text-orange-900 dark:text-orange-100';
            default:
                return 'bg-gray-100 dark:bg-gray-700';
            }
        };

        const getTypeLabel = () => {
            switch (log.type) {
            case 'console':
                return (log as any).level?.toUpperCase() || 'LOG';
            case 'network':
                return (log as any).method || 'HTTP';
            case 'websocket':
                return (log as any).direction === 'sent' ? '→' : '←';
            case 'react-query':
                return (log as any).operation?.toUpperCase() || 'RQ';
            default:
                return '?';
            }
        };

        const handleCopy = () => {
            const text = JSON.stringify(log, null, 2);
            navigator.clipboard.writeText(text);
        };

        const getTruncatedPayload = (payload: any): string => {
            const json = JSON.stringify(payload, null, 2);
            if (json.length > PAYLOAD_TRUNCATE_LENGTH) {
                return (
                    json.substring(0, PAYLOAD_TRUNCATE_LENGTH) +
                    '\n... (truncated)'
                );
            }
            return json;
        };

        const openPayloadModal = (payload: any, title: string) => {
            setPayloadModal({ isOpen: true, payload, title });
        };

        return (
            <div
                className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-900/50 transition-colors ${isPinned ? 'bg-yellow-50 dark:bg-yellow-900/20 border-l-2 border-l-yellow-500' : ''}`}
            >
                <div className='flex items-center gap-2 px-3 py-2 group'>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className='flex-1 text-left focus:outline-none min-w-0'
                    >
                        <div className='flex items-center gap-2 text-xs'>
                            <span className='text-gray-500 dark:text-gray-400 font-mono w-12 flex-shrink-0'>
                                {time}
                            </span>
                            <span
                                className={`px-2 py-0.5 rounded font-semibold text-xs flex-shrink-0 ${getTypeColor()}`}
                            >
                                {getTypeLabel()}
                            </span>
                            <span className='text-gray-900 dark:text-gray-100 flex-1 truncate'>
                                {log.message}
                            </span>
                            <span className='text-gray-400 dark:text-gray-500 flex-shrink-0'>
                                {expanded ? '▼' : '▶'}
                            </span>
                        </div>
                    </button>
                    <div className='flex items-center gap-1 flex-shrink-0'>
                        <button
                            onClick={() => onPin(log.id)}
                            className={`px-2 py-1 text-xs rounded transition-colors shadow-sm font-semibold ${
                                isPinned
                                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                    : 'bg-gray-400 hover:bg-gray-500 text-white'
                            }`}
                            title={
                                isPinned
                                    ? 'Click to unpin and stop following'
                                    : 'Pin this log to keep it visible when filtering'
                            }
                        >
                            PIN
                        </button>
                        <button
                            onClick={() => onAddToRecording(log.id)}
                            className='px-2.5 py-1 text-xs font-bold rounded transition-colors shadow-sm bg-purple-600 hover:bg-purple-700 text-white'
                            title='Add this log'
                        >
                            +
                        </button>
                        <button
                            onClick={() => onAddFromHere(log.id)}
                            className='px-2 py-1 text-xs rounded transition-colors shadow-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold'
                            title='Add this log and all newer logs above'
                        >
                            ↑+
                        </button>
                        <button
                            onClick={() => onSelectRangeStart(log.id)}
                            className={`px-2 py-1 text-xs rounded transition-colors shadow-sm font-semibold ${
                                isRangeStart
                                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                    : 'bg-gray-500 hover:bg-gray-600 text-white'
                            }`}
                            title={
                                isRangeStart
                                    ? 'Click another log to complete range, or click here to deselect'
                                    : 'Click to select range anchor'
                            }
                        >
                            ◯
                        </button>
                    </div>
                </div>

                {expanded && (
                    <div className='bg-gray-100 dark:bg-slate-900 px-3 py-2 border-t border-gray-200 dark:border-gray-700'>
                        <div className='text-xs font-mono text-gray-600 dark:text-gray-300 space-y-1 max-h-64 overflow-y-auto'>
                            <div className='flex justify-between items-start gap-4'>
                                <div className='flex-1'>
                                    <div className='font-semibold mb-2 text-gray-900 dark:text-gray-100'>
                                        Details
                                    </div>
                                    <div className='space-y-1'>
                                        <div>
                                            <span className='font-semibold'>
                                                ID:
                                            </span>{' '}
                                            {log.id}
                                        </div>
                                        <div>
                                            <span className='font-semibold'>
                                                Type:
                                            </span>{' '}
                                            {log.type}
                                        </div>
                                        {log.type === 'network' && (
                                            <>
                                                <div>
                                                    <span className='font-semibold'>
                                                        URL:
                                                    </span>{' '}
                                                    <span className='break-all'>
                                                        {(log as any).url}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className='font-semibold'>
                                                        Status:
                                                    </span>{' '}
                                                    {(log as any).status}
                                                </div>
                                                <div>
                                                    <span className='font-semibold'>
                                                        Duration:
                                                    </span>{' '}
                                                    {(log as any).duration}ms
                                                </div>
                                            </>
                                        )}
                                        {log.type === 'react-query' && (
                                            <>
                                                <div>
                                                    <span className='font-semibold'>
                                                        Key:
                                                    </span>{' '}
                                                    {(log as any).queryKey}
                                                </div>
                                                <div>
                                                    <span className='font-semibold'>
                                                        Status:
                                                    </span>{' '}
                                                    {(log as any).status}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={handleCopy}
                                    className='px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium whitespace-nowrap'
                                >
                                    Copy
                                </button>
                            </div>

                            {log.type === 'network' && (
                                <div className='mt-3 pt-3 border-t border-gray-300 dark:border-gray-600 space-y-2'>
                                    {(log as any).requestBody && (
                                        <div>
                                            <div className='flex items-center justify-between mb-1'>
                                                <div className='font-semibold'>
                                                    Request Body:
                                                </div>
                                                {JSON.stringify(
                                                    (log as any).requestBody,
                                                    null,
                                                    2
                                                ).length >
                                                    PAYLOAD_TRUNCATE_LENGTH && (
                                                    <button
                                                        onClick={() =>
                                                            openPayloadModal(
                                                                (log as any)
                                                                    .requestBody,
                                                                'Request Body'
                                                            )
                                                        }
                                                        className='text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium'
                                                    >
                                                        View Full
                                                    </button>
                                                )}
                                            </div>
                                            <pre className='bg-gray-200 dark:bg-slate-800 p-2 rounded overflow-auto max-h-48 text-xs'>
                                                {getTruncatedPayload(
                                                    (log as any).requestBody
                                                )}
                                            </pre>
                                        </div>
                                    )}
                                    {(log as any).responseBody && (
                                        <div>
                                            <div className='flex items-center justify-between mb-1'>
                                                <div className='font-semibold'>
                                                    Response Body:
                                                </div>
                                                {JSON.stringify(
                                                    (log as any).responseBody,
                                                    null,
                                                    2
                                                ).length >
                                                    PAYLOAD_TRUNCATE_LENGTH && (
                                                    <button
                                                        onClick={() =>
                                                            openPayloadModal(
                                                                (log as any)
                                                                    .responseBody,
                                                                'Response Body'
                                                            )
                                                        }
                                                        className='text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium'
                                                    >
                                                        View Full
                                                    </button>
                                                )}
                                            </div>
                                            <pre className='bg-gray-200 dark:bg-slate-800 p-2 rounded overflow-auto max-h-48 text-xs'>
                                                {getTruncatedPayload(
                                                    (log as any).responseBody
                                                )}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Payload Modal */}
                <PayloadModal
                    isOpen={payloadModal.isOpen}
                    payload={payloadModal.payload}
                    title={payloadModal.title}
                    onClose={() =>
                        setPayloadModal({
                            isOpen: false,
                            payload: null,
                            title: ''
                        })
                    }
                />
            </div>
        );
    }
);

LogRow.displayName = 'LogRow';

interface LogsSectionProps {
    selectedLogs: LogEntry[];
    onSelectedLogsChange: (logs: LogEntry[]) => void;
}

export default function LogsSection({
    selectedLogs,
    onSelectedLogsChange
}: LogsSectionProps) {
    const {
        logs,
        filteredLogs,
        clearLogs,
        exportLogs,
        filterLogs,
        isPaused,
        setPaused,
        statistics
    } = useLogCollector();
    const [filter, setFilter] = useState<LogFilter>({
        logTypes: ['console', 'network', 'websocket', 'react-query'],
        logLevels: ['log'],
        httpMethods: [
            'GET',
            'POST',
            'PUT',
            'PATCH',
            'DELETE',
            'OPTIONS',
            'HEAD'
        ],
        searchText: '',
        timeRange: { start: Date.now() - 5 * 60 * 1000, end: null } // Default to 5 minutes
    });
    const [rangeStartLogId, setRangeStartLogId] = useState<string | null>(null);
    const [currentTimeRange, setCurrentTimeRange] = useState<
        '200ms' | '1s' | '5s' | '10s' | '1m' | '5m' | 'all'
    >('5m');
    const [customTimeStart, setCustomTimeStart] = useState<number | null>(null);
    const [customTimeEnd, setCustomTimeEnd] = useState<number | null>(null);
    const [showCustomTimeRange, setShowCustomTimeRange] = useState(false);
    const [timeRangeMenuOpen, setTimeRangeMenuOpen] = useState(false);
    const [severityMenuOpen, setSeverityMenuOpen] = useState(false);
    const timeRangeMenuRef = useRef<HTMLDivElement>(null);
    const severityMenuRef = useRef<HTMLDivElement>(null);
    const [pinnedLogIds, setPinnedLogIds] = useState<Set<string>>(() => {
        try {
            const saved = localStorage.getItem('kudos-logs-pinned-ids');
            return new Set(saved ? JSON.parse(saved) : []);
        }
        catch {
            return new Set();
        }
    });
    const [pinnedLogNames, setPinnedLogNames] = useState<Map<string, string>>(
        () => {
            try {
                const saved = localStorage.getItem('kudos-logs-pinned-names');
                return new Map(saved ? JSON.parse(saved) : []);
            }
            catch {
                return new Map();
            }
        }
    );
    const [editingPinId, setEditingPinId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState<string>('');
    const HTTP_METHODS = [
        'all',
        'GET',
        'POST',
        'PUT',
        'PATCH',
        'DELETE',
        'OPTIONS',
        'HEAD'
    ] as const;
    const [selectedMethods, setSelectedMethods] = useState<
        (typeof HTTP_METHODS)[number][]
            >(() => {
                const saved = localStorage.getItem('kudos-logs-selected-methods');
                return saved ? JSON.parse(saved) : ['all'];
            });
    const logContainerRef = useRef<HTMLDivElement>(null);
    const pinnedLogRefMap = useRef<Map<string, HTMLDivElement>>(new Map());

    // Persist selected methods to localStorage
    useEffect(() => {
        localStorage.setItem(
            'kudos-logs-selected-methods',
            JSON.stringify(selectedMethods)
        );
        // Update filter with new methods
        const methodsToFilter = selectedMethods.includes('all')
            ? ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']
            : selectedMethods.filter((m) => m !== 'all');
        const newFilter = { ...filter, httpMethods: methodsToFilter as any };
        setFilter(newFilter);
        filterLogs(newFilter);
    }, [selectedMethods]);

    // Persist pinned IDs to localStorage
    useEffect(() => {
        localStorage.setItem(
            'kudos-logs-pinned-ids',
            JSON.stringify(Array.from(pinnedLogIds))
        );
    }, [pinnedLogIds]);

    // Persist pinned names to localStorage
    useEffect(() => {
        localStorage.setItem(
            'kudos-logs-pinned-names',
            JSON.stringify(Array.from(pinnedLogNames))
        );
    }, [pinnedLogNames]);

    // Close time range menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                timeRangeMenuRef.current &&
                !timeRangeMenuRef.current.contains(event.target as Node)
            ) {
                setTimeRangeMenuOpen(false);
            }
        };

        if (timeRangeMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () =>
                document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [timeRangeMenuOpen]);

    // Close severity menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                severityMenuRef.current &&
                !severityMenuRef.current.contains(event.target as Node)
            ) {
                setSeverityMenuOpen(false);
            }
        };

        if (severityMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () =>
                document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [severityMenuOpen]);

    const handleFilterChange = (newFilter: LogFilter) => {
        setFilter(newFilter);
        filterLogs(newFilter);
    };

    const handleExport = () => {
        const json = exportLogs();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleClearLogs = () => {
        if (
            window.confirm(
                'Are you sure you want to clear all logs? This cannot be undone.'
            )
        ) {
            clearLogs();
        }
    };

    const handleStatisticClick = (
        filterType:
            | 'all'
            | 'console'
            | 'network'
            | 'websocket'
            | 'react-query'
            | 'errors'
            | 'warnings'
    ) => {
        let newLogTypes: typeof filter.logTypes;
        let newLogLevels: typeof filter.logLevels;

        if (filterType === 'all') {
            // Show all types
            newLogTypes = ['console', 'network', 'websocket', 'react-query'];
            newLogLevels = ['log', 'info', 'warn', 'error', 'debug'];
        }
        else if (filterType === 'errors') {
            // Show console errors + network errors (4xx/5xx)
            newLogTypes = ['console', 'network'];
            newLogLevels = ['error'];
        }
        else if (filterType === 'warnings') {
            // Show console warnings only
            newLogTypes = ['console'];
            newLogLevels = ['warn'];
        }
        else {
            // Mutually exclusive: clicking one type isolates it
            newLogTypes = [filterType];
            newLogLevels = ['log', 'info', 'warn', 'error', 'debug'];
        }

        const newFilter = {
            ...filter,
            logTypes: newLogTypes,
            logLevels: newLogLevels
        };
        setFilter(newFilter);
        filterLogs(newFilter);
    };

    const handleAddToText = (logId: string) => {
        const log = logs.find((l) => l.id === logId);
        if (log) {
            onSelectedLogsChange([...selectedLogs, log]);
        }
    };

    const handleAddFromHere = (logId: string) => {
        // Find index in the filtered logs (what user is actually seeing)
        const startIndex = filteredLogs.findIndex((l) => l.id === logId);
        if (startIndex === -1) return;

        // Add this log and all filtered logs above it (newer logs, from index 0 to this one inclusive)
        const logsFromHere = filteredLogs.slice(0, startIndex + 1);
        const newSelectedLogs = [...selectedLogs];
        logsFromHere.forEach((log) => {
            if (!newSelectedLogs.find((l) => l.id === log.id)) {
                newSelectedLogs.push(log);
            }
        });
        onSelectedLogsChange(newSelectedLogs);
    };

    const handleSelectRangeStart = (logId: string) => {
        // If clicking the same anchor button, deselect
        if (logId === rangeStartLogId) {
            setRangeStartLogId(null);
            return;
        }

        // If no anchor set yet, set this as anchor
        if (!rangeStartLogId) {
            setRangeStartLogId(logId);
            return;
        }

        // If anchor is set and we're clicking a different log, complete the range
        const startIndex = filteredLogs.findIndex(
            (l) => l.id === rangeStartLogId
        );
        const endIndex = filteredLogs.findIndex((l) => l.id === logId);

        if (startIndex === -1 || endIndex === -1) return;

        // Ensure we have the correct order
        const min = Math.min(startIndex, endIndex);
        const max = Math.max(startIndex, endIndex);

        // Add all logs in range (inclusive)
        const logsInRange = filteredLogs.slice(min, max + 1);
        const newSelectedLogs = [...selectedLogs];
        logsInRange.forEach((log) => {
            if (!newSelectedLogs.find((l) => l.id === log.id)) {
                newSelectedLogs.push(log);
            }
        });
        onSelectedLogsChange(newSelectedLogs);
        setRangeStartLogId(null);
    };

    const handlePin = (logId: string) => {
        // Toggle pin - clicking same log unpin
        const newPinned = new Set(pinnedLogIds);
        if (newPinned.has(logId)) {
            newPinned.delete(logId);
        }
        else {
            newPinned.add(logId);
        }
        setPinnedLogIds(newPinned);
    };

    const handleJumpToPin = (logId: string) => {
        // Jump to pinned log
        if (pinnedLogRefMap.current.has(logId)) {
            const element = pinnedLogRefMap.current.get(logId);
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }, 0);
            }
        }
    };

    const handleStartRename = (logId: string, currentName: string) => {
        setEditingPinId(logId);
        setEditingName(currentName);
    };

    const handleSaveRename = (logId: string) => {
        const newNames = new Map(pinnedLogNames);
        if (editingName.trim()) {
            newNames.set(logId, editingName.trim());
        }
        else {
            newNames.delete(logId);
        }
        setPinnedLogNames(newNames);
        setEditingPinId(null);
        setEditingName('');
    };

    const handleCancelRename = () => {
        setEditingPinId(null);
        setEditingName('');
    };

    const toggleMethod = (method: (typeof HTTP_METHODS)[number]) => {
        setSelectedMethods((prev) => {
            if (method === 'all') {
                return prev.includes('all') ? ['all'] : ['all'];
            }
            const hasMethod = prev.includes(method);
            if (hasMethod) {
                return prev.filter((m) => m !== method && m !== 'all');
            }
            else {
                const newMethods = [...prev.filter((m) => m !== 'all'), method];
                if (newMethods.length === HTTP_METHODS.length - 1) {
                    return ['all'];
                }
                return newMethods;
            }
        });
    };

    return (
        <div className='space-y-2 h-full flex flex-col'>
            {/* Compact Header - Multiple rows */}
            <div className='space-y-1.5'>
                {/* Row 1: Control Buttons and Main Filters */}
                <div className='flex flex-wrap items-center gap-1.5'>
                    {/* Control Buttons */}
                    <button
                        onClick={handleClearLogs}
                        className='px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors flex-shrink-0'
                        title='Clear all logs'
                    >
                        Clear
                    </button>
                    <button
                        onClick={handleExport}
                        className='px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors flex-shrink-0'
                        title='Export logs as JSON'
                    >
                        Export
                    </button>
                    <button
                        onClick={() => setPaused(!isPaused)}
                        className={`px-2 py-1 text-xs font-medium rounded transition-colors flex-shrink-0 ${
                            isPaused
                                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                        title={isPaused ? 'Resume logging' : 'Pause logging'}
                    >
                        {isPaused ? '▶' : '⏸'}
                    </button>

                    {/* Separator */}
                    <div className='w-px h-4 bg-gray-300 dark:bg-gray-600 flex-shrink-0' />

                    {/* Statistics as clickable filter buttons - matching Type: section behavior */}
                    <button
                        onClick={() => handleStatisticClick('all')}
                        className={`px-2 py-1 text-xs font-medium rounded transition-colors flex-shrink-0 ${
                            filter.logTypes.length === 4
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-600'
                        }`}
                        title='Click to select/deselect all log types'
                    >
                        All:{statistics.total}
                    </button>
                    <button
                        onClick={() => handleStatisticClick('console')}
                        className={`px-2 py-1 text-xs font-medium rounded transition-colors flex-shrink-0 ${
                            filter.logTypes.includes('console')
                                ? 'bg-gray-600 text-white'
                                : 'bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-600'
                        }`}
                        title='Click to toggle, double-click to isolate'
                    >
                        C:{statistics.console}
                    </button>
                    <button
                        onClick={() => handleStatisticClick('network')}
                        className={`px-2 py-1 text-xs font-medium rounded transition-colors flex-shrink-0 ${
                            filter.logTypes.includes('network')
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-300 dark:bg-blue-700 text-blue-900 dark:text-blue-300 hover:bg-blue-400 dark:hover:bg-blue-600'
                        }`}
                        title='Click to toggle, double-click to isolate'
                    >
                        N:{statistics.network}
                    </button>
                    <button
                        onClick={() => handleStatisticClick('websocket')}
                        className={`px-2 py-1 text-xs font-medium rounded transition-colors flex-shrink-0 ${
                            filter.logTypes.includes('websocket')
                                ? 'bg-green-600 text-white'
                                : 'bg-green-300 dark:bg-green-700 text-green-900 dark:text-green-300 hover:bg-green-400 dark:hover:bg-green-600'
                        }`}
                        title='Click to toggle, double-click to isolate'
                    >
                        WS:{statistics.websocket}
                    </button>
                    <button
                        onClick={() => handleStatisticClick('react-query')}
                        className={`px-2 py-1 text-xs font-medium rounded transition-colors flex-shrink-0 ${
                            filter.logTypes.includes('react-query')
                                ? 'bg-orange-600 text-white'
                                : 'bg-orange-300 dark:bg-orange-700 text-orange-900 dark:text-orange-300 hover:bg-orange-400 dark:hover:bg-orange-600'
                        }`}
                        title='Click to toggle, double-click to isolate'
                    >
                        Q:{statistics.reactQuery}
                    </button>
                    <button
                        onClick={() => handleStatisticClick('errors')}
                        className={`px-2 py-1 text-xs font-medium rounded transition-colors flex-shrink-0 ${
                            filter.logTypes.includes('console') &&
                            filter.logTypes.includes('network') &&
                            filter.logLevels.includes('error') &&
                            filter.logLevels.length === 1
                                ? 'bg-red-600 text-white'
                                : 'bg-red-300 dark:bg-red-700 text-red-900 dark:text-red-300 hover:bg-red-400 dark:hover:bg-red-600'
                        }`}
                        title='Show console and network errors'
                    >
                        Errors:{statistics.errors}
                    </button>
                    <button
                        onClick={() => handleStatisticClick('warnings')}
                        className={`px-2 py-1 text-xs font-medium rounded transition-colors flex-shrink-0 ${
                            filter.logTypes.includes('console') &&
                            filter.logTypes.length === 1 &&
                            filter.logLevels.includes('warn') &&
                            filter.logLevels.length === 1
                                ? 'bg-yellow-500 text-white'
                                : 'bg-yellow-300 dark:bg-yellow-700 text-yellow-900 dark:text-yellow-300 hover:bg-yellow-400 dark:hover:bg-yellow-600'
                        }`}
                        title='Show console warnings'
                    >
                        Warnings:{statistics.warnings}
                    </button>

                    {/* Severity Level Selector */}
                    <div className='relative' ref={severityMenuRef}>
                        <button
                            onClick={() =>
                                setSeverityMenuOpen(!severityMenuOpen)
                            }
                            className={`px-2 py-1 text-xs font-medium rounded transition-colors flex-shrink-0 ${
                                severityMenuOpen
                                    ? 'bg-blue-700 text-white'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                            title='Filter by severity level'
                        >
                            Severity: {filter.logLevels[0]}
                        </button>
                        {severityMenuOpen && (
                            <div className='absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-600 rounded shadow-lg z-50 min-w-max'>
                                {(
                                    [
                                        'log',
                                        'info',
                                        'warn',
                                        'error',
                                        'debug'
                                    ] as const
                                ).map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => {
                                            const newFilter = {
                                                ...filter,
                                                logLevels: [level]
                                            };
                                            setFilter(newFilter);
                                            filterLogs(newFilter);
                                            setSeverityMenuOpen(false);
                                        }}
                                        className={`block w-full text-left px-3 py-2 text-xs rounded-none transition-colors first:rounded-t-md last:rounded-b-md ${
                                            filter.logLevels.includes(level)
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

                    {/* Time Range Selector */}
                    <div className='relative' ref={timeRangeMenuRef}>
                        <button
                            onClick={() =>
                                setTimeRangeMenuOpen(!timeRangeMenuOpen)
                            }
                            className={`px-2 py-1 text-xs font-medium rounded transition-colors flex-shrink-0 ${
                                timeRangeMenuOpen
                                    ? 'bg-orange-700 text-white'
                                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                            }`}
                            title='Filter by time range'
                        >
                            Time:{' '}
                            {showCustomTimeRange
                                ? 'Custom Range'
                                : currentTimeRange === 'all'
                                    ? 'All'
                                    : currentTimeRange}
                        </button>
                        {timeRangeMenuOpen && (
                            <div className='absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-orange-300 dark:border-orange-600 rounded shadow-lg z-50 min-w-max'>
                                {(
                                    [
                                        '200ms',
                                        '1s',
                                        '5s',
                                        '10s',
                                        '1m',
                                        '5m',
                                        'all'
                                    ] as const
                                ).map((range) => (
                                    <button
                                        key={range}
                                        onClick={() => {
                                            setCurrentTimeRange(range);
                                            setShowCustomTimeRange(false);
                                            setTimeRangeMenuOpen(false);
                                            const baseTime =
                                                logs.length > 0
                                                    ? logs[logs.length - 1]
                                                        .timestamp
                                                    : Date.now();
                                            const newTimeRange: {
                                                start: number | null;
                                                end: null;
                                            } =
                                                range === 'all'
                                                    ? { start: null, end: null }
                                                    : {
                                                        start:
                                                              baseTime -
                                                              (range === '200ms'
                                                                  ? 200
                                                                  : range ===
                                                                      '1s'
                                                                      ? 1000
                                                                      : range ===
                                                                        '5s'
                                                                          ? 5000
                                                                          : range ===
                                                                          '10s'
                                                                              ? 10000
                                                                              : range ===
                                                                            '1m'
                                                                                  ? 60000
                                                                                  : 5 *
                                                                            60000),
                                                        end: null
                                                    };
                                            const newFilter = {
                                                ...filter,
                                                timeRange: newTimeRange
                                            };
                                            setFilter(newFilter);
                                            filterLogs(newFilter);
                                        }}
                                        className={`block w-full text-left px-3 py-2 text-xs rounded-none transition-colors first:rounded-t-md ${
                                            currentTimeRange === range &&
                                            !showCustomTimeRange
                                                ? 'bg-orange-600 text-white'
                                                : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        {range === 'all' ? 'All Time' : range}
                                    </button>
                                ))}
                                <div className='border-t border-orange-200 dark:border-orange-700' />
                                <button
                                    onClick={() =>
                                        setShowCustomTimeRange(
                                            !showCustomTimeRange
                                        )
                                    }
                                    className={`block w-full text-left px-3 py-2 text-xs rounded-b-md transition-colors ${
                                        showCustomTimeRange
                                            ? 'bg-orange-100 dark:bg-orange-900 text-gray-900 dark:text-orange-100'
                                            : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {showCustomTimeRange
                                        ? '▼ Custom Range'
                                        : '▶ Custom Range'}
                                </button>
                                {showCustomTimeRange && (
                                    <div className='px-3 py-2 border-t border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30 space-y-2 rounded-b-md'>
                                        <div className='text-xs font-semibold text-gray-700 dark:text-gray-300'>
                                            Start Time (ms ago)
                                        </div>
                                        <input
                                            type='number'
                                            value={customTimeStart || ''}
                                            onChange={(e) =>
                                                setCustomTimeStart(
                                                    e.target.value
                                                        ? parseInt(
                                                            e.target.value
                                                        )
                                                        : null
                                                )
                                            }
                                            placeholder='0'
                                            className='w-full px-2 py-1 text-xs border border-orange-300 dark:border-orange-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white'
                                        />
                                        <div className='text-xs font-semibold text-gray-700 dark:text-gray-300'>
                                            End Time (ms ago, optional)
                                        </div>
                                        <input
                                            type='number'
                                            value={customTimeEnd || ''}
                                            onChange={(e) =>
                                                setCustomTimeEnd(
                                                    e.target.value
                                                        ? parseInt(
                                                            e.target.value
                                                        )
                                                        : null
                                                )
                                            }
                                            placeholder='0 (now)'
                                            className='w-full px-2 py-1 text-xs border border-orange-300 dark:border-orange-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white'
                                        />
                                        <button
                                            onClick={() => {
                                                const baseTime =
                                                    logs.length > 0
                                                        ? logs[logs.length - 1]
                                                            .timestamp
                                                        : Date.now();
                                                const newTimeRange = {
                                                    start: customTimeStart
                                                        ? baseTime -
                                                          customTimeStart
                                                        : null,
                                                    end: customTimeEnd
                                                        ? baseTime -
                                                          customTimeEnd
                                                        : null
                                                };
                                                const newFilter = {
                                                    ...filter,
                                                    timeRange: newTimeRange
                                                };
                                                setFilter(newFilter);
                                                filterLogs(newFilter);
                                                setTimeRangeMenuOpen(false);
                                            }}
                                            className='w-full px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded font-medium transition-colors'
                                        >
                                            Apply Custom Range
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Log count */}
                    <div className='ml-auto text-xs text-gray-600 dark:text-gray-400 font-semibold flex-shrink-0'>
                        {filteredLogs.length}/{logs.length}
                    </div>
                </div>

                {/* Row 2: HTTP Methods Filter - Only show if network logs visible */}
                {filter.logTypes.includes('network') && (
                    <div className='flex flex-wrap items-center gap-1.5'>
                        {HTTP_METHODS.map((method) => (
                            <button
                                key={method}
                                onClick={() => toggleMethod(method)}
                                className={`px-1.5 py-0.5 text-xs rounded transition-colors font-mono flex-shrink-0 ${
                                    selectedMethods.includes(method)
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-600'
                                }`}
                                title='Click to toggle HTTP method'
                            >
                                {method}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Filter Bar */}
            <LogsFilterBar
                onFilterChange={handleFilterChange}
                currentFilter={filter}
            />

            {/* Pinned Logs List */}
            {pinnedLogIds.size > 0 && (
                <div className='bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded p-2'>
                    <div className='text-xs font-semibold text-yellow-900 dark:text-yellow-200 mb-2'>
                        📌 Pinned Logs ({pinnedLogIds.size})
                    </div>
                    <div className='space-y-1 max-h-24 overflow-y-auto'>
                        {Array.from(pinnedLogIds).map((pinnedId) => {
                            const pinnedLog = logs.find(
                                (l) => l.id === pinnedId
                            );
                            if (!pinnedLog) return null;
                            const isInView = filteredLogs.some(
                                (l) => l.id === pinnedId
                            );
                            return (
                                <div
                                    key={pinnedId}
                                    className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${
                                        isInView
                                            ? 'bg-yellow-100 dark:bg-yellow-800/40'
                                            : 'bg-gray-100 dark:bg-gray-700 opacity-60'
                                    }`}
                                >
                                    {editingPinId === pinnedId ? (
                                        <input
                                            autoFocus
                                            type='text'
                                            value={editingName}
                                            onChange={(e) =>
                                                setEditingName(e.target.value)
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter')
                                                    handleSaveRename(pinnedId);
                                                if (e.key === 'Escape')
                                                    handleCancelRename();
                                            }}
                                            onBlur={() =>
                                                handleSaveRename(pinnedId)
                                            }
                                            className='flex-1 px-1 py-0.5 text-xs bg-white dark:bg-slate-700 border border-yellow-400 dark:border-yellow-500 rounded text-gray-900 dark:text-white focus:outline-none'
                                            placeholder={pinnedLog.message}
                                        />
                                    ) : (
                                        <span
                                            onClick={() =>
                                                handleStartRename(
                                                    pinnedId,
                                                    pinnedLogNames.get(
                                                        pinnedId
                                                    ) || pinnedLog.message
                                                )
                                            }
                                            className='flex-1 truncate font-mono text-yellow-900 dark:text-yellow-100 cursor-pointer hover:underline'
                                            title='Click to rename'
                                        >
                                            {pinnedLogNames.get(pinnedId) ||
                                                pinnedLog.message}
                                        </span>
                                    )}
                                    <button
                                        onClick={() =>
                                            handleJumpToPin(pinnedId)
                                        }
                                        disabled={!isInView}
                                        className={`px-1.5 py-0.5 rounded text-xs font-semibold transition-colors flex-shrink-0 ${
                                            isInView
                                                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                                : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                        }`}
                                        title={
                                            isInView
                                                ? 'Jump to pinned log'
                                                : 'Out of view (filters hiding this log)'
                                        }
                                    >
                                        →
                                    </button>
                                    <button
                                        onClick={() => handlePin(pinnedId)}
                                        className='px-1.5 py-0.5 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-semibold transition-colors flex-shrink-0'
                                        title='Unpin'
                                    >
                                        ✕
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Log List */}
            <div
                ref={logContainerRef}
                className='flex-1 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-slate-800'
            >
                {filteredLogs.length > 0 ? (
                    <div>
                        {filteredLogs.map((log) => (
                            <div
                                key={log.id}
                                ref={(el) => {
                                    if (el)
                                        pinnedLogRefMap.current.set(log.id, el);
                                }}
                            >
                                <LogRow
                                    log={log}
                                    onAddToRecording={handleAddToText}
                                    onAddFromHere={handleAddFromHere}
                                    onSelectRangeStart={handleSelectRangeStart}
                                    isRangeStart={rangeStartLogId === log.id}
                                    isPinned={pinnedLogIds.has(log.id)}
                                    onPin={handlePin}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className='flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-sm'>
                        {logs.length === 0
                            ? 'No logs yet. Start logging...'
                            : 'No logs match your filters.'}
                    </div>
                )}
            </div>
        </div>
    );
}
