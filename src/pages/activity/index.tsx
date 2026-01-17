import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Filter,
    FileText,
    Handshake,
    Trophy,
    Search,
    ChevronDown,
    ArrowLeft,
    ArrowUp,
    X
} from 'lucide-react';
import { Clock, MapPin, Users, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

import { useAuth } from '@/contexts/useAuth';
import { EventDTO, HandshakeDTO, PostDTO } from '@/shared/api/types';
import Spinner from '@/components/common/Spinner';
import Button from '@/components/common/Button';
import Handshakes from '@/components/handshakes/Handshakes';
import PostList from '@/components/posts/PostsContainer';
import UserCard from '@/components/users/UserCard';
import { getHandshakeStage } from '@/shared/handshakeUtils';
import { useUserPostsQuery } from '@/shared/api/queries/posts';
import { useUserEventsQuery } from '@/shared/api/queries/events';
import { useUserHandshakesQuery } from '@/shared/api/queries/handshakes';

// Lazy load KudosHistory component outside the main component to prevent re-creation on every render
const KudosHistory = React.lazy(
    () => import('@/components/users/KudosHistory')
);

type FilterType = 'all' | 'posts' | 'events' | 'handshakes' | 'kudos';
type EventFilterType = 'all-events' | 'created-events' | 'participating-events';
type PostFilterType = 'all-posts' | 'gifts' | 'requests';
type HandshakeFilterType =
    | 'all-handshakes'
    | 'new'
    | 'accepted'
    | 'completed'
    | 'cancelled';

export default function Activity() {
    const { user, isLoggedIn } = useAuth();
    const navigate = useNavigate();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // React Query hooks for data fetching with caching
    const {
        data: posts = [],
        isLoading: postsLoading,
        isError: postsError
    } = useUserPostsQuery(user?.id);

    const {
        data: events = [],
        isLoading: eventsLoading,
        isError: eventsError
    } = useUserEventsQuery(user?.id, 'all');

    const {
        data: handshakes = [],
        isLoading: handshakesLoading,
        isError: handshakesError
    } = useUserHandshakesQuery(user?.id);

    // Derived loading/error state
    const loading = postsLoading || eventsLoading || handshakesLoading;
    const error =
        postsError || eventsError || handshakesError
            ? 'Failed to load activity.'
            : null;

    const [filter, setFilter] = useState<FilterType>('all');
    const [eventFilter, setEventFilter] =
        useState<EventFilterType>('all-events');
    const [postFilter, setPostFilter] = useState<PostFilterType>('all-posts');
    const [handshakeFilter, setHandshakeFilter] =
        useState<HandshakeFilterType>('all-handshakes');
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [hideHelperText, setHideHelperText] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Pagination state
    const [postsDisplayLimit, setPostsDisplayLimit] = useState(10);
    const [eventsDisplayLimit, setEventsDisplayLimit] = useState(10);
    const [handshakesDisplayLimit, setHandshakesDisplayLimit] = useState(10);
    const ITEMS_PER_PAGE = 10;

    const availableFilters: FilterType[] = [
        'all',
        'posts',
        'events',
        'handshakes',
        'kudos'
    ];

    // Sort and filter posts chronologically (latest first)
    const sortedPosts = useMemo(() => {
        let filtered = [...posts];

        // Apply post type filter
        if (postFilter === 'gifts') {
            filtered = filtered.filter((p) => p.type === 'gift');
        }
        else if (postFilter === 'requests') {
            filtered = filtered.filter((p) => p.type === 'request');
        }

        // Apply search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (p) =>
                    p.title?.toLowerCase().includes(query) ||
                    p.body?.toLowerCase().includes(query)
            );
        }

        return filtered.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA;
        });
    }, [posts, postFilter, searchQuery]);

    const sortedEvents = useMemo(() => {
        let filtered = [...events];

        // Apply search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (e) =>
                    e.title?.toLowerCase().includes(query) ||
                    e.description?.toLowerCase().includes(query)
            );
        }

        return filtered.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA;
        });
    }, [events, searchQuery]);

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
        let filtered = [...handshakes];

        // Apply handshake status filter
        if (handshakeFilter === 'new') {
            filtered = filtered.filter((h) => h.status === 'new');
        }
        else if (handshakeFilter === 'accepted') {
            filtered = filtered.filter((h) => h.status === 'accepted');
        }
        else if (handshakeFilter === 'completed') {
            filtered = filtered.filter((h) => h.status === 'completed');
        }
        else if (handshakeFilter === 'cancelled') {
            filtered = filtered.filter((h) => h.cancelledAt);
        }
        else {
            // all-handshakes: exclude cancelled by default
            filtered = filtered.filter((h) => !h.cancelledAt);
        }

        // Apply search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (h) =>
                    h.post?.title?.toLowerCase().includes(query) ||
                    h.post?.body?.toLowerCase().includes(query)
            );
        }

        return filtered.sort((a, b) => {
            // Get handshake stage for both handshakes to determine user actions needed
            const stageA = getHandshakeStage(a, user?.id);
            const stageB = getHandshakeStage(b, user?.id);

            // Priority order:
            // 1. User needs to assign kudos (canComplete = true, status = 'accepted')
            // 2. User needs to accept (canAccept = true, status = 'new')
            // 3. Waiting for other user to assign kudos (status = 'accepted', canComplete = false)
            // 4. Waiting for other user to accept (status = 'new', canAccept = false)
            // 5. Completed (status = 'completed')
            // 6. Cancelled (cancelledAt exists)

            const getPriority = (
                h: HandshakeDTO,
                stage: ReturnType<typeof getHandshakeStage>
            ) => {
                if (h.cancelledAt) return 6;
                if (h.status === 'completed') return 5;
                if (h.status === 'accepted' && !stage.canComplete) return 3; // Waiting for other to complete
                if (h.status === 'new' && !stage.canAccept) return 4; // Waiting for other to accept
                if (stage.canComplete) return 1; // User needs to assign kudos
                if (stage.canAccept) return 2; // User needs to accept
                return 7; // Fallback
            };

            const priorityA = getPriority(a, stageA);
            const priorityB = getPriority(b, stageB);

            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }

            // Then sort by date (newest first within same priority)
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA;
        });
    }, [handshakes, handshakeFilter, searchQuery, user?.id]);

    // Reset sub-filters and pagination when main filter changes
    useEffect(() => {
        if (filter !== 'events') {
            setEventFilter('all-events');
        }
        if (filter !== 'posts') {
            setPostFilter('all-posts');
        }
        if (filter !== 'handshakes') {
            setHandshakeFilter('all-handshakes');
        }
        // Reset pagination limits when changing filters
        setPostsDisplayLimit(ITEMS_PER_PAGE);
        setEventsDisplayLimit(ITEMS_PER_PAGE);
        setHandshakesDisplayLimit(ITEMS_PER_PAGE);
        // Close dropdown when filter changes
        setIsDropdownOpen(false);
    }, [filter]);

    // Scroll to top when any filter changes
    useEffect(() => {
        scrollToTop();
    }, [filter, eventFilter, postFilter, handshakeFilter]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Show scroll to top button when scrolled down
    useEffect(() => {
        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    // Check both window scroll and main scroll container
                    const mainContainer = document.querySelector(
                        '.main-scroll-container'
                    );
                    const scrollY = mainContainer?.scrollTop || window.scrollY;

                    const shouldShowScrollTop = scrollY > 300;
                    const shouldHideHelperText = scrollY > 50;

                    // Only update state if values actually changed
                    setShowScrollTop((prev) =>
                        prev !== shouldShowScrollTop
                            ? shouldShowScrollTop
                            : prev
                    );
                    setHideHelperText((prev) =>
                        prev !== shouldHideHelperText
                            ? shouldHideHelperText
                            : prev
                    );

                    ticking = false;
                });
                ticking = true;
            }
        };

        // Listen to scroll on both window and main container
        const mainContainer = document.querySelector('.main-scroll-container');

        window.addEventListener('scroll', handleScroll, { passive: true });
        mainContainer?.addEventListener('scroll', handleScroll, {
            passive: true
        });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            mainContainer?.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const scrollToTop = () => {
        // Scroll the main container if it exists, otherwise scroll window
        const mainContainer = document.querySelector('.main-scroll-container');
        if (mainContainer) {
            mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
        }
        else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

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

    const getCurrentSubFilterLabel = (): string => {
        if (filter === 'handshakes') {
            const newCount = handshakes.filter(
                (h) => h.status === 'new' && !h.cancelledAt
            ).length;
            const acceptedCount = handshakes.filter(
                (h) => h.status === 'accepted' && !h.cancelledAt
            ).length;
            const completedCount = handshakes.filter(
                (h) => h.status === 'completed' && !h.cancelledAt
            ).length;
            const cancelledCount = handshakes.filter(
                (h) => h.cancelledAt
            ).length;
            const totalActiveCount = handshakes.filter(
                (h) => !h.cancelledAt
            ).length;

            switch (handshakeFilter) {
            case 'all-handshakes':
                return `All Active (${totalActiveCount})`;
            case 'new':
                return `Pending (${newCount})`;
            case 'accepted':
                return `Accepted (${acceptedCount})`;
            case 'completed':
                return `Completed (${completedCount})`;
            case 'cancelled':
                return `Cancelled (${cancelledCount})`;
            }
        }

        if (filter === 'events') {
            switch (eventFilter) {
            case 'all-events':
                return `All Events (${sortedEvents.length})`;
            case 'created-events':
                return `Created (${createdEvents.length})`;
            case 'participating-events':
                return `Participating (${participatingEvents.length})`;
            }
        }

        if (filter === 'posts') {
            const giftsCount = posts.filter((p) => p.type === 'gift').length;
            const requestsCount = posts.filter(
                (p) => p.type === 'request'
            ).length;

            switch (postFilter) {
            case 'all-posts':
                return `All Posts (${posts.length})`;
            case 'gifts':
                return `Gifts (${giftsCount})`;
            case 'requests':
                return `Requests (${requestsCount})`;
            }
        }

        return '';
    };

    const getSearchPlaceholder = (): string => {
        if (filter === 'handshakes') {
            switch (handshakeFilter) {
            case 'all-handshakes':
                return 'Search Help Requests';
            case 'new':
                return 'Search Pending Help Requests';
            case 'accepted':
                return 'Search Accepted Help Requests';
            case 'completed':
                return 'Search Completed Help Requests';
            case 'cancelled':
                return 'Search Cancelled Help Requests';
            }
        }

        if (filter === 'events') {
            switch (eventFilter) {
            case 'all-events':
                return 'Search Events';
            case 'created-events':
                return 'Search Created Events';
            case 'participating-events':
                return 'Search Participating Events';
            }
        }

        if (filter === 'posts') {
            switch (postFilter) {
            case 'all-posts':
                return 'Search Posts';
            case 'gifts':
                return 'Search Gifts';
            case 'requests':
                return 'Search Requests';
            }
        }

        return 'Search...';
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

    const renderSubFilters = () => {
        // Handshake sub-filters - only show on larger screens (lg and up)
        if (filter === 'handshakes') {
            const newCount = handshakes.filter(
                (h) => h.status === 'new' && !h.cancelledAt
            ).length;
            const acceptedCount = handshakes.filter(
                (h) => h.status === 'accepted' && !h.cancelledAt
            ).length;
            const completedCount = handshakes.filter(
                (h) => h.status === 'completed' && !h.cancelledAt
            ).length;
            const cancelledCount = handshakes.filter(
                (h) => h.cancelledAt
            ).length;
            const totalActiveCount = handshakes.filter(
                (h) => !h.cancelledAt
            ).length;

            return (
                <div className='hidden lg:flex flex-wrap gap-2 justify-center mt-4'>
                    <Button
                        onClick={() => {
                            setHandshakeFilter('all-handshakes');
                            setHandshakesDisplayLimit(ITEMS_PER_PAGE);
                        }}
                        className={[
                            'px-3 py-1.5 rounded-md border transition-colors text-sm',
                            handshakeFilter === 'all-handshakes'
                                ? '!bg-blue-500 !text-white !border-blue-500'
                                : '!bg-gray-50 dark:!bg-white/5 !text-gray-700 dark:!text-gray-200 !border-gray-200 dark:!border-white/10 hover:!bg-gray-100 dark:hover:!bg-white/10'
                        ].join(' ')}
                    >
                        All Active ({totalActiveCount})
                    </Button>
                    <Button
                        onClick={() => {
                            setHandshakeFilter('new');
                            setHandshakesDisplayLimit(ITEMS_PER_PAGE);
                        }}
                        className={[
                            'px-3 py-1.5 rounded-md border transition-colors text-sm',
                            handshakeFilter === 'new'
                                ? '!bg-blue-500 !text-white !border-blue-500'
                                : '!bg-gray-50 dark:!bg-white/5 !text-gray-700 dark:!text-gray-200 !border-gray-200 dark:!border-white/10 hover:!bg-gray-100 dark:hover:!bg-white/10'
                        ].join(' ')}
                    >
                        Pending ({newCount})
                    </Button>
                    <Button
                        onClick={() => {
                            setHandshakeFilter('accepted');
                            setHandshakesDisplayLimit(ITEMS_PER_PAGE);
                        }}
                        className={[
                            'px-3 py-1.5 rounded-md border transition-colors text-sm',
                            handshakeFilter === 'accepted'
                                ? '!bg-blue-500 !text-white !border-blue-500'
                                : '!bg-gray-50 dark:!bg-white/5 !text-gray-700 dark:!text-gray-200 !border-gray-200 dark:!border-white/10 hover:!bg-gray-100 dark:hover:!bg-white/10'
                        ].join(' ')}
                    >
                        Accepted ({acceptedCount})
                    </Button>
                    <Button
                        onClick={() => {
                            setHandshakeFilter('completed');
                            setHandshakesDisplayLimit(ITEMS_PER_PAGE);
                        }}
                        className={[
                            'px-3 py-1.5 rounded-md border transition-colors text-sm',
                            handshakeFilter === 'completed'
                                ? '!bg-blue-500 !text-white !border-blue-500'
                                : '!bg-gray-50 dark:!bg-white/5 !text-gray-700 dark:!text-gray-200 !border-gray-200 dark:!border-white/10 hover:!bg-gray-100 dark:hover:!bg-white/10'
                        ].join(' ')}
                    >
                        Completed ({completedCount})
                    </Button>
                    <Button
                        onClick={() => {
                            setHandshakeFilter('cancelled');
                            setHandshakesDisplayLimit(ITEMS_PER_PAGE);
                        }}
                        className={[
                            'px-3 py-1.5 rounded-md border transition-colors text-sm',
                            handshakeFilter === 'cancelled'
                                ? '!bg-blue-500 !text-white !border-blue-500'
                                : '!bg-gray-50 dark:!bg-white/5 !text-gray-700 dark:!text-gray-200 !border-gray-200 dark:!border-white/10 hover:!bg-gray-100 dark:hover:!bg-white/10'
                        ].join(' ')}
                    >
                        Cancelled ({cancelledCount})
                    </Button>
                </div>
            );
        }

        // Events sub-filters - only show on larger screens (lg and up)
        if (filter === 'events') {
            return (
                <div className='hidden lg:flex flex-wrap gap-2 justify-center mt-4'>
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
            );
        }

        // Posts sub-filters - only show on larger screens (lg and up)
        if (filter === 'posts') {
            const giftsCount = posts.filter((p) => p.type === 'gift').length;
            const requestsCount = posts.filter(
                (p) => p.type === 'request'
            ).length;

            return (
                <div className='hidden lg:flex flex-wrap gap-2 justify-center mt-4'>
                    <Button
                        onClick={() => {
                            setPostFilter('all-posts');
                            setPostsDisplayLimit(ITEMS_PER_PAGE);
                        }}
                        className={[
                            'px-3 py-1.5 rounded-md border transition-colors text-sm',
                            postFilter === 'all-posts'
                                ? '!bg-blue-500 !text-white !border-blue-500'
                                : '!bg-gray-50 dark:!bg-white/5 !text-gray-700 dark:!text-gray-200 !border-gray-200 dark:!border-white/10 hover:!bg-gray-100 dark:hover:!bg-white/10'
                        ].join(' ')}
                    >
                        All Posts ({posts.length})
                    </Button>
                    <Button
                        onClick={() => {
                            setPostFilter('gifts');
                            setPostsDisplayLimit(ITEMS_PER_PAGE);
                        }}
                        className={[
                            'px-3 py-1.5 rounded-md border transition-colors text-sm',
                            postFilter === 'gifts'
                                ? '!bg-blue-500 !text-white !border-blue-500'
                                : '!bg-gray-50 dark:!bg-white/5 !text-gray-700 dark:!text-gray-200 !border-gray-200 dark:!border-white/10 hover:!bg-gray-100 dark:hover:!bg-white/10'
                        ].join(' ')}
                    >
                        Gifts ({giftsCount})
                    </Button>
                    <Button
                        onClick={() => {
                            setPostFilter('requests');
                            setPostsDisplayLimit(ITEMS_PER_PAGE);
                        }}
                        className={[
                            'px-3 py-1.5 rounded-md border transition-colors text-sm',
                            postFilter === 'requests'
                                ? '!bg-blue-500 !text-white !border-blue-500'
                                : '!bg-gray-50 dark:!bg-white/5 !text-gray-700 dark:!text-gray-200 !border-gray-200 dark:!border-white/10 hover:!bg-gray-100 dark:hover:!bg-white/10'
                        ].join(' ')}
                    >
                        Requests ({requestsCount})
                    </Button>
                </div>
            );
        }

        // No sub-filters for 'all' and 'kudos'
        return null;
    };

    const renderDropdownFilters = () => {
        // Only show dropdown on smaller screens (below lg breakpoint)
        // Handshake sub-filters dropdown
        if (filter === 'handshakes') {
            const newCount = handshakes.filter(
                (h) => h.status === 'new' && !h.cancelledAt
            ).length;
            const acceptedCount = handshakes.filter(
                (h) => h.status === 'accepted' && !h.cancelledAt
            ).length;
            const completedCount = handshakes.filter(
                (h) => h.status === 'completed' && !h.cancelledAt
            ).length;
            const cancelledCount = handshakes.filter(
                (h) => h.cancelledAt
            ).length;
            const totalActiveCount = handshakes.filter(
                (h) => !h.cancelledAt
            ).length;

            return (
                <div className='relative lg:hidden' ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className='flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors text-sm font-medium whitespace-nowrap'
                    >
                        <Filter className='w-4 h-4' />
                        <span className='hidden sm:inline'>
                            {getCurrentSubFilterLabel()}
                        </span>
                        <span className='sm:hidden'>Filter</span>
                        <ChevronDown
                            className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                        />
                    </button>
                    {isDropdownOpen && (
                        <div className='absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700 z-50'>
                            <div className='py-1'>
                                <button
                                    onClick={() => {
                                        setHandshakeFilter('all-handshakes');
                                        setHandshakesDisplayLimit(
                                            ITEMS_PER_PAGE
                                        );
                                        setIsDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-sm ${
                                        handshakeFilter === 'all-handshakes'
                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700'
                                    }`}
                                >
                                    All Active ({totalActiveCount})
                                </button>
                                <button
                                    onClick={() => {
                                        setHandshakeFilter('new');
                                        setHandshakesDisplayLimit(
                                            ITEMS_PER_PAGE
                                        );
                                        setIsDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-sm ${
                                        handshakeFilter === 'new'
                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700'
                                    }`}
                                >
                                    Pending ({newCount})
                                </button>
                                <button
                                    onClick={() => {
                                        setHandshakeFilter('accepted');
                                        setHandshakesDisplayLimit(
                                            ITEMS_PER_PAGE
                                        );
                                        setIsDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-sm ${
                                        handshakeFilter === 'accepted'
                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700'
                                    }`}
                                >
                                    Accepted ({acceptedCount})
                                </button>
                                <button
                                    onClick={() => {
                                        setHandshakeFilter('completed');
                                        setHandshakesDisplayLimit(
                                            ITEMS_PER_PAGE
                                        );
                                        setIsDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-sm ${
                                        handshakeFilter === 'completed'
                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700'
                                    }`}
                                >
                                    Completed ({completedCount})
                                </button>
                                <button
                                    onClick={() => {
                                        setHandshakeFilter('cancelled');
                                        setHandshakesDisplayLimit(
                                            ITEMS_PER_PAGE
                                        );
                                        setIsDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-sm ${
                                        handshakeFilter === 'cancelled'
                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700'
                                    }`}
                                >
                                    Cancelled ({cancelledCount})
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        // Events sub-filters dropdown
        if (filter === 'events') {
            return (
                <div className='relative lg:hidden' ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className='flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors text-sm font-medium whitespace-nowrap'
                    >
                        <Filter className='w-4 h-4' />
                        <span className='hidden sm:inline'>
                            {getCurrentSubFilterLabel()}
                        </span>
                        <span className='sm:hidden'>Filter</span>
                        <ChevronDown
                            className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                        />
                    </button>
                    {isDropdownOpen && (
                        <div className='absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700 z-50'>
                            <div className='py-1'>
                                <button
                                    onClick={() => {
                                        setEventFilter('all-events');
                                        setEventsDisplayLimit(ITEMS_PER_PAGE);
                                        setIsDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-sm ${
                                        eventFilter === 'all-events'
                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700'
                                    }`}
                                >
                                    All Events ({sortedEvents.length})
                                </button>
                                <button
                                    onClick={() => {
                                        setEventFilter('created-events');
                                        setEventsDisplayLimit(ITEMS_PER_PAGE);
                                        setIsDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-sm ${
                                        eventFilter === 'created-events'
                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700'
                                    }`}
                                >
                                    Created ({createdEvents.length})
                                </button>
                                <button
                                    onClick={() => {
                                        setEventFilter('participating-events');
                                        setEventsDisplayLimit(ITEMS_PER_PAGE);
                                        setIsDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-sm ${
                                        eventFilter === 'participating-events'
                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700'
                                    }`}
                                >
                                    Participating ({participatingEvents.length})
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        // Posts sub-filters dropdown
        if (filter === 'posts') {
            const giftsCount = posts.filter((p) => p.type === 'gift').length;
            const requestsCount = posts.filter(
                (p) => p.type === 'request'
            ).length;

            return (
                <div className='relative lg:hidden' ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className='flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors text-sm font-medium whitespace-nowrap'
                    >
                        <Filter className='w-4 h-4' />
                        <span className='hidden sm:inline'>
                            {getCurrentSubFilterLabel()}
                        </span>
                        <span className='sm:hidden'>Filter</span>
                        <ChevronDown
                            className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                        />
                    </button>
                    {isDropdownOpen && (
                        <div className='absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700 z-50'>
                            <div className='py-1'>
                                <button
                                    onClick={() => {
                                        setPostFilter('all-posts');
                                        setPostsDisplayLimit(ITEMS_PER_PAGE);
                                        setIsDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-sm ${
                                        postFilter === 'all-posts'
                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700'
                                    }`}
                                >
                                    All Posts ({posts.length})
                                </button>
                                <button
                                    onClick={() => {
                                        setPostFilter('gifts');
                                        setPostsDisplayLimit(ITEMS_PER_PAGE);
                                        setIsDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-sm ${
                                        postFilter === 'gifts'
                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700'
                                    }`}
                                >
                                    Gifts ({giftsCount})
                                </button>
                                <button
                                    onClick={() => {
                                        setPostFilter('requests');
                                        setPostsDisplayLimit(ITEMS_PER_PAGE);
                                        setIsDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-sm ${
                                        postFilter === 'requests'
                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700'
                                    }`}
                                >
                                    Requests ({requestsCount})
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        return null;
    };

    const renderFilteredContent = () => {
        const showEmptyState =
            sortedPosts.length === 0 &&
            sortedEvents.length === 0 &&
            sortedHandshakes.length === 0;

        if (filter === 'kudos') {
            return (
                <React.Suspense
                    fallback={<Spinner text='Loading kudos history...' />}
                >
                    <div key='kudos-history-wrapper'>
                        <KudosHistory />
                    </div>
                </React.Suspense>
            );
        }

        if (filter === 'handshakes') {
            const displayedHandshakes = sortedHandshakes.slice(
                0,
                handshakesDisplayLimit
            );
            const hasMoreHandshakes =
                sortedHandshakes.length > handshakesDisplayLimit;

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
                                        onClick={() =>
                                            setHandshakesDisplayLimit(
                                                (prev) => prev + ITEMS_PER_PAGE
                                            )
                                        }
                                        variant='secondary'
                                        className='text-sm'
                                    >
                                        Load more (
                                        {sortedHandshakes.length -
                                            handshakesDisplayLimit}{' '}
                                        remaining)
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
                    <ul className='space-y-2 sm:space-y-3 list-none'>
                        {filteredEvents.length === 0 ? (
                            <p className='text-center text-gray-500 dark:text-gray-400'>
                                {eventFilter === 'created-events' &&
                                    'No created events.'}
                                {eventFilter === 'participating-events' &&
                                    'Not participating in any events.'}
                                {eventFilter === 'all-events' &&
                                    'No events available.'}
                            </p>
                        ) : (
                            displayedEvents.map((event) => (
                                <li
                                    key={event.id}
                                    onClick={() =>
                                        navigate(`/event/${event.id}`)
                                    }
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
                                            !event.location.global && (
                                            <p className='text-xs sm:text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5 sm:gap-2'>
                                                <MapPin className='w-3 h-3 sm:w-4 sm:h-4' />
                                                {event.location.name}
                                            </p>
                                        )}
                                        {event.creator && (
                                            <p className='text-xs sm:text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5 sm:gap-2 pb-2 pt-2'>
                                                <UserCard
                                                    user={event.creator}
                                                />
                                            </p>
                                        )}
                                        {typeof event.participantCount ===
                                            'number' &&
                                            event.participantCount > 0 && (
                                            <p className='text-xs sm:text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1.5 sm:gap-2'>
                                                <Users className='w-3 h-3 sm:w-4 sm:h-4' />
                                                {event.participantCount}{' '}
                                                    participant
                                                {event.participantCount !==
                                                    1
                                                    ? 's'
                                                    : ''}
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
                                onClick={() =>
                                    setEventsDisplayLimit(
                                        (prev) => prev + ITEMS_PER_PAGE
                                    )
                                }
                                variant='secondary'
                                className='text-sm'
                            >
                                Load more (
                                {filteredEvents.length - eventsDisplayLimit}{' '}
                                remaining)
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
                                onClick={() =>
                                    setPostsDisplayLimit(
                                        (prev) => prev + ITEMS_PER_PAGE
                                    )
                                }
                                variant='secondary'
                                className='text-sm'
                            >
                                Load more (
                                {sortedPosts.length - postsDisplayLimit}{' '}
                                remaining)
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
                            {createdEvents.length > 0 &&
                                participatingEvents.length > 0 && (
                                <span className='text-sm font-normal text-gray-600 dark:text-gray-400 ml-2'>
                                        ({createdEvents.length} created,{' '}
                                    {participatingEvents.length}{' '}
                                        participating)
                                </span>
                            )}
                        </h3>
                        <ul className='space-y-2 sm:space-y-3 list-none'>
                            {sortedEvents.slice(0, 2).map((event) => (
                                <li
                                    key={event.id}
                                    onClick={() =>
                                        navigate(`/event/${event.id}`)
                                    }
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
                                            !event.location.global && (
                                            <p className='text-xs sm:text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5 sm:gap-2'>
                                                <MapPin className='w-3 h-3 sm:w-4 sm:h-4' />
                                                {event.location.name}
                                            </p>
                                        )}
                                        {event.creator && (
                                            <p className='text-xs sm:text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5 sm:gap-2'>
                                                <UserCard
                                                    user={event.creator}
                                                />
                                            </p>
                                        )}
                                        {typeof event.participantCount ===
                                            'number' &&
                                            event.participantCount > 0 && (
                                            <p className='text-xs sm:text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1.5 sm:gap-2'>
                                                <Users className='w-3 h-3 sm:w-4 sm:h-4' />
                                                {event.participantCount}{' '}
                                                    participant
                                                {event.participantCount !==
                                                    1
                                                    ? 's'
                                                    : ''}
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
        <>
            <div className='max-w-5xl mx-auto px-4 pb-8 pt-5'>
                <div className='bg-white dark:bg-gray-900 border-gray-200 dark:border-white/10 rounded-lg shadow-lg overflow-visible'>
                    <div className='flex items-center gap-3 px-4 sm:px-6 lg:px-8 py-1'>
                        <button
                            onClick={() => navigate(-1)}
                            className='flex items-center gap-2 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors'
                            aria-label='Go back'
                        >
                            <ArrowLeft className='w-5 h-5' />
                            <span className='font-medium'>
                                Back
                            </span>
                        </button>
                    </div>

                    {/* Sticky Filter and Search Section */}
                    <div className='sticky -top-px z-50 bg-white dark:bg-gray-900 px-6 sm:px-8 lg:px-12 py-4 border-b border-gray-200 dark:border-white/10 shadow-md backdrop-blur-sm -mx-4 sm:-mx-6 lg:-mx-8 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] lg:w-[calc(100%+4rem)]'>
                        {/* Filter Buttons */}
                        <div className='w-full mb-4'>
                            <div className='flex w-full border-b border-gray-200 dark:border-zinc-700'>
                                {availableFilters.map((filterType) => {
                                    const isActive = filter === filterType;
                                    return (
                                        <button
                                            key={filterType}
                                            onClick={() =>
                                                setFilter(filterType)
                                            }
                                            className={[
                                                'group',
                                                'flex flex-1',
                                                'flex-col sm:flex-row',
                                                'items-center justify-center',
                                                'gap-1 sm:gap-2',
                                                'py-2 sm:py-2.5',
                                                'text-xs sm:text-sm',
                                                'font-medium',
                                                'transition-colors',
                                                'border-b-2',
                                                '-mb-px',
                                                isActive
                                                    ? 'border-brand-600 text-brand-600 dark:border-brand-300 dark:text-brand-300'
                                                    : 'border-transparent text-gray-500 hover:text-brand-600 dark:text-zinc-400 dark:hover:text-brand-300'
                                            ].join(' ')}
                                        >
                                            {renderFilterIcon(filterType) && (
                                                <span
                                                    className={[
                                                        'transition-opacity',
                                                        isActive
                                                            ? 'opacity-100'
                                                            : 'opacity-70'
                                                    ].join(' ')}
                                                >
                                                    {renderFilterIcon(
                                                        filterType
                                                    )}
                                                </span>
                                            )}
                                            <span className='leading-none sm:inline hidden xs:inline'>
                                                {getFilterLabel(filterType)}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Search Bar and Dropdown Filter */}
                        {filter !== 'kudos' && (
                            <>
                                <div className='w-full flex items-center justify-center gap-2'>
                                    <div className='relative flex-1 max-w-md'>
                                        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500' />
                                        <input
                                            type='text'
                                            placeholder={getSearchPlaceholder()}
                                            value={searchQuery}
                                            onChange={(e) =>
                                                setSearchQuery(e.target.value)
                                            }
                                            className='w-full pl-10 pr-10 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-600 dark:focus:ring-brand-400 focus:border-transparent'
                                        />
                                        {searchQuery && (
                                            <button
                                                onClick={() =>
                                                    setSearchQuery('')
                                                }
                                                className='absolute right-3 top-1/2 transform -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors'
                                                aria-label='Clear search'
                                            >
                                                <X className='w-4 h-4 text-gray-400 dark:text-zinc-500' />
                                            </button>
                                        )}
                                    </div>
                                    {/* Dropdown filter for mobile/tablet */}
                                    {renderDropdownFilters()}
                                </div>
                                {filter === 'all' && (
                                    <p
                                        className={`text-xs text-gray-500 dark:text-gray-400 text-center mt-2 transition-all duration-300 ${
                                            hideHelperText
                                                ? 'opacity-0 max-h-0 mt-0'
                                                : 'opacity-100 max-h-10'
                                        }`}
                                    >
                                        Browse your recent posts, events, and
                                        handshakes
                                    </p>
                                )}
                            </>
                        )}

                        {/* Sub-filters (Posts, Events, Handshakes) - visible only on large screens */}
                        {renderSubFilters()}
                    </div>

                    {/* Filtered Content */}
                    <div className='px-4 sm:px-6 lg:px-8 py-6'>
                        {renderFilteredContent()}
                    </div>
                </div>
            </div>

            {/* Scroll to Top Button */}
            {showScrollTop && (
                <button
                    onClick={scrollToTop}
                    className='fixed bottom-6 left-6 p-3 rounded-full bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white shadow-lg transition-all duration-200 hover:scale-110 z-50'
                    aria-label='Scroll to top'
                >
                    <ArrowUp className='w-5 h-5' />
                </button>
            )}
        </>
    );
}
