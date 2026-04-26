import React from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function Auth({
    title,
    children,
    onBack,
    backLabel = 'Back'
}: {
    title: string;
    children: React.ReactNode;
    onBack?: () => void;
    backLabel?: string;
}) {
    return (
        <div
            className='
                relative isolate flex min-h-screen min-h-[100dvh] w-full items-center justify-center overflow-hidden
                bg-slate-950 px-4 py-8 sm:px-6
            '
        >
            <img
                src='/images/welcome.png'
                alt=''
                className='absolute inset-0 h-full w-full object-cover'
            />
            <div className='absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.24),transparent_45%),linear-gradient(180deg,rgba(2,6,23,0.2),rgba(2,6,23,0.84))]' />

            <div
                className='
                    relative z-10 w-full max-w-md overflow-hidden rounded-[28px]
                    border border-white/15 bg-black/35 shadow-2xl backdrop-blur-md
                '
            >
                <div className='absolute inset-0 bg-gradient-to-b from-black/10 via-black/25 to-black/55' />

                <div className='relative p-6 text-white sm:p-8'>
                    {onBack ? (
                        <button
                            type='button'
                            onClick={onBack}
                            className='mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/60'
                        >
                            <ArrowLeftIcon className='h-4 w-4' />
                            {backLabel}
                        </button>
                    ) : null}

                    <div className='space-y-6'>
                        <h1 className='text-center text-2xl font-bold'>{title}</h1>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
