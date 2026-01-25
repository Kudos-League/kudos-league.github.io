// Log level enumeration
export type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

// Log type enumeration
export type LogType =
    | 'all'
    | 'console'
    | 'network'
    | 'websocket'
    | 'react-query';

// HTTP method enumeration
export type HttpMethod =
    | 'all'
    | 'GET'
    | 'POST'
    | 'PUT'
    | 'PATCH'
    | 'DELETE'
    | 'OPTIONS'
    | 'HEAD';

// Base log entry interface - all logs inherit from this
export interface BaseLogEntry {
    id: string; // UUID for unique identification
    timestamp: number; // Unix timestamp in milliseconds
    type: LogType;
    message: string; // Human-readable message
}

// Console log entry
export interface ConsoleLogEntry extends BaseLogEntry {
    type: 'console';
    level: LogLevel;
    args: any[]; // Original console arguments (serialized)
    stack?: string; // Stack trace for errors
}

// Network request/response log entry
export interface NetworkLogEntry extends BaseLogEntry {
    type: 'network';
    method: HttpMethod;
    url: string;
    status?: number; // HTTP status code
    statusText?: string;
    duration?: number; // Request duration in ms
    requestHeaders?: Record<string, string>;
    requestBody?: any;
    responseHeaders?: Record<string, string>;
    responseBody?: any;
    error?: string; // Error message if request failed
}

// WebSocket message log entry
export interface WebSocketLogEntry extends BaseLogEntry {
    type: 'websocket';
    direction: 'sent' | 'received';
    event: string; // Event name (e.g., 'MESSAGE_CREATE')
    payload?: any; // Message payload
    socketId?: string; // Socket connection ID
}

// React Query operation log entry
export interface ReactQueryLogEntry extends BaseLogEntry {
    type: 'react-query';
    operation: 'query' | 'mutation' | 'invalidation';
    queryKey?: string; // Query key as string
    status?: 'loading' | 'error' | 'success';
    error?: string;
    data?: any; // Result data (sanitized)
}

// Discriminated union of all log entry types
export type LogEntry =
    | ConsoleLogEntry
    | NetworkLogEntry
    | WebSocketLogEntry
    | ReactQueryLogEntry;

// Filter configuration for searching logs
export interface LogFilter {
    logTypes: LogType[];
    logLevels: LogLevel[];
    httpMethods: HttpMethod[];
    searchText: string;
    timeRange: {
        start: number | null;
        end: number | null;
    };
}

// Storage schema for localStorage
export interface LogStorageData {
    logs: LogEntry[];
    maxSize: number;
    currentSize: number;
    lastCleanup: number;
}

// Recording log entry with context
export interface RecordingLogEntry {
    log: LogEntry;
    addedAt: number; // Timestamp when added to recording
    context: string; // Human-readable context about the log
}

// Recording metadata
export interface Recording {
    id: string;
    name: string;
    createdAt: number;
    logs: RecordingLogEntry[];
    description?: string;
}
