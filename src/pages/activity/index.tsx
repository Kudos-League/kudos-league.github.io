import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, Filter, FileText, Handshake, Trophy } from 'lucide-react';
import { Clock, MapPin, Users, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

import { apiGet } from '@/shared/api/apiClient';
import { useAuth } from '@/contexts/useAuth';
import { EventDTO, HandshakeDTO, PostDTO } from '@/shared/api/types';
import Spinner from '@/components/common/Spinner';
import Button from '@/components/common/Button';
import Handshakes from '@/components/handshakes/Handshakes';
import PostList from '@/components/posts/PostsContainer';
import UserCard from '@/components/users/UserCard';

type FilterType = 'all' | 'posts' | 'events' | 'handshakes' | 'kudos';
type EventFilterType = 'all-events' | 'created-events' | 'participating-events';

export default function Activity() {
    const { user, isLoggedIn } = useAuth();
    const navigate = useNavigate();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const [posts, setPosts] = useState<PostDTO[]>([]);
    const [handshakes, setHandshakes] = useState<HandshakeDTO[]>([]);
    const [events, setEvents] = useState<EventDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [filter, setFilter] = useState<FilterType>('all');
    const [eventFilter, setEventFilter] = useState<EventFilterType>('all-events');

    // Pagination state
    const [postsDisplayLimit, setPostsDisplayLimit] = useState(10);
    const [eventsDisplayLimit, setEventsDisplayLimit] = useState(10);
    const [handshakesDisplayLimit, setHandshakesDisplayLimit] = useState(10);
    const ITEMS_PER_PAGE = 10;

    const availableFilters: FilterType[] = ['all', 'posts', 'events', 'handshakes', 'kudos'];

    useEffect(() => {
        const fetchActivity = async () => {
            if (!user?.id) {
                setError('User not logged in.');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const [fetchedPosts, fetchedEvents, sentHandshakes, receivedHandshakes] = await Promise.all([
                    apiGet<PostDTO[]>(`/users/${user.id}/posts`),
                    apiGet<EventDTO[]>(`/users/${user.id}/events`, {
                        params: { filter: 'all' }
                    }),
                    apiGet<HandshakeDTO[]>(`/handshakes/by-sender/${user.id}`),
                    apiGet<HandshakeDTO[]>(`/handshakes/by-receiver/${user.id}`)
                ]);

                setPosts(fetchedPosts);
                setEvents(fetchedEvents);

                // Combine and deduplicate handshakes (by ID)
                const allHandshakes = [...sentHandshakes, ...receivedHandshakes];
                const uniqueHandshakes = Array.from(
                    new Map(allHandshakes.map((h) => [h.id, h])).values()
                );
                setHandshakes(uniqueHandshakes);
                setLoading(false);
            }
            catch (e) {
                console.error(e);
                setError('Failed to load activity.');
                setLoading(false);
            }
        };

        fetchActivity();
    }, [user?.id]);

    // Sort all arrays chronologically (latest first)
    const sortedPosts = useMemo(() => {
        return [...posts].sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA;
        });
    }, [posts]);

    const sortedEvents = useMemo(() => {
        return [...events].sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA;
        });
    }, [events]);

    // Separate events into created and participating
    const createdEvents = useMemo(() => {
        return sortedEvents.filter((event) => event.creatorID === user?.id);
    }, [sortedEvents, user?.id]);

    const participatingEvents = useMemo(() => {
        return sortedEvents.filter((event) => event.creatorID !== user?.id);
    }, [sortedEvents, user?.id]);

    // Filter events based on the selected event filter
    const filteredEvents = useMemo(() => {
        if (eventFilter === 'created-events') return createdEvents;
        if (eventFilter === 'participating-events') return participatingEvents;
        return sortedEvents; // all-events
    }, [eventFilter, createdEvents, participatingEvents, sortedEvents]);

    const sortedHandshakes = useMemo(() => {
        // Status priority: new (pending) > accepted > completed
        const statusPriority: Record<string, number> = {
            new: 0,
            accepted: 1,
            completed: 2
        };

        return [...handshakes]
            .filter((h) => !h.cancelledAt)
            .sort((a, b) => {
                // First sort by status priority
                const priorityA = statusPriority[a.status] ?? 999;
                const priorityB = statusPriority[b.status] ?? 999;

                if (priorityA !== priorityB) {
                    return priorityA - priorityB;
                }

                // Then sort by date (newest first within same status)
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return dateB - dateA;
            });
    }, [handshakes]);

    // Reset event filter and pagination when main filter changes
    useEffect(() => {
        if (filter !== 'events') {
            setEventFilter('all-events');
        }
        // Reset pagination limits when changing filters
        setPostsDisplayLimit(ITEMS_PER_PAGE);
        setEventsDisplayLimit(ITEMS_PER_PAGE);
        setHandshakesDisplayLimit(ITEMS_PER_PAGE);
    }, [filter]);

    const getFilterLabel = (filterType: FilterType): string => {
        const labels: Record<FilterType, string> = {
            all: 'All',
            posts: 'Posts',
            events: 'Events',
            handshakes: 'Handshakes',
            kudos: 'Kudos history'
        };
        return labels[filterType];
    };

    const renderFilterIcon = (filterType: FilterType) => {
        const iconClass = 'w-4 h-4 sm:w-5 sm:h-5';
        switch (filterType) {
        case 'all':
            return <Filter className={iconClass} />;
        case 'posts':
            return <FileText className={iconClass} />;
        case 'events':
            return <Calendar className={iconClass} />;
        case 'handshakes':
            return <Handshake className={iconClass} />;
        case 'kudos':
            return <Trophy className={iconClass} />;
        }
    };

    const renderFilteredContent = () => {
        const showEmptyState =
            sortedPosts.length === 0 &&
            sortedEvents.length === 0 &&
            sortedHandshakes.length === 0;

        if (filter === 'kudos') {
            return (
                <React.Suspense fallback={<Spinner text='Loading kudos history...' />}>
                    <KudosHistory />
                </React.Suspense>
            );
        }

        if (filter === 'handshakes') {
            const displayedHandshakes = sortedHandshakes.slice(0, handshakesDisplayLimit);
            const hasMoreHandshakes = sortedHandshakes.length > handshakesDisplayLimit;

            return (
                <div className='max-w-3xl mx-auto space-y-4'>
                    {sortedHandshakes.length === 0 ? (
                        <p className='text-center text-gray-500 dark:text-gray-400'>
                            No handshakes available.
                        </p>
                    ) : (
                        <>
                            <Handshakes
                                handshakes={displayedHandshakes}
                                currentUserId={user?.id || 0}
                                showAll
                                onShowAll={() => {
                                    console.log('Show all handshakes');
                                }}
                                showPostDetails
                                compact
                            />
                            {hasMoreHandshakes && (
                                <div className='text-center'>
                                    <Button
                                        onClick={() => setHandshakesDisplayLimit(prev => prev + ITEMS_PER_PAGE)}
                                        variant='secondary'
                                        className='text-sm'
                                    >
                                        Load more ({sortedHandshakes.length - handshakesDisplayLimit} remaining)
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            );
        }

        if (filter === 'events') {
            const displayedEvents = filteredEvents.slice(0, eventsDisplayLimit);
            const hasMoreEvents = filteredEvents.length > eventsDisplayLimit;

            return (
                <div className='space-y-4'>
                    {/* Event sub-filter buttons */}
                    <div className='flex flex-wrap gap-2 justify-center'>
                        <Button
                            onClick={() => {
                                setEventFilter('all-events');
                                setEventsDisplayLimit(ITEMS_PER_PAGE);
                            }}
                            className={[
                                'px-3 py-1.5 rounded-md border transition-colors text-sm',
                                eventFilter === 'all-events'
                                    ? '!bg-blue-500 !text-white !border-blue-500'
                                    : '!bg-gray-50 dark:!bg-white/5 !text-gray-700 dark:!text-gray-200 !border-gray-200 dark:!border-white/10 hover:!bg-gray-100 dark:hover:!bg-white/10'
                            ].join(' ')}
                        >
                            All Events ({sortedEvents.length})
                        </Button>
                        <Button
                            onClick={() => {
                                setEventFilter('created-events');
                                setEventsDisplayLimit(ITEMS_PER_PAGE);
                            }}
                            className={[
                                'px-3 py-1.5 rounded-md border transition-colors text-sm',
                                eventFilter === 'created-events'
                                    ? '!bg-blue-500 !text-white !border-blue-500'
                                    : '!bg-gray-50 dark:!bg-white/5 !text-gray-700 dark:!text-gray-200 !border-gray-200 dark:!border-white/10 hover:!bg-gray-100 dark:hover:!bg-white/10'
                            ].join(' ')}
                        >
                            Created ({createdEvents.length})
                        </Button>
                        <Button
                            onClick={() => {
                                setEventFilter('participating-events');
                                setEventsDisplayLimit(ITEMS_PER_PAGE);
                            }}
                            className={[
                                'px-3 py-1.5 rounded-md border transition-colors text-sm',
                                eventFilter === 'participating-events'
                                    ? '!bg-blue-500 !text-white !border-blue-500'
                                    : '!bg-gray-50 dark:!bg-white/5 !text-gray-700 dark:!text-gray-200 !border-gray-200 dark:!border-white/10 hover:!bg-gray-100 dark:hover:!bg-white/10'
                            ].join(' ')}
                        >
                            Participating ({participatingEvents.length})
                        </Button>
                    </div>

                    <ul className='space-y-2 sm:space-y-3 list-none'>
                        {filteredEvents.length === 0 ? (
                            <p className='text-center text-gray-500 dark:text-gray-400'>
                                {eventFilter === 'created-events' && 'No created events.'}
                                {eventFilter === 'participating-events' && 'Not participating in any events.'}
                                {eventFilter === 'all-events' && 'No events available.'}
                            </p>
                        ) : (
                            displayedEvents.map((event) => (
                                <li
                                    key={event.id}
                                    onClick={() => navigate(`/event/${event.id}`)}
                                    className='p-3 sm:p-4 rounded-lg shadow hover:shadow-md cursor-pointer border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors'
                                >
                                    <div className='flex items-start justify-between mb-1.5 sm:mb-2'>
                                        <p className='font-bold text-base sm:text-lg text-gray-900 dark:text-zinc-100'>
                                            {event.title}
                                        </p>
                                        {event.location?.global ? (
                                            <span className='px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-100 text-blue-700 text-[0.65rem] sm:text-xs font-medium rounded whitespace-nowrap ml-2'>
                                                🌐 Global
                                            </span>
                                        ) : (
                                            <span className='px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-100 text-green-700 text-[0.65rem] sm:text-xs font-medium rounded whitespace-nowrap ml-2'>
                                                📍 Local
                                            </span>
                                        )}
                                    </div>
                                    {event.description && (
                                        <p className='text-gray-600 dark:text-zinc-400 text-xs sm:text-sm mb-1.5 sm:mb-2'>
                                            {event.description}
                                        </p>
                                    )}
                                    <div className='space-y-0.5 sm:space-y-1'>
                                        <p className='text-xs sm:text-sm text-gray-700 dark:text-zinc-300 flex items-center gap-1.5 sm:gap-2 mb-2'>
                                            <Clock className='w-3 h-3 sm:w-4 sm:h-4' />
                                            <span className='truncate'>
                                                {format(
                                                    toZonedTime(new Date(event.startTime), tz),
                                                    'MMM d, yyyy • h:mm a'
                                                )}{' '}
                                                –{' '}
                                                {event.endTime
                                                    ? format(
                                                        toZonedTime(new Date(event.endTime), tz),
                                                        'MMM d, yyyy • h:mm a'
                                                    )
                                                    : 'Ongoing'}
                                            </span>
                                        </p>
                                        {event.location?.name && !event.location.global && (
                                            <p className='text-xs sm:text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5 sm:gap-2'>
                                                <MapPin className='w-3 h-3 sm:w-4 sm:h-4' />
                                                {event.location.name}
                                            </p>
                                        )}
                                        {event.creator && (
                                            <p className='text-xs sm:text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5 sm:gap-2 pb-2 pt-2'>
                                                <UserCard user={event.creator} />
                                            </p>
                                        )}
                                        {typeof event.participantCount === 'number' &&
                                            event.participantCount > 0 && (
                                            <p className='text-xs sm:text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1.5 sm:gap-2'>
                                                <Users className='w-3 h-3 sm:w-4 sm:h-4' />
                                                {event.participantCount} participant
                                                {event.participantCount !== 1 ? 's' : ''}
                                            </p>
                                        )}
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                    {hasMoreEvents && (
                        <div className='text-center'>
                            <Button
                                onClick={() => setEventsDisplayLimit(prev => prev + ITEMS_PER_PAGE)}
                                variant='secondary'
                                className='text-sm'
                            >
                                Load more ({filteredEvents.length - eventsDisplayLimit} remaining)
                            </Button>
                        </div>
                    )}
                </div>
            );
        }

        if (filter === 'posts') {
            const displayedPosts = sortedPosts.slice(0, postsDisplayLimit);
            const hasMorePosts = sortedPosts.length > postsDisplayLimit;

            return (
                <div className='space-y-4'>
                    <PostList posts={displayedPosts} showHandshakeShortcut />
                    {hasMorePosts && (
                        <div className='text-center'>
                            <Button
                                onClick={() => setPostsDisplayLimit(prev => prev + ITEMS_PER_PAGE)}
                                variant='secondary'
                                className='text-sm'
                            >
                                Load more ({sortedPosts.length - postsDisplayLimit} remaining)
                            </Button>
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className='space-y-8'>
                {/* Posts Section */}
                {sortedPosts.length > 0 && (
                    <div>
                        <h3 className='text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100'>
                            Posts ({sortedPosts.length})
                        </h3>
                        <PostList
                            posts={sortedPosts.slice(0, 3)}
                            showHandshakeShortcut
                        />
                        {sortedPosts.length > 3 && (
                            <div className='mt-4 text-center'>
                                <Button
                                    onClick={() => setFilter('posts')}
                                    variant='secondary'
                                    className='text-sm'
                                >
                                    View all {sortedPosts.length} posts
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Events Section */}
                {sortedEvents.length > 0 && (
                    <div>
                        <h3 className='text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100'>
                            Events ({sortedEvents.length})
                            {createdEvents.length > 0 && participatingEvents.length > 0 && (
                                <span className='text-sm font-normal text-gray-600 dark:text-gray-400 ml-2'>
                                    ({createdEvents.length} created, {participatingEvents.length}{' '}
                                    participating)
                                </span>
                            )}
                        </h3>
                        <ul className='space-y-2 sm:space-y-3 list-none'>
                            {sortedEvents.slice(0, 2).map((event) => (
                                <li
                                    key={event.id}
                                    onClick={() => navigate(`/event/${event.id}`)}
                                    className='p-3 sm:p-4 rounded-lg shadow hover:shadow-md cursor-pointer border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors'
                                >
                                    <div className='flex items-start justify-between mb-1.5 sm:mb-2'>
                                        <p className='font-bold text-base sm:text-lg text-gray-900 dark:text-zinc-100'>
                                            {event.title}
                                        </p>
                                        {event.location?.global ? (
                                            <span className='px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-100 text-blue-700 text-[0.65rem] sm:text-xs font-medium rounded whitespace-nowrap ml-2'>
                                                🌐 Global
                                            </span>
                                        ) : (
                                            <span className='px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-100 text-green-700 text-[0.65rem] sm:text-xs font-medium rounded whitespace-nowrap ml-2'>
                                                📍 Local
                                            </span>
                                        )}
                                    </div>
                                    {event.description && (
                                        <p className='text-gray-600 dark:text-zinc-400 text-xs sm:text-sm mb-1.5 sm:mb-2'>
                                            {event.description}
                                        </p>
                                    )}
                                    <div className='space-y-0.5 sm:space-y-1'>
                                        <p className='text-xs sm:text-sm text-gray-700 dark:text-zinc-300 flex items-center gap-1.5 sm:gap-2'>
                                            <Clock className='w-3 h-3 sm:w-4 sm:h-4' />
                                            <span className='truncate'>
                                                {format(
                                                    toZonedTime(new Date(event.startTime), tz),
                                                    'MMM d, yyyy • h:mm a'
                                                )}{' '}
                                                –{' '}
                                                {event.endTime
                                                    ? format(
                                                        toZonedTime(new Date(event.endTime), tz),
                                                        'MMM d, yyyy • h:mm a'
                                                    )
                                                    : 'Ongoing'}
                                            </span>
                                        </p>
                                        {event.location?.name && !event.location.global && (
                                            <p className='text-xs sm:text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5 sm:gap-2'>
                                                <MapPin className='w-3 h-3 sm:w-4 sm:h-4' />
                                                {event.location.name}
                                            </p>
                                        )}
                                        {event.creator && (
                                            <p className='text-xs sm:text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5 sm:gap-2'>
                                                <UserCard user={event.creator} />
                                            </p>
                                        )}
                                        {typeof event.participantCount === 'number' &&
                                            event.participantCount > 0 && (
                                            <p className='text-xs sm:text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1.5 sm:gap-2'>
                                                <Users className='w-3 h-3 sm:w-4 sm:h-4' />
                                                {event.participantCount} participant
                                                {event.participantCount !== 1 ? 's' : ''}
                                            </p>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                        {sortedEvents.length > 2 && (
                            <div className='mt-4 text-center'>
                                <Button
                                    onClick={() => setFilter('events')}
                                    variant='secondary'
                                    className='text-sm'
                                >
                                    View all {sortedEvents.length} events
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Handshakes Section */}
                {sortedHandshakes.length > 0 && (
                    <div>
                        <h3 className='text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100'>
                            Handshakes ({sortedHandshakes.length})
                        </h3>
                        <div className='max-w-3xl mx-auto'>
                            <Handshakes
                                handshakes={sortedHandshakes.slice(0, 2)}
                                currentUserId={user?.id || 0}
                                showAll={false}
                                onShowAll={() => setFilter('handshakes')}
                                showPostDetails
                                compact
                            />
                        </div>
                    </div>
                )}

                {/* Empty state for 'All' */}
                {showEmptyState && (
                    <p className='text-center text-gray-500 dark:text-gray-400'>
                        No content available.
                    </p>
                )}
            </div>
        );
    };

    const KudosHistory = React.lazy(() => import('@/components/users/KudosHistory'));

    if (!isLoggedIn) {
        return (
            <div className='text-red-600 text-center mt-10'>
                Please log in to view your activity.
            </div>
        );
    }

    if (loading) {
        return <Spinner text='Loading activity...' variant='fullscreen' />;
    }

    if (error) {
        return <div className='text-red-600 text-center mt-10'>{error}</div>;
    }

    return (
        <div className='max-w-5xl mx-auto px-4 py-8'>
            <button
                onClick={() => navigate(-1)}
                className='mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm'
                aria-label='Go back'
            >
                <ArrowLeftIcon className='w-5 h-5' />
                <span className='font-medium'>Back</span>
            </button>

            <div className='bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg shadow-lg px-4 sm:px-6 lg:px-8 py-8 space-y-6'>
                <h1 className='text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 text-center mb-6'>
                    My Activity
                </h1>

                {/* Filter Buttons */}
                <div className='flex flex-wrap gap-2 sm:gap-3 justify-center px-2'>
                    {availableFilters.map((filterType) => {
                        const active = filter === filterType;
                        return (
                            <Button
                                key={filterType}
                                onClick={() => setFilter(filterType)}
                                className={[
                                    'flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md border transition-colors',
                                    active
                                        ? '!bg-blue-600 !text-white !border-blue-600'
                                        : '!bg-gray-100 dark:!bg-white/5 !text-gray-700 dark:!text-gray-200 !border-gray-200 dark:!border-white/10 hover:!bg-gray-200 dark:hover:!bg-white/10'
                                ].join(' ')}
                            >
                                {/* Mobile: Icon only */}
                                <span className='sm:hidden'>
                                    {renderFilterIcon(filterType)}
                                </span>
                                {/* Desktop: Icon + Text */}
                                <span className='hidden sm:flex items-center gap-2'>
                                    {renderFilterIcon(filterType)}
                                    {getFilterLabel(filterType)}
                                </span>
                            </Button>
                        );
                    })}
                </div>

                {/* Divider under filters */}
                <div className='border-t border-gray-200 dark:border-white/10' />

                {/* Filtered Content */}
                {renderFilteredContent()}
            </div>
        </div>
    );
}
