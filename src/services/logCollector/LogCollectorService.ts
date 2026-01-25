import { LogEntry, LogFilter, Recording, RecordingLogEntry } from './types';
import {
    loadLogs,
    saveLogs,
    clearLogs as clearStoredLogs,
    exportLogsAsJson
} from './logStorage';

// Configurable truncation limits for payload display
const PAYLOAD_TRUNCATE_LENGTH = 500; // Characters to show before truncation

// UUID generator for log entries
function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

type LogListener = (logs: LogEntry[]) => void;
type RecordingListener = (recordings: Recording[]) => void;

/**
 * Singleton service for collecting and managing logs
 * Orchestrates console, network, websocket, and react-query logging
 */
class LogCollectorService {
    private static instance: LogCollectorService;
    private logs: LogEntry[] = [];
    private listeners: Set<LogListener> = new Set();
    private isEnabled = false;
    private isPaused = false;

    // Recording functionality
    private recordings: Map<string, Recording> = new Map();
    private isRecording = false;
    private currentRecordingId: string | null = null;
    private recordingListeners: Set<RecordingListener> = new Set();

    // Check if dev mode
    private isDevMode =
        process.env.REACT_APP_BACKEND_URI?.includes('localhost') ||
        process.env.REACT_APP_BACKEND_URI?.includes('api-dev');

    private constructor() {
        // Load logs from storage on initialization
        if (this.isDevMode) {
            this.logs = loadLogs();
        }
    }

    /**
     * Get singleton instance
     */
    static getInstance(): LogCollectorService {
        if (!LogCollectorService.instance) {
            LogCollectorService.instance = new LogCollectorService();
        }
        return LogCollectorService.instance;
    }

    /**
     * Initialize log collection (set up interceptors)
     * This should be called from DevToolsPanel or App
     */
    init(): void {
        if (!this.isDevMode) return;

        this.isEnabled = true;
        console.log('[LogCollector] Initialized');
    }

    /**
     * Check if logging is enabled
     */
    getEnabled(): boolean {
        return this.isEnabled;
    }

    /**
     * Set enabled state
     */
    setEnabled(enabled: boolean): void {
        this.isEnabled = enabled;
    }

    /**
     * Check if logging is paused
     */
    getPaused(): boolean {
        return this.isPaused;
    }

    /**
     * Toggle pause state
     */
    setPaused(paused: boolean): void {
        this.isPaused = paused;
    }

    /**
     * Add a new log entry
     */
    addLog(logEntry: Omit<LogEntry, 'id' | 'timestamp'>): void {
        if (!this.isEnabled || this.isPaused) return;

        const entry: LogEntry = {
            ...logEntry,
            id: generateId(),
            timestamp: Date.now()
        } as LogEntry;

        this.logs.push(entry);

        // Keep max 1000 logs in memory
        if (this.logs.length > 1000) {
            this.logs = this.logs.slice(-1000);
        }

        // Save to storage and notify listeners
        saveLogs(this.logs);
        this.notifyListeners();
    }

    /**
     * Get all logs
     */
    getLogs(): LogEntry[] {
        return [...this.logs];
    }

    /**
     * Clear all logs
     */
    clearLogs(): void {
        this.logs = [];
        clearStoredLogs();
        this.notifyListeners();
    }

    /**
     * Subscribe to log changes
     * Returns unsubscribe function
     */
    subscribe(callback: LogListener): () => void {
        this.listeners.add(callback);

        return () => {
            this.listeners.delete(callback);
        };
    }

    /**
     * Notify all listeners of log changes
     */
    private notifyListeners(): void {
        const logs = this.getLogs();
        this.listeners.forEach((callback) => {
            try {
                callback(logs);
            }
            catch (e) {
                console.error('[LogCollector] Error notifying listener:', e);
            }
        });
    }

