import React, { useEffect, useState } from 'react';
import Alert from '@/components/common/Alert';
import { useNotifications } from '@/contexts/NotificationsContext';
import { NotificationPayload } from '@/shared/api/types';
import { useNavigate } from 'react-router-dom';

export default function NotificationsToast() {
    const { state } = useNotifications();
    const [latest, setLatest] = useState<NotificationPayload | null>(null);
    const [visible, setVisible] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (state.items.length > 0) {
            const newest = state.items[0];
            setLatest(newest);
            setVisible(true);

            const timer = setTimeout(() => setVisible(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [state.items]);

    if (!latest) return null;

    const go = () => {
        if (latest.type === 'direct-message') {
            navigate(`/dm/${latest.message?.author?.id ?? ''}`);
        }
        else if (latest.type === 'post-reply') {
            navigate(`/posts/${latest.postID}`);
        }
        setVisible(false);
    };

    const { type, message } = (() => {
        if (latest.type === 'direct-message') {
            return { type: 'info' as const, message: `New DM: ${latest.message?.content ?? ''}` };
        }
        return { type: 'info' as const, message: `Reply: ${latest.message?.content ?? ''}` };
    })();

    return (
        <div
            aria-live="assertive"
            className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center px-4 py-6 sm:items-start sm:p-6"
        >
            <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
                <Alert
                    type={type}
                    title={type === 'info' ? 'Notification' : undefined}
                    message={message}
                    show={visible}
                    onClose={() => setVisible(false)}
                    onClick={go}
                    onAfterLeave={() => setLatest(null)}
                />
            </div>
        </div>
    );
}