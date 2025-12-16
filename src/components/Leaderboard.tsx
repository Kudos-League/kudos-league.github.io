import React, { useEffect, useState, useRef, useCallback } from 'react';
import { apiGet } from '@/shared/api/apiClient';
import { useAuth } from '@/contexts/useAuth';
import { useNavigate } from 'react-router-dom';
import UserCard from '@/components/users/UserCard';
import { UserDTO } from '@/shared/api/types';
import useLocation from '@/hooks/useLocation';

type LeaderboardUser = {
    id: number;
    username: string;
    totalKudos: number;
    location?: { name: string };
    avatar?: string | null;
};

type LeaderboardResponse = {
    data: LeaderboardUser[];
    nextCursor: number | null;
};

const TIME_FILTERS = [
    { label: 'All Time', value: 'all' },
    { label: 'This Month', value: 'month' },
    { label: 'This Week', value: 'week' }
];

type LeaderboardProps = {
    compact?: boolean;
};

export default function Leaderboard({ compact = false }: LeaderboardProps) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { location: browserLocation } = useLocation();

    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [useLocal, setUseLocal] = useState(false);
    const [timeFilter, setTimeFilter] = useState('all');
    const [showDropdown, setShowDropdown] = useState(false);
    const [displayLimit, setDisplayLimit] = useState(10);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const getLabel = () =>
        TIME_FILTERS.find((f) => f.value === timeFilter)?.label || 'All Time';

    // Check if we have any location available (saved or browser)
    const hasLocation = !!user?.location?.regionID || !!browserLocation;

    console.log('Render - useLocal:', useLocal, 'hasLocation:', hasLocation, 'shouldRender:', !useLocal || hasLocation);

    const loadLeaderboard = async () => {
        if (!user) {
            setError('Must be logged in.');
            return;
        }

        // If local filter is enabled but no location available, show error
        if (useLocal && !hasLocation) {
            setError(null); // Clear error, will show message in UI instead
            setLoading(false);
            setLeaderboard([]);
            return;
        }

        setLoading(true);
        setLeaderboard([]);
        setDisplayLimit(10); // Reset display limit when filters change
        scrollContainerRef.current?.scrollTo(0, 0);

        setError(null);
        try {
            const response = await apiGet<LeaderboardResponse>('/leaderboard', {
                params: {
                    local: useLocal,
                    time: timeFilter,
                    limit: 100 // Load a reasonable amount upfront
                }
            });

            setLeaderboard(response.data || []);
        }
        catch (err) {
            console.error('Leaderboard error:', err);
            setError('Failed to load leaderboard');
        }
        finally {
            setLoading(false);
        }
    };

    // Effect to trigger load when filters change
    useEffect(() => {
        loadLeaderboard();
    }, [useLocal, timeFilter]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }

        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDropdown]);

    const displayedUsers = leaderboard.slice(0, displayLimit);
    const hasMore = leaderboard.length > displayLimit;
    const canShowLess = displayLimit > 10;

    const LeaderboardContent = (
        <>
            {/* Stacked List */}
            <ul
                role='list'
                className={`divide-y divide-gray-200 dark:divide-white/10 ${compact ? 'mt-2' : 'mt-4'}`}
            >
                {displayedUsers?.map((entry) => (
                    <li
                        key={entry.id}
                        className={`flex justify-between gap-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded ${
                            compact ? 'py-2 px-1' : 'py-5 px-2'
                        }`}
                        onClick={() => navigate(`/user/${entry.id}`)}
                    >
                        <div className='flex min-w-0 gap-x-2 flex-1'>
                            <UserCard
                                user={
                                    {
                                        ...entry,
                                        kudos: entry.totalKudos
                                    } as any as UserDTO
                                }
                                large={!compact}
                                triggerVariant='avatar-name'
                                subtitle={compact ? undefined : (entry.location?.name || '—')}
                                centered={false}
                                subtitleClassName='max-w-[180px]'
                            />
                        </div>

                        <div className='flex shrink-0 flex-col items-end justify-center'>
                            <p className={`font-semibold text-gray-900 dark:text-white ${compact ? 'text-xs' : 'text-sm'}`}>
                                {entry.totalKudos.toLocaleString()}
                            </p>
                            {!compact && (
                                <p className='text-xs text-gray-500 dark:text-gray-400'>
                                    Kudos
                                </p>
                            )}
                        </div>
                    </li>
                ))}
            </ul>

            {/* Show More / Show Less buttons */}
            {!compact && (hasMore || canShowLess) && (
                <div className='flex gap-2 justify-center py-4 border-t border-gray-200 dark:border-gray-700 mt-4'>
                    {hasMore && (
                        <button
                            onClick={() => setDisplayLimit(prev => Math.min(prev + 10, leaderboard.length))}
                            className='px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors text-sm'
                        >
                            Show More
                        </button>
                    )}
                    {canShowLess && (
                        <button
                            onClick={() => {
                                setDisplayLimit(prev => Math.max(prev - 10, 10));
                                scrollContainerRef.current?.scrollTo(0, 0);
                            }}
                            className='px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg transition-colors text-sm'
                        >
                            Show Less
                        </button>
                    )}
                </div>
            )}

            {/* End of list message */}
            {!hasMore && leaderboard.length > 0 && displayLimit >= leaderboard.length && (
                <div className='text-center py-4 text-sm text-gray-500'>
                    You&apos;ve reached the end of the leaderboard
                </div>
            )}
        </>
    );

    return (
        <div className={compact ? '' : 'sticky top-4 max-w-3xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg'}>
            <h1 className={`font-bold text-center ${compact ? 'text-base mb-2' : 'text-2xl mb-6'}`}>
                Most Kudos
            </h1>

            <div className={`flex justify-between items-center relative ${compact ? 'mb-2 gap-1' : 'mb-4'}`}>
                {/* Time Filter Dropdown */}
                <div className='relative' ref={dropdownRef}>
                    <button
                        onClick={() => setShowDropdown((v) => !v)}
                        className={`bg-white dark:bg-zinc-800 border-2 border-gray-400 dark:border-zinc-600 text-gray-800 dark:text-zinc-200 rounded-lg flex items-center gap-1 hover:border-gray-500 dark:hover:border-zinc-500 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors shadow-sm ${
                            compact ? 'px-2 py-1 text-xs' : 'px-4 py-2'
                        }`}
                    >
                        <span className='font-medium'>{compact ? getLabel().replace('This ', '') : getLabel()}</span>
                        <span className='text-xs text-gray-500 dark:text-zinc-400'>▼</span>
                    </button>

                    {showDropdown && (
                        <div className='absolute top-full mt-1 left-0 bg-white border-2 border-gray-300 shadow-lg rounded-lg w-40 z-10 overflow-hidden'>
                            {TIME_FILTERS.map((filter) => (
                                <button
                                    key={filter.value}
                                    className={`block w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors ${
                                        timeFilter === filter.value
                                            ? 'bg-blue-50 font-semibold text-blue-700'
                                            : 'text-gray-800'
                                    }`}
                                    onClick={() => {
                                        setTimeFilter(filter.value);
                                        setShowDropdown(false);
                                    }}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Local/Global Switch */}
                <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2'}`}>
                    <span className='text-sm'>
                        {user?.location?.name || 'Local'}
                    </span>
                    <label className='inline-flex items-center cursor-pointer'>
                        <input
                            type='checkbox'
                            checked={!useLocal}
                            onChange={() => setUseLocal((v) => !v)}
                            className='sr-only'
                        />
                        <div className={`relative bg-gray-300 dark:bg-zinc-600 rounded-full shadow-inner ${
                            compact ? 'w-8 h-4' : 'w-10 h-5'
                        }`}>
                            <div
                                className={`absolute top-0.5 left-0.5 bg-white rounded-full shadow transition-transform ${
                                    compact ? 'w-3 h-3' : 'w-4 h-4'
                                } ${
                                    useLocal ? '' : (compact ? 'translate-x-4' : 'translate-x-5')
                                }`}
                            />
                        </div>
                    </label>
                    <span className={compact ? 'text-xs' : 'text-sm'}>Global</span>
                </div>
            </div>

            {/* Status */}
            {loading && <p className='text-center text-gray-500'>Loading...</p>}
            {error && <p className='text-center text-red-500'>{error}</p>}

            {/* No location message when local filter is on but no location available */}
            {useLocal && !hasLocation && !loading && (
                <div className='mt-4 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center'>
                    <div className='text-4xl mb-3'>📍</div>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                        Location Required
                    </h3>
                    <p className='text-sm text-gray-600 dark:text-gray-400 mb-4'>
                        To view your local leaderboard, you need to set your location first.
                    </p>
                    <button
                        onClick={() => navigate('/settings')}
                        className='inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors'
                    >
                        Add Location in Settings
                    </button>
                </div>
            )}

            {/* Leaderboard List Container */}
            {(!useLocal || hasLocation) && !loading && (
                <>
                    <style>{`
                        .leaderboard-scroll::-webkit-scrollbar {
                            width: 8px;
                        }
                        .leaderboard-scroll::-webkit-scrollbar-track {
                            background: rgba(0, 0, 0, 0.05);
                            border-radius: 4px;
                        }
                        .leaderboard-scroll::-webkit-scrollbar-thumb {
                            background: rgba(0, 0, 0, 0.2);
                            border-radius: 4px;
                        }
                        .leaderboard-scroll::-webkit-scrollbar-thumb:hover {
                            background: rgba(0, 0, 0, 0.3);
                        }
                        .dark .leaderboard-scroll::-webkit-scrollbar-track {
                            background: rgba(255, 255, 255, 0.05);
                        }
                        .dark .leaderboard-scroll::-webkit-scrollbar-thumb {
                            background: rgba(255, 255, 255, 0.2);
                        }
                        .dark .leaderboard-scroll::-webkit-scrollbar-thumb:hover {
                            background: rgba(255, 255, 255, 0.3);
                        }
                    `}</style>
                    <div
                        ref={scrollContainerRef}
                        className={compact ? '' : 'leaderboard-scroll max-h-[calc(100vh-16rem)] overflow-y-auto pr-2'}
                        style={compact ? {} : { scrollbarGutter: 'stable' }}
                    >
                        {LeaderboardContent}
                    </div>
                </>
            )}
        </div>
    );
}
