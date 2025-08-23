import React, { useEffect, useState } from 'react';
import { fetchLeaderboard } from 'shared/api/actions';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import UserCard from '@/components/users/UserCard';
import Button from './common/Button';
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
    { label: 'This Week', value: 'week' },
];

export default function Leaderboard() {
    const { user, token } = useAuth();
    const navigate = useNavigate();

    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [useLocal, setUseLocal] = useState(false);
    const [timeFilter, setTimeFilter] = useState('all');
    const [showDropdown, setShowDropdown] = useState(false);

    const getLabel = () => TIME_FILTERS.find((f) => f.value === timeFilter)?.label || 'All Time';

    const loadLeaderboard = async () => {
        if (!token) {
            setError('Must be logged in.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await fetchLeaderboard(token, useLocal, timeFilter);
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
        <div className="max-w-3xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-center mb-6">High Score Board</h1>

            <div className="flex justify-between items-center mb-4 relative">
                {/* Time Filter Dropdown */}
                <div className="relative">
                    <Button
                        onClick={() => setShowDropdown((v) => !v)}
                        className="bg-gray-100 px-4 py-2 rounded-full flex items-center gap-2"
                    >
                        <span>{getLabel()}</span>
                        <span className="text-xs text-gray-500">▼</span>
                    </Button>

                    {showDropdown && (
                        <div className="absolute top-full mt-1 left-0 bg-white border shadow rounded w-40 z-10">
                            {TIME_FILTERS.map((filter) => (
                                <Button
                                    key={filter.value}
                                    className={`block w-full px-4 py-2 text-left hover:bg-gray-100 ${
                                        timeFilter === filter.value ? 'font-semibold text-blue-600' : ''
                                    }`}
                                    onClick={() => {
                                        setTimeFilter(filter.value);
                                        setShowDropdown(false);
                                    }}
                                >
                                    {filter.label}
                                </Button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Local/Global Switch */}
                <div className="flex items-center gap-2">
                    <span className="text-sm">{user?.location?.name || 'Local'}</span>
                    <label className="inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={!useLocal}
                            onChange={() => setUseLocal((v) => !v)}
                            className="sr-only"
                        />
                        <div className="relative w-10 h-5 bg-gray-300 rounded-full shadow-inner">
                            <div
                                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                    useLocal ? '' : 'translate-x-5'
                                }`}
                            />
                        </div>
                    </label>
                    <span className="text-sm">Global</span>
                </div>
            </div>

            {/* Status */}
            {loading && <p className="text-center text-gray-500">Loading...</p>}
            {error && <p className="text-center text-red-500">{error}</p>}

            {/* Stacked List */}
            <ul role="list" className="divide-y divide-gray-200 dark:divide-white/10 mt-4">
                {leaderboard.map((entry) => (
                    <li
                        key={entry.id}
                        className="flex justify-between gap-x-6 py-5 px-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded"
                        onClick={() => navigate(`/user/${entry.id}`)}
                    >
                        <div className="flex min-w-0 gap-x-4">
                            <UserCard
                                user={{ ...entry, kudos: entry.totalKudos } as any as UserDTO}
                                large
                                triggerVariant="avatar-name"
                                subtitle={entry.location?.name || '—'}
                                centered={false}
                                subtitleClassName="max-w-[180px]"
                            />
                        </div>

                        <div className="hidden shrink-0 sm:flex sm:flex-col sm:items-end">
                            <p className="text-sm text-gray-900 dark:text-white">
                                {entry.totalKudos.toLocaleString()} Kudos
                            </p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
