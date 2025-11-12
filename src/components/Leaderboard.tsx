import React, { useEffect, useState } from 'react';
import { apiGet } from '@/shared/api/apiClient';
import { useAuth } from '@/contexts/useAuth';
import { useNavigate } from 'react-router-dom';
import UserCard from '@/components/users/UserCard';
import { UserDTO } from '@/shared/api/types';

type LeaderboardUser = {
    id: number;
    username: string;
    totalKudos: number;
    location?: { name: string };
    avatar?: string | null;
};

const TIME_FILTERS = [
    { label: 'All Time', value: 'all' },
    { label: 'This Month', value: 'month' },
    { label: 'This Week', value: 'week' }
];

export default function Leaderboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [useLocal, setUseLocal] = useState(false);
    const [timeFilter, setTimeFilter] = useState('all');
    const [showDropdown, setShowDropdown] = useState(false);

    const getLabel = () =>
        TIME_FILTERS.find((f) => f.value === timeFilter)?.label || 'All Time';

    const loadLeaderboard = async () => {
        if (!user) {
            setError('Must be logged in.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await apiGet<LeaderboardUser[]>('/leaderboard', {
                params: { local: useLocal, time: timeFilter }
            });
            setLeaderboard(data);
        }
        catch (err) {
            console.error(err);
            setError('Failed to load leaderboard');
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLeaderboard();
    }, [useLocal, timeFilter]);

    return (
        <div className='max-w-3xl mx-auto p-6'>
            <h1 className='text-2xl font-bold text-center mb-6'>
                High Score Board
            </h1>

            <div className='flex justify-between items-center mb-4 relative'>
                {/* Time Filter Dropdown */}
                <div className='relative'>
                    <button
                        onClick={() => setShowDropdown((v) => !v)}
                        className='bg-white border-2 border-gray-400 text-gray-800 px-4 py-2 rounded-lg flex items-center gap-2 hover:border-gray-500 hover:bg-gray-50 transition-colors shadow-sm'
                    >
                        <span className='font-medium'>{getLabel()}</span>
                        <span className='text-xs text-gray-500'>▼</span>
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
                <div className='flex items-center gap-2'>
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
                        <div className='relative w-10 h-5 bg-gray-300 rounded-full shadow-inner'>
                            <div
                                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                    useLocal ? '' : 'translate-x-5'
                                }`}
                            />
                        </div>
                    </label>
                    <span className='text-sm'>Global</span>
                </div>
            </div>

            {/* Status */}
            {loading && <p className='text-center text-gray-500'>Loading...</p>}
            {error && <p className='text-center text-red-500'>{error}</p>}

            {/* Stacked List */}
            <ul
                role='list'
                className='divide-y divide-gray-200 dark:divide-white/10 mt-4'
            >
                {leaderboard.map((entry) => (
                    <li
                        key={entry.id}
                        className='flex justify-between gap-x-6 py-5 px-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded'
                        onClick={() => navigate(`/user/${entry.id}`)}
                    >
                        <div className='flex min-w-0 gap-x-4 flex-1'>
                            <UserCard
                                user={
                                    {
                                        ...entry,
                                        kudos: entry.totalKudos
                                    } as any as UserDTO
                                }
                                large
                                triggerVariant='avatar-name'
                                subtitle={entry.location?.name || '—'}
                                centered={false}
                                subtitleClassName='max-w-[180px]'
                            />
                        </div>

                        <div className='flex shrink-0 flex-col items-end justify-center'>
                            <p className='text-sm font-semibold text-gray-900 dark:text-white'>
                                {entry.totalKudos.toLocaleString()}
                            </p>
                            <p className='text-xs text-gray-500 dark:text-gray-400'>
                                Kudos
                            </p>
                        </div>
                    </li>                ))}
            </ul>
        </div>
    );
}
