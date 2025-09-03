import React from 'react';
import { createPortal } from 'react-dom';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import Spinner from '@/components/common/Spinner';

export default function ConnectingOverlay() {
    const { isConnecting, connectingText, snoozeConnectingOverlay } = useWebSocketContext();

    if (!isConnecting) return null;

    const toast = (
        <div className="fixed inset-0 z-[1000] pointer-events-none">
            <div
                className="pointer-events-auto fixed top-4 right-4 sm:top-6 sm:right-6 max-w-xs"
                role="status"
                aria-live="polite"
                aria-atomic="true"
            >
                <div className="flex items-start gap-3 rounded-xl bg-white dark:bg-neutral-900 shadow-lg ring-1 ring-black/10 dark:ring-white/10 p-4">
                    <div className="shrink-0 mt-0.5">
                        <Spinner text={null} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {connectingText ?? 'Connecting…'}
                        </p>
                        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">
                            Attempting to connect to the websocket server...
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={snoozeConnectingOverlay}
                        className="ml-auto -mr-1 rounded-md p-1 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                        aria-label="Dismiss connection notice"
                        title="Dismiss"
                    >
                        <span aria-hidden="true" className="block text-lg leading-none">&times;</span>
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(toast, document.body);
}