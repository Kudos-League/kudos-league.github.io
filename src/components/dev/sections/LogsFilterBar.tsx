import React, { useEffect, useState } from 'react';
import type { LogFilter } from '@/services/logCollector/types';

interface LogsFilterBarProps {
    onFilterChange: (filter: LogFilter) => void;
    currentFilter?: LogFilter;
}


export default function LogsFilterBar({ onFilterChange, currentFilter }: LogsFilterBarProps) {
    const [searchText, setSearchText] = useState(() => currentFilter?.searchText || '');

    // Sync search text with currentFilter when it changes
    useEffect(() => {
        if (currentFilter?.searchText !== undefined) {
            setSearchText(currentFilter.searchText);
        }
    }, [currentFilter?.searchText]);

    // Debounced filter application - only update searchText, preserve other filters
    useEffect(() => {
        const timer = setTimeout(() => {
            onFilterChange({
                ...currentFilter,
                searchText,
            });
        }, 300);

        return () => clearTimeout(timer);
    }, [searchText, currentFilter, onFilterChange]);

    return (
        <div className='p-2 bg-gray-50 dark:bg-slate-900 rounded border border-gray-200 dark:border-gray-700 space-y-1.5'>
            {/* Search Input */}
            <input
                type='text'
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder='Search logs...'
                className='w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500'
            />
        </div>
    );
}
