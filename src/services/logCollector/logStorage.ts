import { LogEntry, LogStorageData } from './types';

const STORAGE_KEY = 'kudos-dev-logs';
const MAX_LOGS = 1000;
const DEBOUNCE_DELAY = 500;

let debounceTimer: NodeJS.Timeout | null = null;

/**
 * Safe JSON serializer that handles circular references and special types
 */
function safeStringify(obj: any, depth = 0): string {
    const maxDepth = 3;
    const seen = new WeakSet();

    const replacer = (key: string, value: any) => {
        // Handle circular references
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
                return '[Circular]';
            }
            seen.add(value);
        }

        // Limit depth to prevent massive payloads
        if (depth > maxDepth) {
            return '[Object]';
        }

        // Handle special types
        if (value instanceof Error) {
            return {
                message: value.message,
                stack: value.stack,
            };
        }

        if (value instanceof Date) {
            return value.toISOString();
        }

        if (typeof value === 'function') {
            return '[Function]';
        }

        if (value && typeof value === 'object') {
            if (value.constructor && value.constructor.name !== 'Object' && value.constructor.name !== 'Array') {
                return `[${value.constructor.name}]`;
            }
        }

        return value;
    };

    try {
        return JSON.stringify(obj, replacer);
    }
    catch (e) {
        return JSON.stringify({ error: 'Failed to serialize' });
    }
}

/**
 * Safe JSON parser that handles parsing errors
 */
function safeParse<T>(json: string, defaultValue: T): T {
    try {
        return JSON.parse(json);
    }
    catch (e) {
        console.error('[LogStorage] Failed to parse stored logs:', e);
        return defaultValue;
    }
}

/**
 * Load logs from localStorage
 */
export function loadLogs(): LogEntry[] {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return [];

        const parsed: LogStorageData = safeParse(data, {
            logs: [],
            maxSize: MAX_LOGS,
            currentSize: 0,
            lastCleanup: Date.now(),
        });
        return parsed.logs || [];
    }
    catch (e) {
        console.error('[LogStorage] Failed to load logs:', e);
        return [];
    }
}

/**
 * Save logs to localStorage with debouncing
 */
export function saveLogs(logs: LogEntry[]): void {
    // Clear existing debounce timer
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }

    // Set new debounce timer
    debounceTimer = setTimeout(() => {
        try {
            // Trim logs if exceeds max size
            const trimmedLogs = logs.length > MAX_LOGS ? logs.slice(-MAX_LOGS) : logs;

            const storageData: LogStorageData = {
                logs: trimmedLogs,
                maxSize: MAX_LOGS,
                currentSize: trimmedLogs.length,
                lastCleanup: Date.now(),
            };

            const serialized = safeStringify(storageData);
            localStorage.setItem(STORAGE_KEY, serialized);
        }
        catch (e) {
            if (e instanceof Error && e.name === 'QuotaExceededError') {
                // localStorage is full, clear oldest logs
                console.warn('[LogStorage] localStorage quota exceeded, clearing oldest logs');
                const trimmedLogs = logs.slice(-500);
                const storageData: LogStorageData = {
                    logs: trimmedLogs,
                    maxSize: MAX_LOGS,
                    currentSize: trimmedLogs.length,
                    lastCleanup: Date.now(),
                };
                try {
                    localStorage.setItem(STORAGE_KEY, safeStringify(storageData));
                }
                catch (innerE) {
                    console.error('[LogStorage] Failed to save logs even after cleanup:', innerE);
                }
            }
            else {
                console.error('[LogStorage] Failed to save logs:', e);
            }
        }

        debounceTimer = null;
    }, DEBOUNCE_DELAY);
}

/**
 * Clear all logs from localStorage
 */
export function clearLogs(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    }
    catch (e) {
        console.error('[LogStorage] Failed to clear logs:', e);
    }
}

/**
 * Get size estimate of stored logs in bytes
 */
export function getStorageSizeEstimate(): number {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return 0;
        return new Blob([data]).size;
    }
    catch (e) {
        return 0;
    }
}

/**
 * Get current log count from storage
 */
export function getLogCount(): number {
    try {
        const logs = loadLogs();
        return logs.length;
    }
    catch (e) {
        return 0;
    }
}

/**
 * Export logs as JSON string
 */
export function exportLogsAsJson(logs: LogEntry[]): string {
    return safeStringify(logs, 0);
}
