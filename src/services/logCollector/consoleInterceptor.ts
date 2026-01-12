import LogCollectorService from './LogCollectorService';
import type { LogLevel } from './types';

// Store original console methods
const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug
};

/**
 * Serialize arguments safely for logging
 */
function serializeArgs(args: any[]): any[] {
    return args.map((arg) => {
        try {
            // Handle DOM elements
            if (arg instanceof Element) {
                return `[Element: ${arg.tagName}]`;
            }

            // Handle special types
            if (arg instanceof Error) {
                return {
                    message: arg.message,
                    stack: arg.stack
                };
            }

            if (arg instanceof Date) {
                return arg.toISOString();
            }

            if (typeof arg === 'function') {
                return `[Function: ${arg.name || 'anonymous'}]`;
            }

            if (typeof arg === 'object' && arg !== null) {
                // Try to serialize objects
                if (JSON.stringify(arg).length > 5000) {
                    return '[Object: too large]';
                }
                return arg;
            }

            return arg;
        }
        catch (e) {
            return `[Serialization Error: ${String(arg)}]`;
        }
    });
}

/**
 * Get stack trace for error logging
 */
function getStackTrace(): string {
    try {
        const stack = new Error().stack || '';
        // Remove the first few frames which are from our logging code
        const lines = stack.split('\n').slice(4);
        return lines.join('\n');
    }
    catch {
        return '';
    }
}

/**
 * Create message from console arguments
 */
function createMessage(args: any[]): string {
    return args
        .map((arg) => {
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg);
                }
                catch {
                    return String(arg);
                }
            }
            return String(arg);
        })
        .join(' ');
}

/**
 * Override a console method
 */
function overrideConsoleMethod(
    method: LogLevel,
    originalMethod: (...args: any[]) => void
): void {
    (console as any)[method] = function (...args: any[]) {
        // Call original console method first
        originalMethod.apply(console, args);

        // Log to collector service if enabled
        try {
            const service = LogCollectorService.getInstance();
            if (service.getEnabled()) {
                const message = createMessage(args);
                const serialized = serializeArgs(args);
                const stack = method === 'error' ? getStackTrace() : undefined;

                service.addLog({
                    type: 'console',
                    level: method,
                    message,
                    args: serialized,
                    stack
                } as any);
            }
        }
        catch (e) {
            // Silently fail to avoid infinite loops
            originalMethod.apply(console, ['[LogCollector Error]', e]);
        }
    };
}

/**
 * Initialize console interceptor
 * Should be called once when LogCollectorService is initialized
 */
export function initConsoleInterceptor(): void {
    const isDevMode =
        process.env.REACT_APP_BACKEND_URI?.includes('localhost') ||
        process.env.REACT_APP_BACKEND_URI?.includes('api-dev');

    if (!isDevMode) return;

    try {
        overrideConsoleMethod('log', originalConsole.log);
        overrideConsoleMethod('info', originalConsole.info);
        overrideConsoleMethod('warn', originalConsole.warn);
        overrideConsoleMethod('error', originalConsole.error);
        overrideConsoleMethod('debug', originalConsole.debug);

        originalConsole.log('[LogCollector] Console interceptor initialized');
    }
    catch (e) {
        originalConsole.error(
            '[LogCollector] Failed to initialize console interceptor:',
            e
        );
    }
}

/**
 * Restore original console methods
 */
export function restoreConsole(): void {
    try {
        console.log = originalConsole.log;
        console.info = originalConsole.info;
        console.warn = originalConsole.warn;
        console.error = originalConsole.error;
        console.debug = originalConsole.debug;

        originalConsole.log('[LogCollector] Console restored');
    }
    catch (e) {
        originalConsole.error('[LogCollector] Failed to restore console:', e);
    }
}
