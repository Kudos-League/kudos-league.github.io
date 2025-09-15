import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { apiGet } from '@/shared/api/apiClient';
import Profile from '@/components/users/Profile';
import { useAuth } from '@/contexts/useAuth';
import { EventDTO, HandshakeDTO, PostDTO, UserDTO } from '@/shared/api/types';

export default function UserProfile() {
    const { user: userProfile, isLoggedIn } = useAuth();
    const { id: routeID } = useParams<{ id: string }>();
    const isViewingOwnProfile = !routeID || Number(routeID) === userProfile?.id;
    const targetUserID = routeID ? Number(routeID) : userProfile?.id;

    const [user, setUser] = useState<UserDTO | null>(null);
    const [posts, setPosts] = useState<PostDTO[]>([]);
    const [handshakes, setHandshakes] = useState<HandshakeDTO[]>([]);
    const [events, setEvents] = useState<EventDTO[]>([]);
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
                    // setFormState(userProfile);
                }
                else {
                    const [fetchedUser, fetchedPosts, fetchedEvents] =
                        await Promise.all([
                            apiGet<UserDTO>(`/users/${targetUserID}`, {
                                params: { settings: true }
                            }),
                            apiGet<PostDTO[]>(`/users/${targetUserID}/posts`),
                            apiGet<EventDTO[]>(`/users/${targetUserID}/events`, {
                                params: { filter: 'all' }
                            })
                        ]);

                    setUser(fetchedUser);
                    setPosts(fetchedPosts);
                    setEvents(fetchedEvents);

                    return;
                }

                // Only fetch posts/events if not already loaded
                if (!posts.length) {
                    const [fetchedPosts, fetchedEvents] = await Promise.all([
                        apiGet<PostDTO[]>(`/users/${targetUserID}/posts`),
                        apiGet<EventDTO[]>(`/users/${targetUserID}/events`, {
                            params: { filter: 'all' }
                        })
                    ]);
                    setPosts(fetchedPosts);
                    setEvents(fetchedEvents);
                }

                if (isViewingOwnProfile && !handshakes.length) {
                    const fetchedHandshakes = await apiGet<HandshakeDTO[]>(`/handshakes/by-sender/${targetUserID}`);
                    setHandshakes(fetchedHandshakes);
                }
            }
            catch (e) {
                console.error(e);
                setError('Failed to load user details.');
            }
        };

        fetchUser();
    }, [targetUserID]);

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
            <Profile
                user={user}
                posts={posts}
                handshakes={handshakes}
                events={events}
                setUser={setUser}
            />
        </div>
    );
}
