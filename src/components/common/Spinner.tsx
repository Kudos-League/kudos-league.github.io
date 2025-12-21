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
    const sizeConfig = {
        sm: { size: 'w-8 h-8', border: 'border-2' },
        md: { size: 'w-12 h-12', border: 'border-3' },
        lg: { size: 'w-16 h-16', border: 'border-4' },
        xl: { size: 'w-20 h-20', border: 'border-4' },
        '2xl': { size: 'w-32 h-32', border: 'border-[6px]' }
    };

    const { size: sizeClass, border } = sizeConfig[size];

    return (
        <div
            className={`flex items-center justify-center h-full w-full p-3 ${className}`}
        >
            <div className='flex flex-col items-center gap-4'>
                <div className='relative'>
                    {/* Outer spinning ring */}
                    <div
                        className={`${sizeClass} ${border} rounded-full border-brand-200 dark:border-brand-800`}
                        style={{ borderTopColor: 'transparent' }}
                    />
                    {/* Animated spinning gradient ring */}
                    <div
                        className={`absolute inset-0 ${sizeClass} ${border} rounded-full border-transparent animate-spin`}
                        style={{
                            borderTopColor: '#3b49cb',
                            borderRightColor: '#5867d6',
                            borderBottomColor: '#828de0',
                            borderLeftColor: 'transparent',
                        }}
                    />
                    {/* Inner glow effect */}
                    <div
                        className={`absolute inset-0 ${sizeClass} rounded-full bg-gradient-to-tr from-brand-100/20 to-transparent dark:from-brand-400/10 blur-sm`}
                    />
                </div>
                {text && (
                    <p className='text-gray-700 dark:text-gray-300 text-center font-medium'>
                        {text}
                    </p>
                )}
            </div>
        </div>
    );
}
