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
    const [displayLimit, setDisplayLimit] = useState(20);
    const [nextCursor, setNextCursor] = useState<number | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [findingUser, setFindingUser] = useState(false);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
    const currentUserRef = useRef<HTMLLIElement>(null);

    const getLabel = () =>
        TIME_FILTERS.find((f) => f.value === timeFilter)?.label || 'All Time';

    const getHeaderLabel = () => {
        if (timeFilter === 'all') return 'Most Kudos';
        const period =
            TIME_FILTERS.find((f) => f.value === timeFilter)?.label || '';
        return compact ? period.replace('This ', '') : `Kudos ${period}`;
    };

    // Check if user has a SAVED location (not browser location) - required for local leaderboard
    const hasSavedLocation = !!user?.location?.regionID;
    // For API calls, we can use either saved or browser location
    const hasLocation = hasSavedLocation || !!browserLocation;

    const loadLeaderboard = useCallback(async (reset = true) => {
        if (!user) {
            setError('Must be logged in.');
            return;
        }

        // If local filter is enabled but no location available, show error
        if (useLocal && !hasLocation) {
            setError(null); // Clear error, will show message in UI instead
            setLoading(false);
            setLeaderboard([]);
            setNextCursor(null);
            return;
        }

        if (reset) {
            setLoading(true);
            setLeaderboard([]);
            setNextCursor(null);
            scrollContainerRef.current?.scrollTo(0, 0);
        }
        else {
            setLoadingMore(true);
        }

        setError(null);
        try {
            const response = await apiGet<LeaderboardResponse>('/leaderboard', {
                params: {
                    local: useLocal,
                    time: timeFilter,
                    limit: 20,
                    cursor: reset ? undefined : nextCursor
                }
            });

            if (reset) {
                setLeaderboard(response.data || []);
            }
            else {
                setLeaderboard((prev) => [...prev, ...(response.data || [])]);
            }
            setNextCursor(response.nextCursor);
        }
        catch (err) {
            console.error('Leaderboard error:', err);
            setError('Failed to load leaderboard');
        }
        finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [user, useLocal, hasLocation, timeFilter, nextCursor]);

    // Effect to trigger load when filters change
    useEffect(() => {
        loadLeaderboard();
    }, [useLocal, timeFilter]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
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

    // Infinite scroll observer
    useEffect(() => {
        const trigger = loadMoreTriggerRef.current;
        if (!trigger) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const firstEntry = entries[0];
                if (
                    firstEntry.isIntersecting &&
                    nextCursor &&
                    !loadingMore &&
                    !loading
                ) {
                    loadLeaderboard(false);
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(trigger);

        return () => {
            if (trigger) observer.unobserve(trigger);
        };
    }, [nextCursor, loadingMore, loading]);

    // Get medal color for top 3 positions
    const getMedalColor = (index: number) => {
        if (index === 0) return 'text-yellow-500 dark:text-yellow-400'; // Gold
        if (index === 1) return 'text-gray-400 dark:text-gray-300'; // Silver
        if (index === 2) return 'text-amber-700 dark:text-amber-600'; // Bronze
        return '';
    };

    // Find and scroll to current user
    const findMe = async () => {
        if (!user) return;

        // Check if user is already in the loaded leaderboard
        const userInLeaderboard = leaderboard.some(entry => entry.id === user.id);

        if (userInLeaderboard) {
            // User is already loaded, just scroll to them
            if (currentUserRef.current) {
                currentUserRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
            return;
        }

        // User not loaded yet, need to fetch more data
        setFindingUser(true);

        try {
            let tempCursor = nextCursor;
            let tempLeaderboard = [...leaderboard];
            let userFound = false;

            // Keep fetching until we find the user or run out of data
            while (tempCursor && !userFound) {
                // Add a small delay for better UX
                await new Promise(resolve => setTimeout(resolve, 300));

                const response = await apiGet<LeaderboardResponse>('/leaderboard', {
                    params: {
                        local: useLocal,
                        time: timeFilter,
                        limit: 20,
                        cursor: tempCursor
                    }
                });

                tempLeaderboard = [...tempLeaderboard, ...(response.data || [])];
                tempCursor = response.nextCursor;

                // Check if user is in this batch
                userFound = response.data?.some(entry => entry.id === user.id) || false;

                // Update state with new data
                setLeaderboard(tempLeaderboard);
                setNextCursor(response.nextCursor);
            }

            // Scroll to user after a brief delay to ensure DOM is updated
            setTimeout(() => {
                if (currentUserRef.current) {
                    currentUserRef.current.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }
            }, 100);
        } catch (err) {
            console.error('Error finding user:', err);
        } finally {
            setFindingUser(false);
        }
    };

    const LeaderboardContent = (
        <>
            {/* Stacked List */}
            <ul
                role='list'
                className={`divide-y divide-gray-200 dark:divide-white/10 ${compact ? 'mt-2' : 'mt-4'}`}
            >
                {leaderboard?.map((entry, index) => {
                    const medalColor = getMedalColor(index);
                    const position = index + 1;
                    const isCurrentUser = entry.id === user?.id;
                    return (
                        <li
                            key={entry.id}
                            ref={isCurrentUser ? currentUserRef : null}
                            className={`flex justify-between gap-x-2 cursor-pointer ${isCurrentUser ? 'hover:bg-brand-100 dark:hover:bg-brand-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'} rounded mx-1 ${
                                compact ? 'py-2 px-1' : 'py-7 px-2'
                            } ${isCurrentUser ? 'bg-brand-50 dark:bg-brand-900 ring-2 ring-brand-400 dark:ring-brand-600' : ''}`}
                            onClick={() => navigate(`/user/${entry.id}`)}
                        >
                            <div className='flex min-w-0 gap-x-2 flex-1 items-center'>
                                <div
                                    className={`flex-shrink-0 font-semibold ml-1 ${medalColor || (isCurrentUser ? 'text-brand-600 dark:text-brand-400' : 'text-gray-600 dark:text-gray-400')} ${
                                        compact ? 'text-sm w-6' : 'text-lg w-8'
                                    }`}
                                >
                                    {position}
                                </div>
                                <UserCard
                                    user={
                                        {
                                            ...entry,
                                            kudos: entry.totalKudos
                                        } as any as UserDTO
                                    }
                                    large={!compact}
                                    triggerVariant='avatar-name'
                                    subtitle={entry.location?.name || '—'}
                                    centered={false}
                                    subtitleClassName='max-w-[180px]'
                                    nameClassName={medalColor}
                                />
                            </div>

                            <div className='flex shrink-0 flex-col items-end justify-center'>
                                <p
                                    className={`font-semibold ${isCurrentUser ? 'text-brand-700 dark:text-brand-300' : 'text-gray-900 dark:text-white'} ${compact ? 'text-xs' : 'text-sm'}`}
                                >
                                    {entry.totalKudos.toLocaleString()}
                                </p>
                                {compact && timeFilter !== 'all' && (
                                    <p className='text-[10px] text-gray-500 dark:text-gray-400'>
                                        {timeFilter === 'week'
                                            ? 'this wk'
                                            : 'this mo'}
                                    </p>
                                )}
                                {!compact && (
                                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                                        {timeFilter === 'all'
                                            ? 'Kudos'
                                            : `This ${timeFilter === 'week' ? 'Week' : 'Month'}`}
                                    </p>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>

            {/* Infinite scroll trigger */}
            {nextCursor && (
                <div
                    ref={loadMoreTriggerRef}
                    className={`flex items-center justify-center ${compact ? 'h-6' : 'h-10'}`}
                >
                    {loadingMore && (
                        <div
                            className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}
                        >
                            Loading more...
                        </div>
                    )}
                </div>
            )}

            {/* End of list message */}
            {!nextCursor && leaderboard.length > 0 && (
                <div
                    className={`text-center text-gray-500 ${compact ? 'py-2 text-xs' : 'py-4 text-sm'}`}
                >
                    You&apos;ve reached the end
                </div>
            )}
        </>
    );

    return (
        <div
            className={
                compact
                    ? ''
                    : 'sticky top-4 max-w-3xl ml-auto mr-16 lg:mr-24 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg'
            }
        >
            <h1
                className={`font-bold text-center ${compact ? 'text-base mb-2' : 'text-2xl mb-6'}`}
            >
                {getHeaderLabel()}
            </h1>

            <div
                className={`ml-4 flex justify-between items-center relative gap-2 ${compact ? 'mb-2' : 'mb-4'}`}
            >
                {/* Time Filter Dropdown */}
                <div className='relative' ref={dropdownRef}>
                    <button
                        onClick={() => setShowDropdown((v) => !v)}
                        className={`bg-white dark:bg-zinc-800 border-2 border-gray-400 dark:border-zinc-600 text-gray-800 dark:text-zinc-200 rounded-lg flex items-center gap-1 hover:border-gray-500 dark:hover:border-zinc-500 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors shadow-sm ${
                            compact ? 'px-2 py-1 text-xs' : 'px-4 py-2'
                        }`}
                    >
                        <span className='font-medium'>
                            {compact
                                ? getLabel().replace('This ', '')
                                : getLabel()}
                        </span>
                        <span className='text-xs text-gray-500 dark:text-zinc-400'>
                            ▼
                        </span>
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
                <div
                    className={`flex items-center ${compact ? 'gap-1' : 'gap-2'}`}
                >
                    {hasSavedLocation ? (
                        <>
                            <span
                                className={`truncate max-w-[60px] sm:max-w-[100px] md:max-w-[140px] ${compact ? 'text-xs' : 'text-sm'}`}
                                title={user?.location?.name || 'Local'}
                            >
                                {user?.location?.name || 'Local'}
                            </span>
                            <label className='inline-flex items-center cursor-pointer'>
                                <input
                                    type='checkbox'
                                    checked={!useLocal}
                                    onChange={() => setUseLocal((v) => !v)}
                                    className='sr-only'
                                />
                                <div
                                    className={`relative bg-gray-300 dark:bg-zinc-600 rounded-full shadow-inner ${
                                        compact ? 'w-8 h-4' : 'w-10 h-5'
                                    }`}
                                >
                                    <div
                                        className={`absolute top-0.5 left-0.5 bg-white rounded-full shadow transition-transform ${
                                            compact ? 'w-3 h-3' : 'w-4 h-4'
                                        } ${
                                            useLocal
                                                ? ''
                                                : compact
                                                    ? 'translate-x-4'
                                                    : 'translate-x-5'
                                        }`}
                                    />
                                </div>
                            </label>
                            <span className={compact ? 'text-xs' : 'text-sm'}>
                                Global
                            </span>
                        </>
                    ) : (
                        <button
                            onClick={() => navigate(`/user/${user?.id}`)}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors ${compact ? 'text-xs' : 'text-sm'}`}
                            title='Add your location to see local leaderboard'
                        >
                            <span className={compact ? '' : 'hidden sm:inline'}>
                                Add location on your profile for local filter
                            </span>
                            <span className={compact ? 'hidden' : 'sm:hidden'}>
                                Local
                            </span>
                        </button>
                    )}
                </div>
            </div>

            {/* Find Me Button */}
            {!loading && leaderboard.length > 0 && (
                <div className={`mx-4 ${compact ? 'mb-2' : 'mb-4'}`}>
                    <button
                        onClick={findMe}
                        disabled={findingUser}
                        className={`w-full bg-brand-500 hover:bg-brand-600 dark:bg-brand-600 dark:hover:bg-brand-700 text-white rounded-lg font-medium transition-colors shadow-sm active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed ${
                            compact ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-sm'
                        }`}
                        title='Scroll to your position in the leaderboard'
                    >
                        {findingUser ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Finding...
                            </span>
                        ) : (
                            'Find Me'
                        )}
                    </button>
                </div>
            )}


            {/* Status */}
            {loading && <p className='text-center text-gray-500'>Loading...</p>}
            {error && <p className='text-center text-red-500'>{error}</p>}

            {/* Leaderboard List Container */}
            {!loading && (
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
                        className={
                            compact
                                ? 'leaderboard-scroll max-h-[calc(100vh-390px)] sm:max-h-[calc(100vh-350px)] md:max-h-[calc(100vh-300px)] overflow-y-auto pr-1 mb-4'
                                : 'leaderboard-scroll max-h-[calc(100vh-16rem)] overflow-y-auto pr-2 mb-4'
                        }
                        style={{ scrollbarGutter: 'stable' }}
                    >
                        {LeaderboardContent}
                    </div>
                </>
            )}
        </div>
    );
}
