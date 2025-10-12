import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Stripe from '@/components/payment/Stripe';
import { useAuth } from '@/contexts/useAuth';
import { routes } from '@/routes';

export default function DonatePage() {
    const { isLoggedIn } = useAuth();
    const location = useLocation();

    return (
        <div className='min-h-screen p-4 space-y-6'>
            {!isLoggedIn ? (
                <div className='max-w-xl mx-auto rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 shadow-sm dark:border-amber-800/60 dark:bg-amber-900/30 dark:text-amber-100'>
                    <p className='font-medium'>Donating as a guest</p>
                    <p className='mt-1 text-sm'>
                        We&apos;ll process your payment without an account. Kudos and donation history are only awarded when you&apos;re logged in.
                    </p>
                    <Link
                        to={routes.login}
                        state={{ from: location }}
                        className='mt-2 inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200'
                    >
                        Log in to earn Kudos →
                    </Link>
                </div>
            ) : (
                <div className='max-w-xl mx-auto rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 shadow-sm dark:border-emerald-700/60 dark:bg-emerald-900/20 dark:text-emerald-100'>
                    <p className='font-medium'>Thanks for supporting the community!</p>
                    <p className='mt-1 text-sm'>
                        Your donation will be linked to your account and Kudos will be credited automatically after payment succeeds.
                    </p>
                </div>
            )}
            <Stripe />
        </div>
    );
}
