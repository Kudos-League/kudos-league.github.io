import React, { useEffect, useState } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { FormProvider, useForm } from 'react-hook-form';
import DonationAmountPicker from './DonationAmountPicker';
import { getEndpointUrl } from 'shared/api/config';
import { useAuth } from '@/contexts/useAuth';
import Button from '../common/Button';

export default function StripeWeb() {
    const { token } = useAuth();
    const [stripe, setStripe] = useState<Stripe | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [donationAmount, setDonationAmount] = useState(500);
    const [interval, setInterval] = useState<string | undefined>(undefined);

    const formMethods = useForm();

    const fetchPublishableKey = async () => {
        try {
            const response = await fetch(
                `${getEndpointUrl()}/stripe/publishable-key`
            );
            if (!response.ok) throw new Error(`Error: ${response.status}`);
            const { publishableKey } = await response.json();
            return publishableKey;
        }
        catch (err) {
            console.error('Failed to fetch Stripe publishable key:', err);
            setError('Failed to load Stripe publishable key.');
        }
    };

    useEffect(() => {
        const initializeStripe = async () => {
            try {
                const publishableKey = await fetchPublishableKey();
                if (!publishableKey) return;
                const stripeInstance = await loadStripe(publishableKey);
                setStripe(stripeInstance);
                setLoading(true);
            }
            catch (e) {
                console.error('Stripe initialization error:', e);
                setError('Failed to initialize Stripe.');
            }
        };
        initializeStripe();
    }, []);

    const handlePayment = async () => {
        if (!stripe) return;

        const response = await fetch(
            `${getEndpointUrl()}/stripe/checkout-session`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ amount: donationAmount, interval })
            }
        );

        const session = await response.json();
        const { error } = await stripe.redirectToCheckout({
            sessionId: session.id
        });
        if (error) console.warn('Stripe checkout error:', error);
    };

    return (
        <FormProvider {...formMethods}>
            <div className='flex flex-col items-center justify-center min-h-screen gap-6 px-4 pb-40'>
                {error && <p className='text-red-500'>{error}</p>}
                <h1 className='text-2xl font-semibold'>
                    Support Us with a Donation
                </h1>
                <DonationAmountPicker onAmountChange={setDonationAmount} />
                <div className='w-full max-w-xs'>
                    <label className='block text-sm font-semibold'>
                        Donation Type:
                    </label>
                    <select
                        className='w-full border rounded p-2'
                        value={interval ?? ''}
                        onChange={(e) => setInterval(e.target.value || undefined)}
                    >
                        <option value=''>One-time</option>
                        <option value='week'>Weekly</option>
                        <option value='month'>Monthly</option>
                    </select>
                </div>
                <Button onClick={handlePayment} disabled={!loading}>
                    Donate
                </Button>
            </div>
        </FormProvider>
    );
}
