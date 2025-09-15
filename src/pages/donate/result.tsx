import React, { useEffect, useState } from 'react';
import { apiGet } from '@/shared/api/apiClient';
import Spinner from '../../components/common/Spinner';

export default function DonateResult() {
    const [status, setStatus] = useState<'processing' | 'succeeded' | 'failed' | 'unknown'>('processing');
    const [message, setMessage] = useState<string | undefined>(undefined);
    const [donation, setDonation] = useState<{ amount?: number; interval?: string; kudos?: number } | null>(null);
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
                const body = await apiGet<any>('/stripe/session-status', { params: { session_id: sessionId } });
                if (!mounted) return;
                setStatus(body.status ?? 'unknown');
                setMessage(body.message);
                if (body.amount) {
                    setDonation({ amount: body.amount, interval: body.interval, kudos: body.kudos });
                }
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
            {status === 'processing' && <Spinner text='Processing your payment...' />}
            {status === 'succeeded' && (
                <div>
                    <p>Thank you! Your donation was processed successfully.</p>
                    {donation && (
                        <div className="mt-4">
                            <p>Amount: ${(donation.amount ?? 0) / 100}</p>
                            {donation.interval && <p>Recurring: {donation.interval}</p>}
                            {donation.kudos !== undefined && <p>Kudos awarded: {donation.kudos}</p>}
                        </div>
                    )}
                </div>
            )}
            {status === 'failed' && <p className="text-red-600">Payment failed: {message || 'Unknown error'}</p>}
            {status === 'unknown' && <p className="text-yellow-600">Status unknown: {message || 'No details available'}</p>}
        </div>
    );
}
