import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { apiGet } from '@/shared/api/apiClient';
import Profile from '@/components/users/Profile';
import { useAuth } from '@/contexts/useAuth';
import { UserDTO } from '@/shared/api/types';

export default function UserProfile() {
    const { user: userProfile, isLoggedIn } = useAuth();
    const { id: routeID } = useParams<{ id: string }>();
    const isViewingOwnProfile = !routeID || Number(routeID) === userProfile?.id;
    const targetUserID = routeID ? Number(routeID) : userProfile?.id;

    const [user, setUser] = useState<UserDTO | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            setError(null);

            if (!targetUserID) {
                setError('Missing user ID.');
                return;
            }

            try {
                if (isViewingOwnProfile && userProfile) {
                    setUser(userProfile);
                }
                else {
                    const fetchedUser = await apiGet<UserDTO>(`/users/${targetUserID}`, {
                        params: { settings: true }
                    });
                    setUser(fetchedUser);
                }
            }
            catch (e) {
                console.error(e);
                setError('Failed to load user details.');
            }
        };

        fetchUser();
    }, [targetUserID, isViewingOwnProfile, userProfile]);

    if (!isLoggedIn) {
        return (
            <div className='text-red-600 text-center mt-10'>
                Please log in to view user details.
            </div>
        );
    }

    if (!user) {
        return (
            <div className='text-red-600 text-center mt-10'>
                Loading user details...
            </div>
        );
    }

    if (error) {
        return <div className='text-red-600 text-center mt-10'>{error}</div>;
    }

    return (
        <div className='max-w-5xl mx-auto px-4 py-8'>
            <Profile user={user} setUser={setUser} />
        </div>
    );
}
