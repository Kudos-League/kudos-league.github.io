import React from 'react';

/**
 * Shown in place of a post/gift image when none is available: the KLF logo in
 * grey at low opacity, instead of placeholder text. Fills its parent; pass
 * sizing/rounding via `className` to match the surrounding image box.
 */
export default function ImagePlaceholder({
    className = ''
}: {
    className?: string;
}) {
    return (
        <div
            aria-hidden='true'
            className={`flex items-center justify-center bg-gray-100 dark:bg-zinc-800 ${className}`}
        >
            <img
                src={`${process.env.PUBLIC_URL}/logo.webp`}
                alt=''
                draggable={false}
                className='w-1/2 max-w-[72px] max-h-[60%] object-contain opacity-20 grayscale select-none pointer-events-none'
            />
        </div>
    );
}
