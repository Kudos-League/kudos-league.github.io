import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { UserDTO, PostDTO, HandshakeDTO, EventDTO } from '@/shared/api/types';

import { useAuth } from '@/contexts/useAuth';
import ProfileHeader from '@/components/users/ProfileHeader';
import EditProfile from '@/components/users/edit/EditProfile';
import Handshakes from '@/components/handshakes/Handshakes';
import { createDMChannel, reactivateUser } from '@/shared/api/actions';
import EventCard from '@/components/events/EventCard';
import PostList from '@/components/posts/PostsContainer';
import Button from '../common/Button';
import ReportPastGiftModal from '@/components/users/ReportPastGiftModal';

type FilterType = 'all' | 'posts' | 'events' | 'handshakes';

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

    const [showPastGiftModal, setShowPastGiftModal] = useState(false);
    
    // Define available filters - show handshakes only for own profile
    const availableFilters: FilterType[] = isSelf 
        ? ['all', 'posts', 'events', 'handshakes']
        : ['all', 'posts', 'events'];
        
    const [filter, setFilter] = useState<FilterType>('all');

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

    const getFilterLabel = (filterType: FilterType): string => {
        const labels = {
            all: 'All',
            posts: 'Posts', 
            events: 'Events',
            handshakes: 'Handshakes'
        };
        return labels[filterType];
    };

    const handleReactivate = async () => {
        if (!currentUser?.admin || !user?.id) return;
        const confirmReactivate = window.confirm('Reactivate this account?');
        if (!confirmReactivate) return;
        try {
            const updated = await reactivateUser(user.id, token!);
            setUser?.(updated);
            alert('User reactivated.');
        }
        catch (err) {
            console.error('Failed to reactivate user', err);
            alert('Failed to reactivate user.');
        }
    }

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

    const renderFilteredContent = () => {
        switch (filter) {
        case 'handshakes':
            return (
                <div className='grid gap-4'>
                    {handshakes.length === 0 ? (
                        <p className='text-center text-gray-500 dark:text-gray-400'>
                                No handshakes available.
                        </p>
                    ) : (
                        <Handshakes
                            handshakes={handshakes}
                            currentUserId={user.id}
                            showAll
                            onShowAll={() => {
                                console.log('Show all handshakes');
                            }}
                            showPostDetails
                        />
                    )}
                </div>
            );
                
        case 'events':
            return (
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
            );
                
        case 'posts':
            return (
                <PostList
                    posts={posts}
                    showHandshakeShortcut
                />
            );
                
        case 'all':
        default:
            // Show all content types combined
            return (
                <div className='space-y-8'>
                    {/* Posts Section */}
                    {posts.length > 0 && (
                        <div>
                            <h3 className='text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100'>
                                    Posts ({posts.length})
                            </h3>
                            <PostList
                                posts={posts.slice(0, 3)} // Show first 3
                                showHandshakeShortcut
                            />
                            {posts.length > 3 && (
                                <div className='mt-4 text-center'>
                                    <Button
                                        onClick={() => setFilter('posts')}
                                        variant='secondary'
                                        className='text-sm'
                                    >
                                            View all {posts.length} posts
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                        
                    {/* Events Section */}
                    {events.length > 0 && (
                        <div>
                            <h3 className='text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100'>
                                    Events ({events.length})
                            </h3>
                            <div className='grid gap-4 list-none'>
                                {events.slice(0, 2).map((event) => (
                                    <EventCard key={event.id} event={event} />
                                ))}
                            </div>
                            {events.length > 2 && (
                                <div className='mt-4 text-center'>
                                    <Button
                                        onClick={() => setFilter('events')}
                                        variant='secondary'
                                        className='text-sm'
                                    >
                                            View all {events.length} events
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                        
                    {/* Handshakes Section - Only for own profile */}
                    {isSelf && handshakes.length > 0 && (
                        <div>
                            <h3 className='text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100'>
                                    Handshakes ({handshakes.length})
                            </h3>
                            <Handshakes
                                handshakes={handshakes.slice(0, 2)} // Show first 2
                                currentUserId={user.id}
                                showAll={false}
                                onShowAll={() => setFilter('handshakes')}
                                showPostDetails
                            />
                        </div>
                    )}
                        
                    {/* Empty state for 'All' */}
                    {posts.length === 0 && events.length === 0 && (!isSelf || handshakes.length === 0) && (
                        <p className='text-center text-gray-500 dark:text-gray-400'>
                                No content available.
                        </p>
                    )}
                </div>
            );
        }
    };

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

                {!isSelf && (
                    <div className='flex justify-center'>
                        <Button onClick={() => setShowPastGiftModal(true)} className='!bg-teal-600 !text-white'>
                            Log Past Gift
                        </Button>
                    </div>
                )}

                {currentUser?.admin && !isSelf && user.deactivatedAt && (
                    <div className='flex justify-center'>
                        <div className='bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 rounded-md px-4 py-3 flex items-center gap-3'>
                            <span>This account is deactivated.</span>
                            <button
                                className='px-3 py-1 rounded bg-yellow-600 text-white hover:bg-yellow-700'
                                onClick={handleReactivate}
                            >
                                Reactivate
                            </button>
                        </div>
                    </div>
                )}

                {/* Divider under header */}
                <div className='border-t border-gray-200 dark:border-white/10' />

                {/* Profession */ }
                {user.settings?.profession && (
                    <div className='flex justify-center'>
                        <div className='bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-lg p-4 max-w-md w-full text-center'>
                            <span className='text-sm font-semibold text-gray-700 dark:text-gray-200'>
                                Profession
                            </span>
                            <p className='mt-1 text-gray-700 dark:text-gray-300 text-sm'>
                                {user.settings.profession}
                            </p>
                        </div>
                    </div>
                )}

                {/* Filter Buttons */}
                <div className='flex flex-wrap gap-3 justify-center'>
                    {availableFilters.map((filterType) => {
                        const active = filter === filterType;
                        return (
                            <Button
                                key={filterType}
                                onClick={() => setFilter(filterType)}
                                className={[
                                    'px-4 py-2 rounded-md border transition-colors',
                                    active
                                        ? '!bg-blue-600 !text-white !border-blue-600'
                                        : '!bg-gray-100 dark:!bg-white/5 !text-gray-700 dark:!text-gray-200 !border-gray-200 dark:!border-white/10 hover:!bg-gray-200 dark:hover:!bg-white/10'
                                ].join(' ')}
                            >
                                {getFilterLabel(filterType)}
                            </Button>
                        );
                    })}
                </div>

                {/* Divider under filters */}
                <div className='border-t border-gray-200 dark:border-white/10' />

                {/* Filtered Content */}
                {renderFilteredContent()}

                <ReportPastGiftModal open={showPastGiftModal} onClose={() => setShowPastGiftModal(false)} receiverID={user.id} />
            </div>
        </div>
    );
};

export default Profile;