    /**
     * Filter logs based on criteria
     */
    filterLogs(filter: LogFilter): LogEntry[] {
        let filtered = this.logs;

        // Filter by log type
        if (filter.logTypes.length > 0) {
            filtered = filtered.filter((log) =>
                filter.logTypes.includes(log.type)
            );
        }

        // Filter by log level (for console logs) and error status (for network logs)
        if (filter.logLevels.length > 0) {
            filtered = filtered.filter((log) => {
                if (log.type === 'console') {
                    return filter.logLevels.includes(log.level);
                }
                // For network logs with 'error' level filter, show only 4xx/5xx status codes
                if (
                    log.type === 'network' &&
                    filter.logLevels.includes('error')
                ) {
                    const networkLog = log as any;
                    return networkLog.status && networkLog.status >= 400;
                }
                return true;
            });
        }

        // Filter by HTTP method (for network logs)
        if (filter.httpMethods.length > 0) {
            filtered = filtered.filter((log) => {
                if (log.type === 'network') {
                    return filter.httpMethods.includes(log.method);
                }
                return true;
            });
        }

        // Filter by search text
        if (filter.searchText.trim().length > 0) {
            const searchLower = filter.searchText.toLowerCase();
            filtered = filtered.filter((log) => {
                const searchableText =
                    this.getSearchableText(log).toLowerCase();
                return searchableText.includes(searchLower);
            });
        }

        // Filter by time range
        if (filter.timeRange.start !== null) {
            const startTime = filter.timeRange.start;
            filtered = filtered.filter((log) => log.timestamp >= startTime);
        }
        if (filter.timeRange.end !== null) {
            const endTime = filter.timeRange.end;
            filtered = filtered.filter((log) => log.timestamp <= endTime);
        }

        return filtered;
    }

    /**
     * Get searchable text from log entry
     */
    private getSearchableText(log: LogEntry): string {
        switch (log.type) {
        case 'console':
            return `${log.message} ${JSON.stringify((log as any).args)}`;
        case 'network': {
            const networkLog = log as any;
            return `${networkLog.method} ${networkLog.url} ${networkLog.status || ''} ${networkLog.message}`;
        }
        case 'websocket': {
            const wsLog = log as any;
            return `${wsLog.direction} ${wsLog.event} ${wsLog.message}`;
        }
        case 'react-query': {
            const queryLog = log as any;
            return `${queryLog.operation} ${queryLog.queryKey} ${queryLog.message}`;
        }
        default:
            return (log as any).message || 'Unknown log';
        }
    }

    /**
     * Export logs as JSON string
     */
    exportLogs(): string {
        return exportLogsAsJson(this.logs);
    }

    /**
     * Get log statistics
     */
    getStatistics() {
        const stats = {
            total: this.logs.length,
            console: 0,
            network: 0,
            websocket: 0,
            reactQuery: 0,
            errors: 0,
            warnings: 0
        };

        this.logs.forEach((log) => {
            switch (log.type) {
            case 'console':
                stats.console++;
                if ((log as any).level === 'error') stats.errors++;
                if ((log as any).level === 'warn') stats.warnings++;
                break;
            case 'network':
                stats.network++;
                if ((log as any).status && (log as any).status >= 400)
                    stats.errors++;
                break;
            case 'websocket':
                stats.websocket++;
                break;
            case 'react-query':
                stats.reactQuery++;
                if ((log as any).status === 'error') stats.errors++;
                break;
            }
        });

        return stats;
    }

    // ===== RECORDING FUNCTIONALITY =====

    /**
     * Start a new recording session
     */
    startRecording(name?: string): string {
        const recordingId = generateId();
        const recording: Recording = {
            id: recordingId,
            name: name || `Recording ${new Date().toLocaleTimeString()}`,
            createdAt: Date.now(),
            logs: []
        };

        this.recordings.set(recordingId, recording);
        this.isRecording = true;
        this.currentRecordingId = recordingId;
        this.notifyRecordingListeners();

        return recordingId;
    }

    /**
     * Stop the current recording session
     */
    stopRecording(): void {
        this.isRecording = false;
        this.currentRecordingId = null;
        this.notifyRecordingListeners();
    }

    /**
     * Check if currently recording
     */
    getIsRecording(): boolean {
        return this.isRecording;
    }

    /**
     * Add a log entry to a specific recording with context
     */
    addLogToRecording(recordingId: string, logId: string): void {
        const log = this.logs.find((l) => l.id === logId);
        if (!log) return;

        const recording = this.recordings.get(recordingId);
        if (!recording) return;

        const context = this.generateLogContext(log);
        const recordingEntry: RecordingLogEntry = {
            log,
            addedAt: Date.now(),
            context
        };

        recording.logs.push(recordingEntry);
        this.notifyRecordingListeners();
    }

    /**
     * Remove a log entry from a recording by index
     */
    removeLogFromRecording(recordingId: string, logIndex: number): void {
        const recording = this.recordings.get(recordingId);
        if (!recording) return;

        if (logIndex < 0 || logIndex >= recording.logs.length) return;

        recording.logs.splice(logIndex, 1);
        this.notifyRecordingListeners();
    }

