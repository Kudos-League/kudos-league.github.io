import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '@/shared/api/apiClient';
import Spinner from '../../components/common/Spinner';
import { useAuth } from '@/contexts/useAuth';
import { routes } from '@/routes';

export default function DonateResult() {
    const [status, setStatus] = useState<'processing' | 'succeeded' | 'failed' | 'unknown'>('processing');
    const [message, setMessage] = useState<string | undefined>(undefined);
    const [donation, setDonation] = useState<{ amount?: number; interval?: string; kudos?: number } | null>(null);
    const [attempts, setAttempts] = useState(0);
    const { isLoggedIn } = useAuth();

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
                    {!isLoggedIn && (
                        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-100">
                            <p>Kudos and donation history are only tracked for logged-in supporters.</p>
                            <p className="mt-1">
                                <Link to={routes.login} className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200">
                                    Log in
                                </Link>{' '}
                                before your next donation to link your support to your account.
                            </p>
                        </div>
                    )}
                </div>
            )}
            {status === 'failed' && <p className="text-red-600">Payment failed: {message || 'Unknown error'}</p>}
            {status === 'unknown' && <p className="text-yellow-600">Status unknown: {message || 'No details available'}</p>}
        </div>
    );
}
