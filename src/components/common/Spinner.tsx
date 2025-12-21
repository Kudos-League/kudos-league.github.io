import React from 'react';

export default function Spinner({
    text = '',
    className = '',
    size = 'xl'
}: {
    text?: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}) {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16',
        xl: 'w-20 h-20',
        '2xl': 'w-32 h-32'
    };

    return (
        <div
            className={`flex items-center justify-center h-full w-full p-3 ${className}`}
        >
            <div className='flex flex-col items-center gap-4'>
                <div className={`loading loading-spinner ${sizeClasses[size]}`}></div>
                {text && <p className='text-black dark:text-white text-center'>{text}</p>}
            </div>
        </div>
    );
}
