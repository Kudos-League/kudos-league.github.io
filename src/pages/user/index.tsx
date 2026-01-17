import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Activity as ActivityIcon } from 'lucide-react';

import { useUserQuery } from '@/shared/api/queries/users';
import Profile from '@/components/users/Profile';
import Activity from '@/components/Activity';
import { useAuth } from '@/contexts/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { UserDTO } from '@/shared/api/types';

type ProfileTab = 'profile' | 'activity';

export default function UserProfile() {
    const { user: userProfile, isLoggedIn } = useAuth();
    const { id: routeID } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isViewingOwnProfile = !routeID || Number(routeID) === userProfile?.id;
    const targetUserID = routeID ? Number(routeID) : userProfile?.id;
    const qc = useQueryClient();
    const [activeTab, setActiveTab] = useState<ProfileTab>('profile');

    const { data: fetchedUser, isLoading, error } = useUserQuery(
        isViewingOwnProfile ? undefined : targetUserID,
        { settings: true, enabled: !isViewingOwnProfile && !!targetUserID }
    );

    const user = isViewingOwnProfile ? userProfile : fetchedUser;

    const setUser = (updated: UserDTO) => {
        if (!isViewingOwnProfile && targetUserID) {
            qc.setQueryData(['user', targetUserID], updated);
        }
    };

    if (!isLoggedIn) {
        return (
            <div className='text-red-600 text-center mt-10'>
                Please log in to view user details.
            </div>
        );
    }

    if (isLoading && !isViewingOwnProfile) {
        return (
            <div className='text-gray-600 text-center mt-10'>
                Loading user details...
            </div>
        );
    }

    if (error) {
        return (
            <div className='text-red-600 text-center mt-10'>
                Failed to load user details.
            </div>
        );
    }

    if (!user) {
        return (
            <div className='text-red-600 text-center mt-10'>
                User not found.
            </div>
        );
    }

    // For own profile, just render Profile without tabs
    if (isViewingOwnProfile) {
        return (
            <div className='max-w-5xl mx-auto px-4 py-8'>
                <Profile user={user} setUser={setUser} />
            </div>
        );
    }

    // For other users' profiles, render with tabs
    const tabs: { key: ProfileTab; label: string; icon: React.ReactNode }[] = [
        { key: 'profile', label: 'Profile', icon: <User className='w-4 h-4 sm:w-5 sm:h-5' /> },
        { key: 'activity', label: 'Activity', icon: <ActivityIcon className='w-4 h-4 sm:w-5 sm:h-5' /> }
    ];

    const displayName = user.displayName || user.username || 'User';
    const titleText = `${displayName}'s Profile`;

    return (
        <div className='max-w-5xl mx-auto px-4 py-8'>
            <div className='bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg shadow-lg overflow-visible'>
                {/* Header with back button and title */}
                <div className='flex items-center gap-3 px-4 sm:px-6 lg:px-8 py-3'>
                    <button
                        onClick={() => navigate(-1)}
                        className='flex items-center gap-2 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors shrink-0'
                        aria-label='Go back'
                    >
                        <ArrowLeft className='w-5 h-5' />
                        <span className='font-medium'>Back</span>
                    </button>
                    <h1
                        className='text-gray-900 dark:text-gray-100 font-semibold text-sm sm:text-base truncate max-w-[180px] sm:max-w-none'
                        title={titleText}
                    >
                        {titleText}
                    </h1>
                </div>

                {/* Tab selector */}
                <div className='px-4 sm:px-6 lg:px-8 border-b border-gray-200 dark:border-white/10'>
                    <div className='flex w-full'>
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={[
                                        'group',
                                        'flex flex-1',
                                        'items-center justify-center',
                                        'gap-2',
                                        'py-2.5',
                                        'text-sm',
                                        'font-medium',
                                        'transition-colors',
                                        'border-b-2',
                                        '-mb-px',
                                        isActive
                                            ? 'border-brand-600 text-brand-600 dark:border-brand-300 dark:text-brand-300'
                                            : 'border-transparent text-gray-500 hover:text-brand-600 dark:text-zinc-400 dark:hover:text-brand-300'
                                    ].join(' ')}
                                >
                                    <span
                                        className={[
                                            'transition-opacity',
                                            isActive ? 'opacity-100' : 'opacity-70'
                                        ].join(' ')}
                                    >
                                        {tab.icon}
                                    </span>
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className='py-6'>
                    {activeTab === 'profile' ? (
                        <Profile user={user} setUser={setUser} hideBackButton hideWrapper />
                    ) : (
                        <Activity user={user} hideWrapper />
                    )}
                </div>
            </div>
        </div>
    );
}
