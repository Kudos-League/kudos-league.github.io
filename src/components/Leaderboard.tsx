import React, { useEffect, useState } from 'react';
import { fetchLeaderboard } from 'shared/api/actions';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import UserCard from '@/components/users/UserCard';
import Button from './common/Button';

type LeaderboardUser = {
    id: number;
    username: string;
    totalKudos: number;
    location?: { name: string };
    avatar?: string;
};

const TIME_FILTERS = [
    { label: 'All Time', value: 'all' },
    { label: 'This Month', value: 'month' },
    { label: 'This Week', value: 'week' }
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

    const getLabel = () =>
        TIME_FILTERS.find((f) => f.value === timeFilter)?.label || 'All Time';

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

    const handleAvatarClick = (id: number) => {
        navigate(`/user/${id}`);
    };

    return (
        <div className='max-w-3xl mx-auto p-6'>
            <h1 className='text-2xl font-bold text-center mb-6'>
                High Score Board
            </h1>

            <div className='flex justify-between items-center mb-4 relative'>
                {/* Time Filter Dropdown */}
                <div className='relative'>
                    <Button
                        onClick={() => setShowDropdown((v) => !v)}
                        className='bg-gray-100 px-4 py-2 rounded-full flex items-center gap-2'
                    >
                        <span>{getLabel()}</span>
                        <span className='text-xs text-gray-500'>▼</span>
                    </Button>

                    {showDropdown && (
                        <div className='absolute top-full mt-1 left-0 bg-white border shadow rounded w-40 z-10'>
                            {TIME_FILTERS.map((filter) => (
                                <Button
                                    key={filter.value}
                                    className={`block w-full px-4 py-2 text-left hover:bg-gray-100 ${
                                        timeFilter === filter.value
                                            ? 'font-semibold text-blue-600'
                                            : ''
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
                            ></div>
                        </div>
                    </label>
                    <span className='text-sm'>Global</span>
                </div>
            </div>

            {/* Status */}
            {loading && <p className='text-center text-gray-500'>Loading...</p>}
            {error && <p className='text-center text-red-500'>{error}</p>}

            {/* Leaderboard List */}
            <div className='space-y-3 mt-4'>
                {leaderboard.map((entry) => (
                    <div
                        key={entry.id}
                        onClick={() => handleAvatarClick(entry.id)}
                        className='flex items-center bg-gray-50 p-4 rounded-lg hover:shadow cursor-pointer'
                    >
 
                        <div className='flex-1 ml-4'>
                            <UserCard
                                userID={entry.id}
                                avatar={entry.avatar}
                                username={entry.username}
                                kudos={entry.totalKudos}
                                large={true}
                            />
                            <p className='text-sm text-gray-500'>
                                {entry.location?.name || ''}
                            </p>
                        </div>

                        <p className='font-semibold text-gray-600'>
                            {entry.totalKudos.toLocaleString()} Kudos
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
