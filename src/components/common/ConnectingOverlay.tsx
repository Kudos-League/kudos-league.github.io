import React, { useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import Spinner from '@/components/common/Spinner';

export default function ConnectingOverlay() {
    const { isConnecting, connectingText, snoozeConnectingOverlay } =
        useWebSocketContext();

    const onBackdropClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (e.target === e.currentTarget) {
                snoozeConnectingOverlay();
            }
        },
        [snoozeConnectingOverlay]
    );

    if (!isConnecting) return null;

    const overlay = (
        <div
            onClick={onBackdropClick}
            className='fixed inset-0 z-[1000] bg-black/60 flex items-center justify-center'
            role='dialog'
            aria-modal='true'
            aria-label='Connecting'
        >
            <div className='rounded-2xl bg-white dark:bg-neutral-900 shadow-xl p-6 min-w-[260px]'>
                <Spinner text={connectingText ?? 'Connecting...'} />
                <p className='mt-3 text-sm text-neutral-600 dark:text-neutral-300'>
                    Click outside to hide. I’ll keep trying in the background.
                </p>
            </div>
        </div>
    );

    return createPortal(overlay, document.body);
}
