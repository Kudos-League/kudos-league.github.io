'use client';
import React from 'react';
import { useEffect, useState } from 'react';
import Alert from '@/components/common/Alert';
import {
    subscribeAlerts,
    subscribeAlertClears,
    type AlertMsg
} from './alertBus';

export default function AlertHost() {
    const [queue, setQueue] = useState<Array<AlertMsg & { id: number }>>([]);

    useEffect(() => {
        let id = 0;
        const unsubscribeAlerts = subscribeAlerts((msg) => {
            const next = { ...msg, id: ++id };
            setQueue((q) => [...q, next]);
            setTimeout(() => {
                setQueue((q) => q.filter((i) => i.id !== next.id));
            }, 4000);
        });
        const unsubscribeClears = subscribeAlertClears(() => {
            setQueue([]);
            id = 0;
        });

        return () => {
            unsubscribeAlerts();
            unsubscribeClears();
        };
    }, []);

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
