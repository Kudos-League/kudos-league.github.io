import React, { useEffect, useState, useRef, useCallback } from 'react';
import { apiGet } from '@/shared/api/apiClient';
import { useAuth } from '@/contexts/useAuth';
import { useNavigate } from 'react-router-dom';
import UserCard from '@/components/users/UserCard';
import { UserDTO } from '@/shared/api/types';
import useLocation from '@/hooks/useLocation';
import confetti from 'canvas-confetti';

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
    const [nextCursor, setNextCursor] = useState<number | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [findingUser, setFindingUser] = useState(false);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
    const currentUserRef = useRef<HTMLLIElement>(null);
    
    // Track if the celebration has already occurred to prevent fatigue
    const hasAnimatedRef = useRef(false);

    const getHeaderLabel = () => {
        if (timeFilter === 'all') return 'All Time Legends';
        if (timeFilter === 'month') return 'Monthly Stars';
        if (timeFilter === 'week') return 'Weekly Heroes';
        return 'Leaderboard';
    };

    const getLabel = () =>
        TIME_FILTERS.find((f) => f.value === timeFilter)?.label || 'All Time';

    const hasSavedLocation = !!user?.location?.regionID;
    const hasLocation = hasSavedLocation || !!browserLocation;

    // Enhanced Confetti Logic with "Fire Once" Guard
    useEffect(() => {
        if (!loading && leaderboard.length > 0 && user && !hasAnimatedRef.current) {
            const userRankIndex = leaderboard.findIndex(u => u.id === user.id);
            
            // Only trigger if user is in the top 3 (0, 1, 2)
            if (userRankIndex >= 0 && userRankIndex <= 2) {
                hasAnimatedRef.current = true; // Mark as seen immediately

                const colors = [
                    ['#FFD700', '#FFA500', '#FFFFFF'], // Gold (1st)
                    ['#C0C0C0', '#E8E8E8', '#94A3B8'], // Silver (2nd)
                    ['#CD7F32', '#B87333', '#813D00']  // Bronze (3rd)
                ];

                const end = Date.now() + 2 * 1000;

                (function frame() {
                    confetti({
                        particleCount: 3,
                        angle: 60,
                        spread: 55,
                        origin: { x: 0, y: 0.8 },
                        colors: colors[userRankIndex],
                        zIndex: 9999
                    });
                    confetti({
                        particleCount: 3,
                        angle: 120,
                        spread: 55,
                        origin: { x: 1, y: 0.8 },
                        colors: colors[userRankIndex],
                        zIndex: 9999
                    });

                    if (Date.now() < end) {
                        requestAnimationFrame(frame);
                    }
                }());
            }
        }
    }, [leaderboard, loading, user]);

    const loadLeaderboard = useCallback(async (reset = true) => {
        if (!user) {
            setError('Must be logged in.');
            return;
        }

        if (useLocal && !hasLocation) {
            setError(null);
            setLoading(false);
            setLeaderboard([]);
            setNextCursor(null);
            return;
        }

        if (reset) {
            setLoading(true);
            setLeaderboard([]);
            setNextCursor(null);
            // Reset animation guard when filters change if you want them to celebrate again 
            // otherwise, keep hasAnimatedRef.current true.
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

    useEffect(() => {
        loadLeaderboard();
    }, [useLocal, timeFilter]);

    const scrollToUser = () => {
        if (currentUserRef.current && scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const element = currentUserRef.current;
            
            const elementOffset = element.offsetTop;
            const elementHeight = element.offsetHeight;
            const containerHeight = container.offsetHeight;

            container.scrollTo({
                top: elementOffset - (containerHeight / 2) + (elementHeight / 2),
                behavior: 'smooth'
            });
        }
    };

    const findMe = async () => {
        if (!user) return;
        const userInLeaderboard = leaderboard.some(entry => entry.id === user.id);

        if (userInLeaderboard) {
            scrollToUser();
            return;
        }

        setFindingUser(true);
        try {
            let tempCursor = nextCursor;
            let tempLeaderboard = [...leaderboard];
            let userFound = false;

            while (tempCursor && !userFound) {
                const response = await apiGet<LeaderboardResponse>('/leaderboard', {
                    params: { local: useLocal, time: timeFilter, limit: 20, cursor: tempCursor }
                });
                
                const newData = response.data || [];
                tempLeaderboard = [...tempLeaderboard, ...newData];
                tempCursor = response.nextCursor;
                userFound = newData.some(entry => entry.id === user.id);
                
                setLeaderboard(tempLeaderboard);
                setNextCursor(response.nextCursor);

                if (userFound) break;
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            setTimeout(scrollToUser, 200);
        }
        catch (err) {
            console.error('Error finding user:', err);
        }
        finally {
            setFindingUser(false);
        }
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        if (showDropdown) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDropdown]);

    useEffect(() => {
        const trigger = loadMoreTriggerRef.current;
        if (!trigger) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && nextCursor && !loadingMore && !loading) {
                    loadLeaderboard(false);
                }
            },
            { threshold: 0.1 }
        );
        observer.observe(trigger);
        return () => trigger && observer.unobserve(trigger);
    }, [nextCursor, loadingMore, loading, loadLeaderboard]);

    const getMedalStyles = (index: number) => {
        if (index === 0) return 'text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]'; 
        if (index === 1) return 'text-slate-400 drop-shadow-[0_0_10px_rgba(148,163,184,0.4)]'; 
        if (index === 2) return 'text-orange-600 drop-shadow-[0_0_10px_rgba(234,88,12,0.4)]'; 
        return 'text-slate-400 dark:text-slate-500';
    };

    const LeaderboardContent = (
        <>
            <ul role='list' className={`divide-y divide-slate-100 dark:divide-slate-800 ${compact ? 'mt-2' : 'mt-4'}`}>
                {leaderboard?.map((entry, index) => {
                    const medalClass = getMedalStyles(index);
                    const isCurrentUser = entry.id === user?.id;
                    const isTopThree = index < 3;

                    return (
                        <li
                            key={entry.id}
                            ref={isCurrentUser ? currentUserRef : null}
                            className={`flex justify-between gap-x-2 cursor-pointer transition-all duration-300 relative overflow-hidden
                                ${isCurrentUser 
                            ? 'bg-white dark:bg-slate-800 ring-2 ring-brand-500 shadow-xl scale-[1.01] z-10' 
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'} 
                                rounded-2xl mx-3 ${compact ? 'py-3 px-5' : 'py-6 px-7'}`}
                            onClick={() => navigate(`/user/${entry.id}`)}
                        >
                            {isCurrentUser && isTopThree && (
                                <div className="absolute inset-0 pointer-events-none">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 dark:via-white/10 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite]" />
                                </div>
                            )}

                            <div className='flex min-w-0 gap-x-4 flex-1 items-center'>
                                <div className={`flex-shrink-0 font-black tabular-nums ${medalClass} ${compact ? 'text-lg w-6' : 'text-2xl w-8'}`}>
                                    {index + 1}
                                </div>
                                <UserCard
                                    user={{ ...entry, kudos: entry.totalKudos } as any as UserDTO}
                                    large={!compact}
                                    compact={compact}
                                    triggerVariant='avatar-name'
                                    subtitle={entry.location?.name}
                                    centered={false}
                                    subtitleClassName="max-w-[150px] opacity-60"
                                    nameClassName={isTopThree ? 'font-black' : 'font-bold'}
                                    showMessageButton={false}
                                />
                            </div>

                            <div className='flex shrink-0 flex-col items-end justify-center'>
                                <p className={`font-black tabular-nums ${isCurrentUser ? 'text-brand-600 dark:text-brand-400' : 'text-slate-900 dark:text-slate-100'} ${compact ? 'text-sm' : 'text-xl'}`}>
                                    {entry.totalKudos.toLocaleString()}
                                </p>
                                <p className='text-[10px] uppercase tracking-tighter font-black text-slate-400 dark:text-slate-500'>
                                    {timeFilter === 'all' ? 'Points' : 'This Period'}
                                </p>
                            </div>
                        </li>
                    );
                })}
            </ul>

            {nextCursor && (
                <div ref={loadMoreTriggerRef} className={`flex items-center justify-center ${compact ? 'h-10' : 'h-16'}`}>
                    <div className="w-5 h-5 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                </div>
            )}
        </>
    );

    return (
        <div className={compact ? 'relative' : 'sticky top-4 max-w-3xl ml-auto mr-16 lg:mr-24 p-10 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none'}>
            <style>{`
                @keyframes shimmer { 100% { transform: translateX(100%); } }
                .leaderboard-scroll::-webkit-scrollbar { width: 5px; }
                .leaderboard-scroll::-webkit-scrollbar-track { background: transparent; }
                .leaderboard-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .dark .leaderboard-scroll::-webkit-scrollbar-thumb { background: #334155; }
            `}</style>

            <div className="mb-2">
                <p className="text-brand-600 dark:text-brand-400 font-black text-xs uppercase tracking-[0.2em] mb-1">Ranking</p>
                <h1 className={`font-black tracking-tighter text-slate-900 dark:text-white ${compact ? 'text-2xl' : 'text-4xl'}`}>
                    {getHeaderLabel()}
                </h1>
            </div>

            <div className={`flex justify-between items-center gap-4 ${compact ? 'mb-4' : 'mb-8'}`}>
                <div className='relative' ref={dropdownRef}>
                    <button
                        onClick={() => setShowDropdown((v) => !v)}
                        className={`bg-slate-100/50 dark:bg-slate-800/50 border border-transparent dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 ${compact ? 'px-3 py-1.5 text-xs font-bold' : 'px-5 py-3 text-sm font-black'}`}
                    >
                        {getLabel()}
                        <svg className={`w-3 h-3 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                    </button>

                    {showDropdown && (
                        <div className='absolute top-full mt-2 left-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl w-48 z-50 overflow-hidden'>
                            {TIME_FILTERS.map((filter) => (
                                <button
                                    key={filter.value}
                                    className={`block w-full px-5 py-4 text-left text-sm transition-colors ${timeFilter === filter.value ? 'bg-brand-50 dark:bg-brand-900/30 font-black text-brand-600 dark:text-brand-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 font-bold'}`}
                                    onClick={() => { setTimeFilter(filter.value); setShowDropdown(false); }}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {hasSavedLocation ? (
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-transparent dark:border-slate-300">
                            <button onClick={() => setUseLocal(true)} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${useLocal ? 'bg-white dark:bg-slate-300 shadow-sm text-brand-600' : 'text-slate-400'}`}>Local</button>
                            <button onClick={() => setUseLocal(false)} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${!useLocal ? 'bg-white dark:bg-slate-300 shadow-sm text-brand-600' : 'text-slate-400'}`}>Global</button>
                        </div>
                    ) : (
                        <button onClick={() => navigate(`/user/${user?.id}`)} className="text-xs font-black text-brand-600 hover:underline px-2">+ Add Location</button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="py-20 flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-[5px] border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Loading Legends...</p>
                </div>
            ) : error ? (
                <p className='text-center py-8 text-red-500 font-bold bg-red-50 dark:bg-red-900/10 rounded-2xl'>{error}</p>
            ) : (
                <>
                    <div
                        ref={scrollContainerRef}
                        className={`leaderboard-scroll overflow-y-auto pr-1 mb-6 relative ${compact ? 'max-h-[calc(100vh-450px)]' : 'max-h-[calc(100vh-26rem)]'}`}
                        style={{ scrollbarGutter: 'stable', position: 'relative' }}
                    >
                        {LeaderboardContent}
                    </div>
                    
                    {leaderboard.length > 0 && (
                        <div className="px-1">
                            <button
                                onClick={findMe}
                                disabled={findingUser}
                                className={`w-full bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-black transition-all shadow-xl shadow-brand-500/25 active:scale-[0.98] disabled:opacity-70 ${compact ? 'py-3.5 text-xs uppercase tracking-widest' : 'py-5 text-sm uppercase tracking-[0.2em]'}`}
                            >
                                {findingUser ? 'Searching...' : 'Find My Rank'}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
