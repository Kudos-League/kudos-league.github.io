import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { UserDTO, PostDTO, HandshakeDTO, EventDTO } from '@/shared/api/types';
import { FiltersEnum, FilterType, getFilters } from '@/shared/constants';

import { useAuth } from '@/contexts/useAuth';
import ProfileHeader from '@/components/users/ProfileHeader';
import EditProfile from '@/components/users/edit/EditProfile';
import Handshakes from '@/components/handshakes/Handshakes';
import { createDMChannel } from '@/shared/api/actions';
import EventCard from '@/components/events/EventCard';
import PostList from '@/components/posts/PostsContainer';
import Button from '../common/Button';

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
        <div className='max-w-5xl mx-auto'>
            <div className='bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg shadow-lg px-4 sm:px-6 lg:px-8 py-8 space-y-8'>
                <ProfileHeader
                    user={user}
                    userSettings={user.settings}
                    isSelf={isSelf}
                    onEditProfile={() => setEditing(true)}
                    onStartDM={handleStartDM}
                />

                {/* Divider under header */}
                <div className='border-t border-gray-200 dark:border-white/10' />

                {/* Filter Buttons */}
                <div className='flex flex-wrap gap-3 justify-center'>
                    {Filters.map((type) => {
                        const active = filter === type;
                        return (
                            <Button
                                key={type}
                                onClick={() => setFilter(type as any)}
                                className={[
                                    'px-4 py-2 rounded-md border',
                                    active
                                        ? '!bg-blue-600 !text-white !border-blue-600'
                                        : '!bg-gray-100 dark:!bg-white/5 !text-gray-700 dark:!text-gray-200 !border-gray-200 dark:!border-white/10'
                                ].join(' ')}
                            >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </Button>
                        );
                    })}
                </div>

                {/* Divider under filters */}
                <div className='border-t border-gray-200 dark:border-white/10' />

                {/* Filtered Content */}
                {filter === FiltersEnum.RequestsGifts ? (
                    <div className='grid gap-4'>
                        {handshakes.length === 0 ? (
                            <p className='text-center text-gray-500 dark:text-gray-400'>
                                No requests / gift responses available.
                            </p>
                        ) : (
                            <Handshakes
                                handshakes={handshakes}
                                currentUserId={user.id}
                                showAll
                                onShowAll={() => {
                                    console.log('Show all handshakes'); // TODO
                                }}
                                showPostDetails
                            />
                        )}
                    </div>
                ) : filter === 'events' ? (
                    <div className='grid gap-4 list-none'>
                        {events.length === 0 ? (
                            <p className='text-center text-gray-500 dark:text-gray-400'>
                                No events available.
                            </p>
                        ) : (
                            events.map((event) => (
                                <EventCard key={event.id} event={event} />
                            ))
                        )}
                    </div>
                ) : (
                    <PostList
                        posts={posts.filter(
                            (post) => filter === 'all' || post.type === filter
                        )}
                        showHandshakeShortcut
                    />
                )}
            </div>
        </div>
    );
};

export default Profile;