    /**
     * Generate human-readable context for a log
     */
    private generateLogContext(log: LogEntry): string {
        const time = new Date(log.timestamp).toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3
        });

        switch (log.type) {
        case 'console': {
            const level = (log as any).level?.toUpperCase() || 'LOG';
            return `[${time}] Console ${level}: ${log.message}`;
        }
        case 'network': {
            const networkLog = log as any;
            const status = networkLog.status || '?';
            return `[${time}] ${networkLog.method} ${networkLog.url} → ${status}`;
        }
        case 'websocket': {
            const wsLog = log as any;
            const direction = wsLog.direction === 'sent' ? '→' : '←';
            return `[${time}] WebSocket ${direction} ${wsLog.event}`;
        }
        case 'react-query': {
            const queryLog = log as any;
            return `[${time}] React Query ${queryLog.operation}: ${queryLog.queryKey} (${queryLog.status})`;
        }
        default:
            return `[${time}] ${(log as any).message || 'Unknown log'}`;
        }
    }

    /**
     * Get all recordings
     */
    getRecordings(): Recording[] {
        return Array.from(this.recordings.values());
    }

    /**
     * Get a specific recording by ID
     */
    getRecording(recordingId: string): Recording | null {
        return this.recordings.get(recordingId) || null;
    }

    /**
     * Delete a recording
     */
    deleteRecording(recordingId: string): void {
        if (this.currentRecordingId === recordingId) {
            this.stopRecording();
        }
        this.recordings.delete(recordingId);
        this.notifyRecordingListeners();
    }

    /**
     * Export a recording as formatted text
     */
    exportRecordingAsText(recordingId: string): string {
        const recording = this.recordings.get(recordingId);
        if (!recording) return '';

        const lines: string[] = [
            `Recording: ${recording.name}`,
            `Created: ${new Date(recording.createdAt).toLocaleString()}`,
            `Logs: ${recording.logs.length}`,
            '─'.repeat(80),
            ''
        ];

        recording.logs.forEach((entry, index) => {
            lines.push(`${index + 1}. ${entry.context}`);
            lines.push(
                `   Added: ${new Date(entry.addedAt).toLocaleTimeString()}`
            );

            // Add relevant details based on log type
            const log = entry.log;
            switch (log.type) {
            case 'network': {
                const networkLog = log as any;
                if (networkLog.requestBody) {
                    const reqBody = JSON.stringify(networkLog.requestBody);
                    const truncated =
                            reqBody.length > PAYLOAD_TRUNCATE_LENGTH
                                ? reqBody.substring(
                                    0,
                                    PAYLOAD_TRUNCATE_LENGTH
                                ) + '...'
                                : reqBody;
                    lines.push(`   Request: ${truncated}`);
                }
                if (networkLog.responseBody) {
                    const resBody = JSON.stringify(networkLog.responseBody);
                    const truncated =
                            resBody.length > PAYLOAD_TRUNCATE_LENGTH
                                ? resBody.substring(
                                    0,
                                    PAYLOAD_TRUNCATE_LENGTH
                                ) + '...'
                                : resBody;
                    lines.push(`   Response: ${truncated}`);
                }
                break;
            }
            case 'console': {
                const consoleLog = log as any;
                if (consoleLog.args && consoleLog.args.length > 0) {
                    const argsStr = JSON.stringify(consoleLog.args);
                    lines.push(
                        `   Args: ${argsStr.substring(0, PAYLOAD_TRUNCATE_LENGTH)}`
                    );
                }
                break;
            }
            case 'websocket': {
                const wsLog = log as any;
                if (wsLog.payload) {
                    const payloadStr = JSON.stringify(wsLog.payload);
                    lines.push(
                        `   Payload: ${payloadStr.substring(0, PAYLOAD_TRUNCATE_LENGTH)}`
                    );
                }
                break;
            }
            }

            lines.push('');
        });

        return lines.join('\n');
    }

    /**
     * Export a recording as JSON
     */
    exportRecordingAsJson(recordingId: string): string {
        const recording = this.recordings.get(recordingId);
        if (!recording) return '';

        return JSON.stringify(recording, null, 2);
    }

    /**
     * Subscribe to recording changes
     */
    subscribeToRecordings(callback: RecordingListener): () => void {
        this.recordingListeners.add(callback);

        return () => {
            this.recordingListeners.delete(callback);
        };
    }

    /**
     * Notify all recording listeners
     */
    private notifyRecordingListeners(): void {
        const recordings = this.getRecordings();
        this.recordingListeners.forEach((callback) => {
            try {
                callback(recordings);
            }
            catch (e) {
                console.error(
                    '[LogCollector] Error notifying recording listener:',
                    e
                );
            }
        });
    }
}

export default LogCollectorService;
