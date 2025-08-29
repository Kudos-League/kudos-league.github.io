'use client';

import React, { useEffect, useState } from 'react';
import Alert from '@/components/common/Alert';
import { subscribeAlerts, type AlertMsg } from './alertBus';

export default function AlertHost() {
    const [queue, setQueue] = useState<Array<AlertMsg & { id: number }>>([]);

    useEffect(() => {
        let id = 0;
        return subscribeAlerts((msg) => {
            const next = { ...msg, id: ++id };
            setQueue((q) => [...q, next]);
            setTimeout(() => {
                setQueue((q) => q.filter((i) => i.id !== next.id));
            }, 4000);
        });
    }, []);

    if (queue.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[9999] space-y-2">
            {queue.map((item) => (
                <Alert
                    key={item.id}
                    type={item.type}
                    message={item.message}
                    show
                    closable
                    onClose={() => setQueue((q) => q.filter((i) => i.id !== item.id))}
                />
            ))}
        </div>
    );
}