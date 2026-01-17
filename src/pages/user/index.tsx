import React from 'react';
import { useParams } from 'react-router-dom';

import { useUserQuery } from '@/shared/api/queries/users';
import Profile from '@/components/users/Profile';
import { useAuth } from '@/contexts/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { UserDTO } from '@/shared/api/types';

export default function UserProfile() {
    const { user: userProfile, isLoggedIn } = useAuth();
    const { id: routeID } = useParams<{ id: string }>();
    const isViewingOwnProfile = !routeID || Number(routeID) === userProfile?.id;
    const targetUserID = routeID ? Number(routeID) : userProfile?.id;
    const qc = useQueryClient();

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

    return (
        <div className='max-w-5xl mx-auto px-4 py-8'>
            <Profile user={user} setUser={setUser} />
        </div>
    );
}
