import React, { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useSearchPostsQuery } from '@/shared/api/queries/posts';
import { useSearchUsersQuery } from '@/shared/api/queries/users';
import { useSearchEventsQuery } from '@/shared/api/queries/events';
import { X, ArrowLeft, MapPin, ChevronDown, Grid3x3, Gift, HandHelping } from 'lucide-react';
import UserCard from '@/components/users/UserCard';
import EventCard from '@/components/events/EventCard';
import PostsInfinite from '@/components/posts/PostsInfinite';
import Button from '@/components/common/Button';
import { useAuth } from '@/contexts/useAuth';

type SearchFilterType = 'all' | 'posts' | 'users' | 'events';
type PostFilterType = 'all' | 'gifts' | 'requests';
type OrderType = 'date' | 'distance' | 'kudos';
type TypeOfOrdering = { type: OrderType; order: 'asc' | 'desc' };

export default function SearchPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const queryParam = searchParams.get('q') || '';
    const filterParam = (searchParams.get('filter') ||
        'all') as SearchFilterType;
    const { user } = useAuth();

    const [searchText, setSearchText] = React.useState(queryParam);
    const [searchFilter, setSearchFilter] =
        React.useState<SearchFilterType>(filterParam);
    const [forceSearch, setForceSearch] = React.useState(false);

    // Post filters
    const [postType, setPostType] = React.useState<PostFilterType>('all');
    const [typeOfOrdering, setTypeOfOrdering] = React.useState<TypeOfOrdering>({
        type: 'date',
        order: 'desc'
    });
    const [orderFilterOpen, setOrderFilterOpen] = React.useState(false);
    const [showLocationWarning, setShowLocationWarning] = React.useState(false);

    const debouncedSearch = useDebouncedValue(searchText, 300);

    // Use immediate search when forceSearch is true, otherwise use debounced
    const effectiveSearch = forceSearch ? searchText : debouncedSearch;

    // Always show filters immediately if there's search text
    const searchingActive =
        effectiveSearch.length >= 2 ||
        (forceSearch && effectiveSearch.length >= 1);

    const postsQuery = useSearchPostsQuery(effectiveSearch);
    const searchResults = postsQuery.data?.pages.flat() ?? [];
    const searching = postsQuery.isLoading;

    const { data: userSearchResults = [], isFetching: searchingUsers } =
        useSearchUsersQuery(effectiveSearch);

    const eventsQuery = useSearchEventsQuery(effectiveSearch);
    const eventResults = eventsQuery.data?.pages.flat() ?? [];
    const searchingEvents = eventsQuery.isFetching;

    // Filter and sort posts
    const filteredPosts = useMemo(() => {
        let filtered = searchResults;

        // Filter by type
        if (postType !== 'all') {
            filtered = filtered.filter((post) => {
                if (postType === 'gifts') return post.type === 'gift';
                if (postType === 'requests') return post.type === 'request';
                return true;
            });
        }

        // Calculate distance for each post if user location is available
        const hasUserLocation =
            user?.location?.latitude && user?.location?.longitude;
        const postsWithDistance = hasUserLocation
            ? filtered.map((post) => {
                if (post.location?.latitude && post.location?.longitude) {
                    const distance = getDistance(
                        user.location.latitude,
                        user.location.longitude,
                        post.location.latitude,
                        post.location.longitude
                    );
                    return { ...post, distance };
                }
                return post;
            })
            : filtered;

        // Sort posts
        const sorted = [...postsWithDistance].sort((a, b) => {
            if (typeOfOrdering.type === 'date') {
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return typeOfOrdering.order === 'desc'
                    ? dateB - dateA
                    : dateA - dateB;
            }
            else if (typeOfOrdering.type === 'kudos') {
                const kudosA = a.sender?.kudos || 0;
                const kudosB = b.sender?.kudos || 0;
                return typeOfOrdering.order === 'desc'
                    ? kudosB - kudosA
                    : kudosA - kudosB;
            }
            else if (typeOfOrdering.type === 'distance') {
                // Distance sorting requires user location
                if (!hasUserLocation) return 0;

                const distA = a.distance ?? Infinity;
                const distB = b.distance ?? Infinity;

                return typeOfOrdering.order === 'asc'
                    ? distA - distB
                    : distB - distA;
            }
            return 0;
        });

        return sorted;
    }, [searchResults, postType, typeOfOrdering, user]);

    // Helper function to calculate distance between two coordinates (Haversine formula)
    function getDistance(
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ): number {
        const R = 6371; // Radius of the Earth in km
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in km
        return distance;
    }

    // Update URL when search changes
    useEffect(() => {
        if (searchText) {
            const params = new URLSearchParams();
            params.set('q', searchText);
            if (searchFilter !== 'all') {
                params.set('filter', searchFilter);
            }
            navigate(`/search?${params.toString()}`, { replace: true });
        }
    }, [searchText, searchFilter, navigate]);

    const apiParams = {
        includeSender: true,
        includeTags: true,
        includeImages: true,
        limit: 10
    } as const;

    const totalCount = searchResults.length + userSearchResults.length + eventResults.length;

    return (
        <div className='w-full max-w-4xl mx-auto space-y-4 overflow-x-hidden px-4 sm:px-6 pt-4 mb-2'>
            <div className='flex flex-col gap-4'>
                <div className='flex items-center gap-3'>
                    <button
                        onClick={() => navigate(-1)}
                        className='flex items-center gap-2 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors'
                        aria-label='Go back'
                    >
                        <ArrowLeft className='w-5 h-5' />
                        <span className='font-medium'>Back</span>
                    </button>
                </div>
                <div className='flex items-center gap-2'>
                    <div className='relative flex-1'>
                        <input
                            type='text'
                            placeholder='Search…'
                            value={searchText}
                            onChange={(e) => {
                                setSearchText(e.target.value);
                                // Reset forceSearch when user types
                                if (forceSearch) setForceSearch(false);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && searchText.trim()) {
                                    // Force immediate search by bypassing minimum length requirement
                                    e.preventDefault();
                                    setForceSearch(true);
                                }
                            }}
                            className='w-full border px-3 py-2 pr-10 rounded dark:bg-zinc-800 dark:border-zinc-700'
                            autoFocus
                        />
                        {searchText && (
                            <button
                                onClick={() => setSearchText('')}
                                className='absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors'
                                aria-label='Clear search'
                            >
                                <X className='w-4 h-4 text-gray-500 dark:text-gray-400' />
                            </button>
                        )}
                    </div>

                    {/* Order by dropdown - moved here */}
                    <div className='relative shrink-0'>
                        <button
                            onClick={() => setOrderFilterOpen((v) => !v)}
                            className='flex items-center gap-2 px-3 h-10 text-sm font-medium border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors'
                        >
                            <span className='hidden xs:inline'>
                                {typeOfOrdering.type === 'date' && typeOfOrdering.order === 'desc'
                                    ? 'Newest'
                                    : typeOfOrdering.type === 'date' && typeOfOrdering.order === 'asc'
                                        ? 'Oldest'
                                        : typeOfOrdering.type === 'distance'
                                            ? 'Closest'
                                            : 'Most Kudos'}
                            </span>
                            <ChevronDown
                                className={`w-4 h-4 transition-transform ${orderFilterOpen ? 'rotate-180' : ''}`}
                            />
                        </button>
                        {orderFilterOpen && (
                            <>
                                <div
                                    className='fixed inset-0 z-10'
                                    onClick={() => setOrderFilterOpen(false)}
                                />
                                <div className='absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl z-20 overflow-hidden'>
                                    {[
                                        { label: 'Newest', type: 'date', order: 'desc' },
                                        { label: 'Oldest', type: 'date', order: 'asc' },
                                        { label: 'Closest', type: 'distance', order: 'asc' },
                                        { label: 'Most Kudos', type: 'kudos', order: 'desc' }
                                    ].map((opt) => (
                                        <button
                                            key={opt.label}
                                            className='w-full text-left px-4 py-3 text-sm hover:bg-brand-50 dark:hover:bg-brand-900/20'
                                            onClick={() => {
                                                if (opt.type === 'distance' && (!user?.location?.latitude || !user?.location?.longitude)) {
                                                    setShowLocationWarning(true);
                                                }
                                                else {
                                                    setTypeOfOrdering({
                                                        type: opt.type as OrderType,
                                                        order: opt.order as 'asc' | 'desc'
                                                    });
                                                    setShowLocationWarning(false);
                                                }
                                                setOrderFilterOpen(false);
                                            }}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {searchingActive ? (
                <div className='space-y-4'>
                    {/* Search Filter Tabs */}
                    <div className='flex w-full border-b border-zinc-200 dark:border-zinc-700'>
                        {[
                            { key: 'all', label: 'All', count: totalCount },
                            { key: 'users', label: 'Users', count: userSearchResults.length },
                            { key: 'posts', label: 'Posts', count: searchResults.length },
                            { key: 'events', label: 'Events', count: eventResults.length },
                        ].map(({ key, label, count }) => {
                            const isActive = searchFilter === key;
                            return (
                                <button
                                    key={key}
                                    onClick={() => setSearchFilter(key as SearchFilterType)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                                        isActive
                                            ? 'border-brand-600 text-brand-600 dark:border-brand-300 dark:text-brand-300'
                                            : 'border-transparent text-zinc-500 hover:text-brand-600'
                                    }`}
                                >
                                    <span>{label}</span>
                                    <span className='text-xs opacity-70'>({count})</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Post Filters */}
                    {(searchFilter === 'posts' || searchFilter === 'all') && (
                        <div className='space-y-3'>
                            <div className='flex w-full border-b border-zinc-200 dark:border-zinc-700'>
                                {[
                                    { key: 'all', label: 'All', Icon: Grid3x3 },
                                    { key: 'gifts', label: 'Gifts', Icon: Gift },
                                    { key: 'requests', label: 'Requests', Icon: HandHelping }
                                ].map(({ key, label, Icon }) => {
                                    const isActive = postType === key;
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => setPostType(key as PostFilterType)}
                                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] sm:text-xs font-medium transition-colors border-b-2 -mb-px ${
                                                isActive
                                                    ? 'border-brand-600 text-brand-600 dark:border-brand-300 dark:text-brand-300'
                                                    : 'border-transparent text-zinc-500 hover:text-brand-600'
                                            }`}
                                        >
                                            <Icon
                                                className={`w-3.5 h-3.5 ${isActive ? 'opacity-100' : 'opacity-70'}`}
                                            />
                                            <span>{label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {showLocationWarning && (
                                <div className='bg-blue-50 border border-blue-400 rounded-lg p-4 flex items-start gap-3 dark:bg-blue-900/30 dark:border-blue-800'>
                                    <MapPin className='w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0' />
                                    <div className='flex-1'>
                                        <h4 className='font-semibold text-blue-900 dark:text-blue-300 mb-1'>
                                            Location Required
                                        </h4>
                                        <p className='text-sm text-blue-800 dark:text-blue-400'>
                                            To sort by distance, you need to set
                                            your location in your profile first.
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() =>
                                            setShowLocationWarning(false)
                                        }
                                        variant='secondary'
                                        className='flex-shrink-0'
                                    >
                                        <X className='w-4 h-4' />
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}


                    {/* Search Results */}
                    <div className='space-y-6'>
                        {/* All Results */}
                        {searchFilter === 'all' && (
                            <>
                                {/* Users Section */}
                                {searchingUsers ? (
                                    <div className='text-center py-4 text-gray-500 dark:text-zinc-400'>
                                        Searching users...
                                    </div>
                                ) : userSearchResults.length > 0 && (
                                    <div>
                                        <div className='flex items-center justify-between mb-3'>
                                            <h3 className='text-sm font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wide'>
                                                Users
                                            </h3>
                                            {userSearchResults.length > 5 && (
                                                <button
                                                    onClick={() => setSearchFilter('users')}
                                                    className='text-sm text-brand-600 dark:text-brand-400 hover:underline'
                                                >
                                                    Show all ({userSearchResults.length})
                                                </button>
                                            )}
                                        </div>
                                        <div className='space-y-3 w-full'>
                                            {userSearchResults.slice(0, 5).map((user) => (
                                                <div
                                                    key={user.id}
                                                    className='bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 p-3 hover:shadow-md transition-shadow cursor-pointer'
                                                    onClick={() =>
                                                        navigate(`/user/${user.id}`)
                                                    }
                                                >
                                                    <UserCard
                                                        user={user}
                                                        disableTooltip={true}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Posts Section */}
                                {searching ? (
                                    <div className='text-center py-4 text-gray-500 dark:text-zinc-400'>
                                        Searching posts...
                                    </div>
                                ) : filteredPosts.length > 0 && (
                                    <div>
                                        <div className='flex items-center justify-between mb-3'>
                                            <h3 className='text-sm font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wide'>
                                                Posts
                                            </h3>
                                            {filteredPosts.length > 5 && (
                                                <button
                                                    onClick={() => setSearchFilter('posts')}
                                                    className='text-sm text-brand-600 dark:text-brand-400 hover:underline'
                                                >
                                                    Show all ({filteredPosts.length})
                                                </button>
                                            )}
                                        </div>
                                        <PostsInfinite.StaticList
                                            posts={filteredPosts.slice(0, 5)}
                                            loading={false}
                                        />
                                    </div>
                                )}

                                {/* Events Section */}
                                {searchingEvents ? (
                                    <div className='text-center py-4 text-gray-500 dark:text-zinc-400'>
                                        Searching events...
                                    </div>
                                ) : eventResults.length > 0 && (
                                    <div>
                                        <div className='flex items-center justify-between mb-3'>
                                            <h3 className='text-sm font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wide'>
                                                Events
                                            </h3>
                                            {eventResults.length > 5 && (
                                                <button
                                                    onClick={() => setSearchFilter('events')}
                                                    className='text-sm text-brand-600 dark:text-brand-400 hover:underline'
                                                >
                                                    Show all ({eventResults.length})
                                                </button>
                                            )}
                                        </div>
                                        <ul className='space-y-3 w-full'>
                                            {eventResults.slice(0, 5).map((event) => (
                                                <EventCard key={event.id} event={event} />
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* No results at all */}
                                {!searching && !searchingUsers && !searchingEvents &&
                                    filteredPosts.length === 0 && userSearchResults.length === 0 && eventResults.length === 0 && (
                                    <div className='text-center py-12 text-gray-500 dark:text-zinc-400'>
                                        No results found for &quot;{searchText}&quot;
                                    </div>
                                )}
                            </>
                        )}

                        {/* User Results */}
                        {searchFilter === 'users' && (
                            <>
                                {searchingUsers ? (
                                    <div className='text-center py-8 text-gray-500 dark:text-zinc-400'>
                                        Searching users...
                                    </div>
                                ) : userSearchResults.length > 0 ? (
                                    <div className='space-y-3 w-full'>
                                        {userSearchResults.map((user) => (
                                            <div
                                                key={user.id}
                                                className='bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 p-3 hover:shadow-md transition-shadow cursor-pointer'
                                                onClick={() =>
                                                    navigate(`/user/${user.id}`)
                                                }
                                            >
                                                <UserCard
                                                    user={user}
                                                    disableTooltip={true}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className='text-center py-12 text-gray-500 dark:text-zinc-400'>
                                        No users found for &quot;{searchText}
                                        &quot;
                                    </div>
                                )}
                            </>
                        )}

                        {/* Post Results */}
                        {searchFilter === 'posts' && (
                            <>
                                {searching ? (
                                    <div className='text-center py-8 text-gray-500 dark:text-zinc-400'>
                                        Searching posts...
                                    </div>
                                ) : filteredPosts.length > 0 ? (
                                    <>
                                        <PostsInfinite.StaticList
                                            posts={filteredPosts}
                                            loading={false}
                                        />
                                        {postsQuery.hasNextPage && (
                                            <div className='flex justify-center mt-4'>
                                                <Button
                                                    onClick={() => postsQuery.fetchNextPage()}
                                                    disabled={postsQuery.isFetchingNextPage}
                                                    variant='secondary'
                                                >
                                                    {postsQuery.isFetchingNextPage ? 'Loading...' : 'Load More'}
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className='text-center py-12 text-gray-500 dark:text-zinc-400'>
                                        No posts found for &quot;{searchText}
                                        &quot;
                                    </div>
                                )}
                            </>
                        )}

                        {/* Event Results */}
                        {searchFilter === 'events' && (
                            <>
                                {searchingEvents ? (
                                    <div className='text-center py-8 text-gray-500 dark:text-zinc-400'>
                                        Searching events...
                                    </div>
                                ) : eventResults.length > 0 ? (
                                    <>
                                        <ul className='space-y-3 w-full'>
                                            {eventResults.map((event) => (
                                                <EventCard key={event.id} event={event} />
                                            ))}
                                        </ul>
                                        {eventsQuery.hasNextPage && (
                                            <div className='flex justify-center mt-4'>
                                                <Button
                                                    onClick={() => eventsQuery.fetchNextPage()}
                                                    disabled={eventsQuery.isFetchingNextPage}
                                                    variant='secondary'
                                                >
                                                    {eventsQuery.isFetchingNextPage ? 'Loading...' : 'Load More'}
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className='text-center py-12 text-gray-500 dark:text-zinc-400'>
                                        No events found for &quot;{searchText}&quot;
                                    </div>
                                )}
                            </>
                        )}

                    </div>
                </div>
            ) : (
                <div className='text-center py-12 text-gray-500 dark:text-zinc-400'>
                    Enter at least 2 characters to search
                </div>
            )}
        </div>
    );
}
