'use client';

import React, { useEffect, useState } from 'react';
import Alert from '@/components/common/Alert';
import { subscribeAlerts, subscribeAlertClears, type AlertMsg } from './alertBus';

export default function AlertHost() {
    const [queue, setQueue] = useState<Array<AlertMsg & { id: number }>>([]);

    useEffect(() => {
        console.log('[AlertHost] Mounting and subscribing to alerts');
        let id = 0;
        const unsubscribeAlerts = subscribeAlerts((msg) => {
            console.log('[AlertHost] Received alert:', msg);
            const next = { ...msg, id: ++id };
            setQueue((q) => {
                console.log('[AlertHost] Adding to queue, current queue size:', q.length);
                return [...q, next];
            });
            setTimeout(() => {
                setQueue((q) => q.filter((i) => i.id !== next.id));
            }, 4000);
        });
        const unsubscribeClears = subscribeAlertClears(() => {
            setQueue([]);
            id = 0;
        });

        return () => {
            console.log('[AlertHost] Unmounting and unsubscribing');
            unsubscribeAlerts();
            unsubscribeClears();
        };
    }, []);

    console.log('[AlertHost] Rendering, queue length:', queue.length);

    if (queue.length === 0) return null;

    return (
        <div className='fixed top-4 right-4 z-[9999] space-y-2'>
            {queue.map((item) => (
                <Alert
                    key={item.id}
                    type={item.type}
                    message={item.message}
                    show
                    closable
                    onClose={() =>
                        setQueue((q) => q.filter((i) => i.id !== item.id))
                    }
                />
            ))}
        </div>
    );
}
