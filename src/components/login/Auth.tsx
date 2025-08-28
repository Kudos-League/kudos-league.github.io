import React from 'react';

export default function Auth({
    title,
    children
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div
            className='
                fixed inset-0 grid place-items-center
                bg-gray-50 dark:bg-gray-900
                overflow-hidden
            '
        >
            <div
                className='
                    relative w-full max-w-md m-4
                    rounded-xl shadow-2xl overflow-hidden
                '
                style={{ maxHeight: 'calc(100dvh - 2rem)' }}
            >
                <img
                    src='/images/welcome.png'
                    alt=''
                    className='absolute inset-0 h-full w-full object-cover block'
                />
                <div className='absolute inset-0 bg-black/40 dark:bg-black/50' />

                <div className='relative p-6 sm:p-8 space-y-6 text-white overflow-auto'>
                    <h1 className='text-2xl font-bold text-center'>{title}</h1>
                    {children}
                </div>
            </div>
        </div>
    );
}
