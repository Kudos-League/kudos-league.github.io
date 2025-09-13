import React, { useEffect, useState } from 'react';
import { getEndpointUrl } from 'shared/api/config';

export default function DonateResult() {
    const [status, setStatus] = useState<'processing' | 'succeeded' | 'failed' | 'unknown'>('processing');
    const [message, setMessage] = useState<string | undefined>(undefined);
    const [attempts, setAttempts] = useState(0);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get('session_id');
        if (!sessionId) {
            setStatus('unknown');
            setMessage('Missing session id');
            return;
        }

        let mounted = true;
        const maxAttempts = 30;
        const intervalMs = 2000;

        const fetchStatus = async () => {
            try {
                const res = await fetch(`${getEndpointUrl()}/stripe/session-status?session_id=${encodeURIComponent(sessionId)}`);
                if (!res.ok) throw new Error(`Status fetch failed: ${res.status}`);
                const body = await res.json();
                if (!mounted) return;
                setStatus(body.status ?? 'unknown');
                setMessage(body.message);
                setAttempts((a) => a + 1);

                if ((body.status === 'processing' || !body.status) && attempts < maxAttempts) {
                    setTimeout(() => {
                        if (mounted) fetchStatus();
                    }, intervalMs);
                }
            }
            catch (e: any) {
                if (!mounted) return;
                setStatus('unknown');
                setMessage(e.message);
            }
        };

        fetchStatus();

        return () => {
            mounted = false;
        };
    }, []);

    return (
        <div className="p-6 max-w-xl mx-auto">
            <h1 className="text-2xl font-semibold mb-4">Donation Result</h1>
            {status === 'processing' && <p>Your payment is being processed. This may take a moment.</p>}
            {status === 'succeeded' && <p>Thank you! Your donation was processed successfully.</p>}
            {status === 'failed' && <p className="text-red-600">Payment failed: {message || 'Unknown error'}</p>}
            {status === 'unknown' && <p className="text-yellow-600">Status unknown: {message || 'No details available'}</p>}
        </div>
    );
}
