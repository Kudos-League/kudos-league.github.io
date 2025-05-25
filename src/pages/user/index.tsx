import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import {
    getUserDetails,
    getUserEvents,
    getUserHandshakes,
    getUserPosts,
    updateUser
} from 'shared/api/actions';
import Profile from '@/components/profile/Profile';
import { useAuth } from '@/hooks/useAuth';
import { EventDTO, HandshakeDTO, PostDTO, UserDTO } from '@/shared/api/types';

export default function UserProfile() {
    const { user: userProfile, token, isLoggedIn, authState } = useAuth();
    const { id } = useParams<{ id: string }>();

    const targetUserID = id || userProfile?.id;
    const isLoggedInUser = targetUserID === userProfile?.id;

    const [user, setUser] = useState<UserDTO | null>(null);
    const [posts, setPosts] = useState<PostDTO[]>([]);
    const [handshakes, setHandshakes] = useState<HandshakeDTO[]>([]);
    const [events, setEvents] = useState<EventDTO[]>([]);
    const [formState, setFormState] = useState<Partial<UserDTO>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            setError(null);
            if (!targetUserID) {
                setError('Missing user ID to fetch details.');
                return;
            }

            try {
                if (isLoggedInUser && userProfile) {
                    setUser(userProfile);
                    setFormState(userProfile);

                    if (!posts.length && authState?.token) {
                        const [fetchedPosts, fetchedHandshakes, fetchedEvents] =
                            await Promise.all([
                                getUserPosts(
                                    targetUserID.toString(),
                                    authState.token
                                ),
                                getUserHandshakes(
                                    targetUserID.toString(),
                                    authState.token
                                ),
                                getUserEvents(
                                    targetUserID.toString(),
                                    authState.token
                                )
                            ]);

                        setPosts(fetchedPosts);
                        setHandshakes(fetchedHandshakes);
                        setEvents(fetchedEvents);
                    }
                }
                else {
                    if (!authState?.token) {
                        throw new Error('No token available. Please log in.');
                    }

                    const [
                        fetchedUser,
                        fetchedPosts,
                        fetchedHandshakes,
                        fetchedEvents
                    ] = await Promise.all([
                        getUserDetails(
                            targetUserID.toString(),
                            authState.token,
                            {
                                settings: true
                            }
                        ),
                        getUserPosts(targetUserID.toString(), authState.token),
                        getUserHandshakes(
                            targetUserID.toString(),
                            authState.token
                        ),
                        getUserEvents(targetUserID.toString(), authState.token)
                    ]);

                    setUser(fetchedUser);
                    setFormState(fetchedUser);
                    setPosts(fetchedPosts);
                    setHandshakes(fetchedHandshakes);
                    setEvents(fetchedEvents);
                }
            }
            catch (e) {
                console.error(e);
                setError('Failed to load user details.');
            }
        };

        fetchUser();
    }, [targetUserID, isLoggedInUser, authState, userProfile]);

    const handleUpdate = async (formData: Partial<UserDTO>) => {
        if (!formData || !token || !targetUserID) {
            setError('Invalid form data or authentication.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const updatedUser = await updateUser(
                formData,
                targetUserID.toString(),
                token
            );
            setUser(updatedUser);
        }
        catch (e) {
            console.error(e);
            setError('Failed to update user.');
        }
        finally {
            setLoading(false);
        }
    };

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

    return (
        <div className='max-w-5xl mx-auto px-4 py-8'>
            <Profile
                user={user}
                handleUpdate={handleUpdate}
                loading={loading}
                error={error}
                posts={posts}
                handshakes={handshakes}
                events={events}
            />
        </div>
    );
}
