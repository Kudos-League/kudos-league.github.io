import React, { useEffect, useState } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { useForm } from 'react-hook-form';
import DonationAmountPicker from './DonationAmountPicker';
import { apiMutate, apiGet } from '@/shared/api/apiClient';
import Button from '../common/Button';
import Form from '@/components/forms/Form';
import FormField from '@/components/forms/FormField';

type FormValues = {
    donationAmount: string;
    customDonationAmount?: string;
    interval?: string;
};

export default function StripeWeb() {
    const [stripe, setStripe] = useState<Stripe | null>(null);
    const [stripeReady, setStripeReady] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const formMethods = useForm<FormValues>({
        mode: 'onBlur',
        defaultValues: { donationAmount: '', customDonationAmount: '', interval: '' }
    });

    const fetchPublishableKey = async () => {
        try {
            const body = await apiGet<{ publishableKey: string }>('/stripe/publishable-key');
            return body.publishableKey;
        }
        catch (err) {
            console.error('Failed to fetch Stripe publishable key:', err);
            setError('Failed to load Stripe publishable key.');
            return undefined;
        }
    };

    useEffect(() => {
        let mounted = true;
        const initializeStripe = async () => {
            try {
                const publishableKey = await fetchPublishableKey();
                if (!publishableKey) return;
                const stripeInstance = await loadStripe(publishableKey);
                if (!mounted) return;
                setStripe(stripeInstance);
                setStripeReady(true);
            }
            catch (e) {
                console.error('Stripe initialization error:', e);
                setError('Failed to initialize Stripe.');
            }
        };
        initializeStripe();
        return () => {
            mounted = false;
        };
    }, []);

    const onSubmit = async (data: FormValues) => {
        if (!stripe) {
            setError('Stripe is not ready yet. Please try again shortly.');
            return;
        }

        const amount = parseInt(String(data?.donationAmount || '0'), 10);
        if (!amount || amount <= 0) {
            formMethods.setError('donationAmount', { type: 'validate', message: 'Please choose a valid donation amount' });
            return;
        }

        setCreating(true);
        setError(null);
        try {
            const session = (await apiMutate('/stripe/checkout-session', 'post', { amount, interval: data.interval || undefined })) as any;
            const { error: redirectError } = await stripe.redirectToCheckout({ sessionId: session?.id });
            if (redirectError) {
                console.warn('Stripe checkout error:', redirectError);
                setError('Failed to redirect to checkout. Please try again.');
            }
        }
        catch (e) {
            console.error('Failed to create checkout session:', e);
            setError('Failed to initiate checkout. Please try again later.');
        }
        finally {
            setCreating(false);
        }
    };

    return (
        <Form methods={formMethods} onSubmit={onSubmit} className="flex flex-col items-center justify-center min-h-screen gap-6 px-4 pb-40" serverError={error}>
            <h1 className="text-2xl font-semibold">Support Us with a Donation</h1>

            <DonationAmountPicker onAmountChange={(amt) => formMethods.setValue('donationAmount', String(amt), { shouldValidate: true })} />

            <div className="w-full max-w-xs">
                <FormField name="interval" label="Donation Type:">
                    <select
                        className="w-full border rounded p-2"
                        {...formMethods.register('interval')}
                        value={formMethods.getValues('interval') ?? ''}
                        onChange={(e) => formMethods.setValue('interval', e.target.value)}
                    >
                        <option value="">One-time</option>
                        <option value="week">Weekly</option>
                        <option value="month">Monthly</option>
                    </select>
                </FormField>
            </div>

            <div className="w-full max-w-xs">
                <button type="submit" className="w-full" disabled={!stripeReady || creating}>
                    <Button disabled={!stripeReady || creating}>{creating ? 'Processing…' : 'Donate'}</Button>
                </button>
            </div>
        </Form>
    );
}
