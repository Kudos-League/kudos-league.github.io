import React from 'react';

interface SearchBarProps {
    autoFocus?: boolean;
    className?: string;
    onOpenSearchModal?: () => void;
}

export default function SearchBar({
    autoFocus = false,
    className = '',
    onOpenSearchModal
}: SearchBarProps) {

    return (
        <div className={`relative ${className}`}>
            <input
                type='text'
                placeholder='Search…'
                value=''
                readOnly
                onClick={() => {
                    if (onOpenSearchModal) {
                        onOpenSearchModal();
                    }
                }}
                className='w-full px-4 py-2 pr-10 lg:px-6 lg:py-3 lg:text-lg rounded-full bg-white/90 dark:bg-zinc-800/90 text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 shadow-lg backdrop-blur-sm ring-1 ring-zinc-900/5 dark:ring-white/10 focus:outline-none focus:ring-zinc-900/10 dark:focus:ring-white/20 transition-all cursor-pointer'
                autoFocus={autoFocus}
            />
        </div>
    );
}
