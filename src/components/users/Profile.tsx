import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    UserDTO,
    PostDTO,
    HandshakeDTO,
    EventDTO
} from '@/shared/api/types';
import { FiltersEnum, FilterType, getFilters } from '@/shared/constants';

import { useAuth } from '@/hooks/useAuth';
import ProfileHeader from '@/components/users/ProfileHeader';
import PostCard from '@/components/posts/PostCard';
import EditProfile from '@/components/users/EditProfile';
import Handshakes from '@/components/handshakes/Handshakes';
import { createDMChannel } from '@/shared/api/actions';
import EventCard from '../events/EventCard';

type Props = {
    user: UserDTO;
    posts: PostDTO[];
    handshakes: HandshakeDTO[];
    events: EventDTO[];
    setUser?: (user: UserDTO) => void;
};

const Profile: React.FC<Props> = ({
    user,
    posts,
    handshakes,
    events,
    setUser
}) => {
    const { user: currentUser, token } = useAuth();
    const navigate = useNavigate();

    const isSelf = currentUser?.id === user.id;
    const [editing, setEditing] = useState(false);
    const Filters = getFilters(isSelf);
    const [filter, setFilter] = useState<FilterType>(Filters[0]);

    const handleStartDM = async () => {
        if (!currentUser?.id || !user?.id) return;
        try {
            await createDMChannel(currentUser.id, user.id, token);
            navigate(`/dms/${user.id}`);
        }
        catch (err) {
            console.error('Failed to create or get DM channel', err);
            alert('Failed to start a direct message. Please try again.');
        }
    };

    if (editing) {
        return (
            <EditProfile
                targetUser={user}
                userSettings={user.settings}
                onClose={() => setEditing(false)}
                setTargetUser={setUser}
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

            {/* Filter Buttons */}
            <div className='flex gap-4 justify-center'>
                {Filters.map(
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
            {filter === FiltersEnum.RequestsGifts ? (
                <div className='grid gap-4'>
                    {handshakes.length === 0 ? (
                        <p className='text-center text-gray-500'>
                            No requests / gift responses available.
                        </p>
                    ) : (
                        <Handshakes
                            handshakes={handshakes}
                            sender={user}
                            currentUserId={user.id}
                            showAll={true}
                            onShowAll={() => {
                                console.log('Show all handshakes');
                            }}
                            showPostDetails
                        />

                    )}
                </div>
            ) : filter === 'events' ? (
                <div className='grid gap-4 list-none'>
                    {events.length === 0 ? (
                        <p className='text-center text-gray-500'>
                            No events available.
                        </p>
                    ) : (
                        events.map((event) => (
                            <EventCard key={event.id} event={event} />
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
                            <PostCard key={post.id} {...post} showHandshakeShortcut />
                        ))}
                </div>
            )}
        </div>
    );
};

export default Profile;
