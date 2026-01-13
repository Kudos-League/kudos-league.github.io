import React, { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useSearchPostsQuery } from '@/shared/api/queries/posts';
import { useSearchUsersQuery } from '@/shared/api/queries/users';
import { useEvents } from '@/shared/api/queries/events';
import { X, ArrowLeft, MapPin, Clock, Users, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import UserCard from '@/components/users/UserCard';
import EventCard from '@/components/events/EventCard';
import PostsInfinite from '@/components/posts/PostsInfinite';
import Button from '@/components/common/Button';
import { useAuth } from '@/contexts/useAuth';

type SearchFilterType = 'posts' | 'users' | 'events';
type PostFilterType = 'all' | 'gifts' | 'requests';
type OrderType = 'date' | 'distance' | 'kudos';
type TypeOfOrdering = { type: OrderType; order: 'asc' | 'desc' };
type EventLocationType = 'all' | 'local' | 'global';
type EventTimeType = 'all' | 'today' | 'week' | 'month';

export default function SearchPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const queryParam = searchParams.get('q') || '';
    const filterParam = (searchParams.get('filter') ||
        'posts') as SearchFilterType;
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

    // Event filters
    const [eventLocation, setEventLocation] =
        React.useState<EventLocationType>('all');
    const [eventTime, setEventTime] = React.useState<EventTimeType>('all');
    const [timeDropdownOpen, setTimeDropdownOpen] = React.useState(false);

    const debouncedSearch = useDebouncedValue(searchText, 300);

    // Use immediate search when forceSearch is true, otherwise use debounced
    const effectiveSearch = forceSearch ? searchText : debouncedSearch;

    // Always show filters immediately if there's search text
    const searchingActive =
        effectiveSearch.length >= 2 ||
        (forceSearch && effectiveSearch.length >= 1);

    const { data: searchResults = [], isFetching: searching } =
        useSearchPostsQuery(effectiveSearch);

    const { data: userSearchResults = [], isFetching: searchingUsers } =
        useSearchUsersQuery(effectiveSearch);

    const { data: allEvents = [] } = useEvents();

    // Filter events client-side based on search text
    const eventSearchResults = useMemo(() => {
        if (!searchingActive) return [];
        const searchLower = effectiveSearch.toLowerCase();
        let filtered = allEvents.filter(
            (event) =>
                event.title.toLowerCase().includes(searchLower) ||
                event.description.toLowerCase().includes(searchLower) ||
                event.location?.name?.toLowerCase().includes(searchLower)
        );

        // Apply location filter
        if (eventLocation === 'local') {
            filtered = filtered.filter((event) => !event.isGlobal);
        }
        else if (eventLocation === 'global') {
            filtered = filtered.filter((event) => event.isGlobal);
        }

        // Apply time filter
        if (eventTime !== 'all') {
            const now = new Date();
            const today = new Date(now);
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const weekStart = new Date(today);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 7);

            const monthStart = new Date(
                today.getFullYear(),
                today.getMonth(),
                1
            );
            const monthEnd = new Date(
                today.getFullYear(),
                today.getMonth() + 1,
                1
            );

            filtered = filtered.filter((event) => {
                const startTime = new Date(event.startTime);
                const endTime = event.endTime ? new Date(event.endTime) : null;

                if (eventTime === 'today') {
                    return (
                        (startTime >= today && startTime < tomorrow) ||
                        (endTime && endTime >= today && startTime < tomorrow)
                    );
                }
                else if (eventTime === 'week') {
                    return (
                        (startTime >= weekStart && startTime < weekEnd) ||
                        (endTime && endTime >= weekStart && startTime < weekEnd)
                    );
                }
                else if (eventTime === 'month') {
                    return (
                        (startTime >= monthStart && startTime < monthEnd) ||
                        (endTime &&
                            endTime >= monthStart &&
                            startTime < monthEnd)
                    );
                }
                return true;
            });
        }

        return filtered;
    }, [effectiveSearch, allEvents, searchingActive, eventLocation, eventTime]);

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
        const hasUserLocation = user?.location?.latitude && user?.location?.longitude;
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
                const kudosA = a.kudos || 0;
                const kudosB = b.kudos || 0;
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
    function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Radius of the Earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in km
        return distance;
    }

    // Update URL when search changes
    useEffect(() => {
        if (searchText) {
            const params = new URLSearchParams();
            params.set('q', searchText);
            if (searchFilter !== 'posts') {
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
                <div className='relative'>
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
            </div>

            {searchingActive ? (
                <div className='space-y-4'>
                    {/* Search Filter Tabs */}
                    <div className='flex items-center gap-2 border-b border-gray-200 dark:border-zinc-700 pb-2 flex-wrap'>
                        <button
                            onClick={() => setSearchFilter('posts')}
                            className={`text-sm px-4 py-2 rounded-full transition-all duration-200 ${
                                searchFilter === 'posts'
                                    ? 'bg-brand-600 dark:bg-brand-500 text-white font-semibold shadow-sm'
                                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                            }`}
                        >
                            Posts
                            <span className='ml-1.5 text-xs opacity-80'>
                                ({searchResults.length})
                            </span>
                        </button>
                        <button
                            onClick={() => setSearchFilter('users')}
                            className={`text-sm px-4 py-2 rounded-full transition-all duration-200 ${
                                searchFilter === 'users'
                                    ? 'bg-brand-600 dark:bg-brand-500 text-white font-semibold shadow-sm'
                                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                            }`}
                        >
                            Users
                            <span className='ml-1.5 text-xs opacity-80'>
                                ({userSearchResults.length})
                            </span>
                        </button>
                    </div>

                    {/* Post Filters */}
                    {searchFilter === 'posts' && (
                        <div className='space-y-3'>
                            <div className='flex flex-wrap items-center gap-2'>
                                <div className='flex flex-wrap gap-2'>
                                    <Button
                                        onClick={() => setPostType('all')}
                                        variant='secondary'
                                        className={`text-sm px-4 py-2 border-2 rounded-lg font-medium transition-all duration-200 ${
                                            postType === 'all'
                                                ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                : 'border-gray-300 dark:border-zinc-700 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
                                        }`}
                                    >
                                        All
                                    </Button>
                                    <Button
                                        onClick={() => setPostType('gifts')}
                                        variant='secondary'
                                        className={`text-sm px-4 py-2 border-2 rounded-lg font-medium transition-all duration-200 ${
                                            postType === 'gifts'
                                                ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                : 'border-gray-300 dark:border-zinc-700 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
                                        }`}
                                    >
                                        Gifts
                                    </Button>
                                    <Button
                                        onClick={() => setPostType('requests')}
                                        variant='secondary'
                                        className={`text-sm px-4 py-2 border-2 rounded-lg font-medium transition-all duration-200 ${
                                            postType === 'requests'
                                                ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                : 'border-gray-300 dark:border-zinc-700 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
                                        }`}
                                    >
                                        Requests
                                    </Button>
                                </div>

                                <div className='relative md:ml-auto'>
                                    <button
                                        onClick={() =>
                                            setOrderFilterOpen((v) => !v)
                                        }
                                        className='flex items-center gap-2 px-4 py-2 text-sm font-medium border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors'
                                    >
                                        Order by:{' '}
                                        {typeOfOrdering.type === 'date' &&
                                        typeOfOrdering.order === 'desc'
                                            ? 'Newest'
                                            : typeOfOrdering.type === 'date' &&
                                                typeOfOrdering.order === 'asc'
                                                ? 'Oldest'
                                                : typeOfOrdering.type ===
                                                  'distance'
                                                    ? 'Closest'
                                                    : 'Most Kudos'}
                                        <ChevronDown
                                            className={`w-4 h-4 transition-transform ${orderFilterOpen ? 'rotate-180' : ''}`}
                                        />
                                    </button>
                                    {orderFilterOpen && (
                                        <>
                                            <div
                                                className='fixed inset-0 z-10'
                                                onClick={() =>
                                                    setOrderFilterOpen(false)
                                                }
                                            />
                                            <div className='absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-lg z-20 overflow-hidden'>
                                                <button
                                                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                                                        typeOfOrdering.type ===
                                                            'date' &&
                                                        typeOfOrdering.order ===
                                                            'desc'
                                                            ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 font-medium'
                                                            : 'text-zinc-700 dark:text-zinc-300'
                                                    }`}
                                                    onClick={() => {
                                                        setTypeOfOrdering({
                                                            type: 'date',
                                                            order: 'desc'
                                                        });
                                                        setShowLocationWarning(
                                                            false
                                                        );
                                                        setOrderFilterOpen(
                                                            false
                                                        );
                                                    }}
                                                >
                                                    Newest
                                                </button>
                                                <button
                                                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                                                        typeOfOrdering.type ===
                                                            'date' &&
                                                        typeOfOrdering.order ===
                                                            'asc'
                                                            ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 font-medium'
                                                            : 'text-zinc-700 dark:text-zinc-300'
                                                    }`}
                                                    onClick={() => {
                                                        setTypeOfOrdering({
                                                            type: 'date',
                                                            order: 'asc'
                                                        });
                                                        setShowLocationWarning(
                                                            false
                                                        );
                                                        setOrderFilterOpen(
                                                            false
                                                        );
                                                    }}
                                                >
                                                    Oldest
                                                </button>
                                                <button
                                                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                                                        typeOfOrdering.type ===
                                                        'distance'
                                                            ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 font-medium'
                                                            : 'text-zinc-700 dark:text-zinc-300'
                                                    }`}
                                                    onClick={() => {
                                                        if (
                                                            !user?.location
                                                                ?.latitude ||
                                                            !user?.location
                                                                ?.longitude
                                                        ) {
                                                            setShowLocationWarning(
                                                                true
                                                            );
                                                            setOrderFilterOpen(
                                                                false
                                                            );
                                                            return;
                                                        }
                                                        setTypeOfOrdering({
                                                            type: 'distance',
                                                            order: 'asc'
                                                        });
                                                        setShowLocationWarning(
                                                            false
                                                        );
                                                        setOrderFilterOpen(
                                                            false
                                                        );
                                                    }}
                                                >
                                                    Closest
                                                </button>
                                                <button
                                                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                                                        typeOfOrdering.type ===
                                                        'kudos'
                                                            ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 font-medium'
                                                            : 'text-zinc-700 dark:text-zinc-300'
                                                    }`}
                                                    onClick={() => {
                                                        setTypeOfOrdering({
                                                            type: 'kudos',
                                                            order: 'desc'
                                                        });
                                                        setShowLocationWarning(
                                                            false
                                                        );
                                                        setOrderFilterOpen(
                                                            false
                                                        );
                                                    }}
                                                >
                                                    Most Kudos
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
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

                    {/* Event Filters */}
                    {searchFilter === 'events' && (
                        <div className='flex flex-wrap items-center gap-2'>
                            <div className='flex flex-wrap gap-2'>
                                <Button
                                    onClick={() => setEventLocation('all')}
                                    variant='secondary'
                                    className={`text-sm px-4 py-2 border-2 rounded-lg font-medium transition-all duration-200 ${
                                        eventLocation === 'all'
                                            ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                            : 'border-gray-300 dark:border-zinc-700 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
                                    }`}
                                >
                                    All Locations
                                </Button>
                                <Button
                                    onClick={() => setEventLocation('local')}
                                    variant='secondary'
                                    className={`text-sm px-4 py-2 border-2 rounded-lg font-medium transition-all duration-200 ${
                                        eventLocation === 'local'
                                            ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                            : 'border-gray-300 dark:border-zinc-700 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
                                    }`}
                                >
                                    Local
                                </Button>
                                <Button
                                    onClick={() => setEventLocation('global')}
                                    variant='secondary'
                                    className={`text-sm px-4 py-2 border-2 rounded-lg font-medium transition-all duration-200 ${
                                        eventLocation === 'global'
                                            ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                            : 'border-gray-300 dark:border-zinc-700 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
                                    }`}
                                >
                                    Global
                                </Button>
                            </div>

                            <div className='ml-auto relative'>
                                <button
                                    onClick={() =>
                                        setTimeDropdownOpen(!timeDropdownOpen)
                                    }
                                    className='text-base sm:text-sm px-4 py-3 sm:py-2 border-2 rounded-lg font-medium transition-all duration-200 border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:border-gray-400 focus:outline-none focus:border-blue-500 min-w-[140px] text-left flex items-center justify-between'
                                >
                                    <span>
                                        {eventTime === 'all' && 'All Time'}
                                        {eventTime === 'today' && 'Today'}
                                        {eventTime === 'week' && 'This Week'}
                                        {eventTime === 'month' && 'This Month'}
                                    </span>
                                    <svg
                                        className='w-4 h-4 ml-2'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M19 9l-7 7-7-7'
                                        />
                                    </svg>
                                </button>
                                {timeDropdownOpen && (
                                    <>
                                        <div
                                            className='fixed inset-0 z-10'
                                            onClick={() =>
                                                setTimeDropdownOpen(false)
                                            }
                                        />
                                        <div className='absolute right-0 mt-2 w-full min-w-[200px] bg-white dark:bg-zinc-800 border-2 border-gray-300 dark:border-zinc-700 rounded-lg shadow-xl z-20'>
                                            {[
                                                {
                                                    value: 'all',
                                                    label: 'All Time'
                                                },
                                                {
                                                    value: 'today',
                                                    label: 'Today'
                                                },
                                                {
                                                    value: 'week',
                                                    label: 'This Week'
                                                },
                                                {
                                                    value: 'month',
                                                    label: 'This Month'
                                                }
                                            ].map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        setEventTime(
                                                            option.value as EventTimeType
                                                        );
                                                        setTimeDropdownOpen(
                                                            false
                                                        );
                                                    }}
                                                    className={`w-full text-left px-4 py-4 text-lg sm:text-base font-medium transition-colors ${
                                                        eventTime ===
                                                        option.value
                                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                                            : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700'
                                                    } first:rounded-t-lg last:rounded-b-lg`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Search Results */}
                    <div className='space-y-6'>
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
                                    <PostsInfinite.StaticList
                                        posts={filteredPosts}
                                        loading={false}
                                    />
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
                                {eventSearchResults.length > 0 ? (
                                    <ul className='space-y-2 sm:space-y-3 mb-8'>
                                        {eventSearchResults.map((event) => {
                                            const tz =
                                                Intl.DateTimeFormat().resolvedOptions()
                                                    .timeZone;
                                            return (
                                                <li
                                                    key={event.id}
                                                    onClick={() =>
                                                        navigate(
                                                            `/event/${event.id}`
                                                        )
                                                    }
                                                    className='p-3 sm:p-4 rounded-lg shadow hover:shadow-md cursor-pointer border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors'
                                                >
                                                    <div className='flex items-start justify-between mb-1.5 sm:mb-2'>
                                                        <p className='font-bold text-base sm:text-lg text-gray-900 dark:text-zinc-100'>
                                                            {event.title}
                                                        </p>
                                                        {event.location
                                                            ?.global ? (
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
                                                                    toZonedTime(
                                                                        new Date(
                                                                            event.startTime
                                                                        ),
                                                                        tz
                                                                    ),
                                                                    'MMM d, yyyy • h:mm a'
                                                                )}{' '}
                                                                –{' '}
                                                                {event.endTime
                                                                    ? format(
                                                                        toZonedTime(
                                                                            new Date(
                                                                                event.endTime
                                                                            ),
                                                                            tz
                                                                        ),
                                                                        'MMM d, yyyy • h:mm a'
                                                                    )
                                                                    : 'Ongoing'}
                                                            </span>
                                                        </p>
                                                        {event.location?.name &&
                                                            !event.location
                                                                .global && (
                                                            <p className='text-xs sm:text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5 sm:gap-2'>
                                                                <MapPin className='w-3 h-3 sm:w-4 sm:h-4' />
                                                                {
                                                                    event
                                                                        .location
                                                                        .name
                                                                }
                                                            </p>
                                                        )}
                                                        {event.creator && (
                                                            <div className='text-xs sm:text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5 sm:gap-2'>
                                                                <UserCard
                                                                    user={
                                                                        event.creator
                                                                    }
                                                                    subtitle={`@${event.creator.username || 'user'}`}
                                                                    showKudos={
                                                                        true
                                                                    }
                                                                />
                                                            </div>
                                                        )}
                                                        {typeof event.participantCount ===
                                                            'number' &&
                                                            event.participantCount >
                                                                0 && (
                                                            <p className='text-xs sm:text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1.5 sm:gap-2'>
                                                                <Users className='w-3 h-3 sm:w-4 sm:h-4' />
                                                                {
                                                                    event.participantCount
                                                                }{' '}
                                                                    participant
                                                                {event.participantCount !==
                                                                    1
                                                                    ? 's'
                                                                    : ''}
                                                            </p>
                                                        )}
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : (
                                    <div className='text-center py-12 text-gray-500 dark:text-zinc-400'>
                                        No events found for &quot;{searchText}
                                        &quot;
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
