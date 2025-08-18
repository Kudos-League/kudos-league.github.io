import React, { useEffect, useState } from 'react';
import Alert from './Alert';
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

    if (!visible || !latest) return null;

    const go = () => {
        if (latest.type === 'direct-message') {
            navigate(`/dm/${latest.message?.author?.id ?? ''}`);
        }
        else if (latest.type === 'post-reply') {
            navigate(`/posts/${latest.postID}`);
        }
        setVisible(false);
    };

    return (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
            <div onClick={go} className="cursor-pointer">
                <Alert
                    type="info"
                    message={
                        latest.type === 'direct-message'
                            ? `New DM: ${latest.message?.content ?? ''}`
                            : `Reply: ${latest.message?.content ?? ''}`
                    }
                />
            </div>
        </div>
    );
}