import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
    UserDTO,
    PostDTO,
    HandshakeDTO,
    EventDTO,
    ProfileFormValues
} from 'shared/api/types';

import ProfileHeader from './ProfileHeader';
import PostCard from './PostCard';
import HandshakeCard from './HandshakeCard';
import Achievements from './Achievements';
import EditProfile from './EditProfile';
import { useForm } from 'react-hook-form';

type Props = {
    user: UserDTO;
    handleUpdate: (formData: any) => Promise<void>;
    posts: PostDTO[];
    handshakes: HandshakeDTO[];
    events: EventDTO[];
    loading: boolean;
    error: string | null;
};

const Profile: React.FC<Props> = ({
    user,
    handleUpdate,
    posts,
    handshakes,
    events,
    loading,
    error
}) => {
    const { user: currentUser, token } = useAuth();

    const isSelf = currentUser?.id === user.id;
    const [editing, setEditing] = useState(false);
    const [filter, setFilter] = useState<
        'all' | 'gift' | 'request' | 'handshakes' | 'events'
    >('all');

    const form = useForm<ProfileFormValues>({
        defaultValues: {
            email: user.email,
            avatar: [],
            location: user.location || undefined
        }
    });

    const handleStartDM = () => {
        console.log('TODO: navigate to chat DM');
    };

    if (editing) {
        return (
            <EditProfile
                targetUser={user}
                userSettings={user.settings}
                onClose={() => setEditing(false)}
                onSubmit={handleUpdate}
                loading={loading}
                error={error}
                form={form}
            />
        );
    }

    return (
        <div className='max-w-5xl mx-auto px-4 py-8 space-y-8'>
            {/* Header */}
            <ProfileHeader
                user={user}
                userSettings={user.settings}
                isSelf={isSelf}
                onEditProfile={() => setEditing(true)}
                onStartDM={handleStartDM}
            />

            {/* Achievements */}
            <Achievements />

            {/* Filter Buttons */}
            <div className='flex gap-4 justify-center'>
                {['all', 'gift', 'request', 'handshakes', 'events'].map(
                    (type) => (
                        <button
                            key={type}
                            onClick={() => setFilter(type as any)}
                            className={`px-4 py-2 rounded ${
                                filter === type
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700'
                            }`}
                        >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    )
                )}
            </div>

            {/* Filtered Content */}
            {filter === 'handshakes' ? (
                <div className='grid gap-4'>
                    {handshakes.length === 0 ? (
                        <p className='text-center text-gray-500'>
                            No handshakes available.
                        </p>
                    ) : (
                        handshakes.map((handshake) => (
                            <HandshakeCard
                                key={handshake.id}
                                handshake={handshake}
                                userId={user.id.toString()}
                                token={token || ''}
                            />
                        ))
                    )}
                </div>
            ) : filter === 'events' ? (
                <div className='grid gap-4'>
                    {events.length === 0 ? (
                        <p className='text-center text-gray-500'>
                            No events available.
                        </p>
                    ) : (
                        events.map((event) => (
                            <div
                                key={event.id}
                                className='bg-white p-4 rounded shadow hover:shadow-md transition cursor-pointer'
                                onClick={() =>
                                    console.log(
                                        'TODO: Navigate to event',
                                        event.id
                                    )
                                }
                            >
                                <h3 className='text-lg font-bold'>
                                    {event.title}
                                </h3>
                                <p className='text-sm text-gray-600'>
                                    {event.description}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className='grid gap-4 sm:grid-cols-1 md:grid-cols-2'>
                    {posts
                        .filter(
                            (post) => filter === 'all' || post.type === filter
                        )
                        .map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                </div>
            )}
        </div>
    );
};

export default Profile;
