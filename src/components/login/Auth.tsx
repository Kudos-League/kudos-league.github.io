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
                h-full grid place-items-center
                bg-gray-50 dark:bg-gray-900
                overflow-hidden
            '
        >
            <div
                className='
                    relative w-full sm:max-w-md sm:m-4
                    sm:rounded-xl sm:shadow-2xl overflow-hidden
                    max-sm:h-full
                '
            >
                <img
                    src='/images/welcome.png'
                    alt=''
                    className='absolute inset-0 h-full w-full object-cover block'
                />
                <div className='absolute inset-0 bg-black/40 dark:bg-black/50' />

                <div className='relative p-6 sm:p-8 space-y-6 text-white overflow-auto max-sm:h-full max-sm:flex max-sm:flex-col max-sm:justify-center'>
                    <h1 className='text-2xl font-bold text-center'>{title}</h1>
                    {children}
                </div>
            </div>
        </div>
    );
}
