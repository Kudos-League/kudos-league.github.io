import React from 'react';
import Stripe from '@/components/payment/Stripe';

export default function DonatePage() {
    return (
        <div className='min-h-screen p-4'>
            <Stripe />
        </div>
    );
}
