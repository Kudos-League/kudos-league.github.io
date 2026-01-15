import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MapPin,
    X,
    ChevronDown,
    BookOpen,
    ArrowRight,
    Plus,
    Grid3x3,
    Gift,
    HandHelping,
    ArrowUp
} from 'lucide-react';
import { MagnifyingGlassIcon as MagnifyingGlassIconHeroicons } from '@heroicons/react/24/outline';

import Button from '@/components/common/Button';
import PostsInfinite from '@/components/posts/PostsInfinite';
import Leaderboard from '@/components/Leaderboard';
import { useAuth } from '@/contexts/useAuth';
import { routes } from '@/routes';

// --- Types ---
type PostFilterType = 'all' | 'gifts' | 'requests';
type OrderType = 'date' | 'distance' | 'kudos';
type TypeOfOrdering = { type: OrderType; order: 'asc' | 'desc' };
type ViewType = 'posts' | 'leaderboard';

// --- Sub-components ---

function AboutCTA({
    onDismiss,
    showDismiss = false
}: {
    onDismiss?: () => void;
    showDismiss?: boolean;
}) {
    const navigate = useNavigate();
    return (
        <div className='bg-gradient-to-br from-brand-50 to-blue-50 dark:from-brand-900/20 dark:to-blue-900/20 border border-brand-200 dark:border-brand-800 rounded-xl p-6 shadow-lg'>
            <div className='flex items-start gap-4 mb-4'>
                <div className='hidden sm:flex flex-shrink-0 w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-800 items-center justify-center'>
                    <BookOpen className='w-6 h-6 text-brand-600 dark:text-brand-400' />
                </div>
                <div className='flex-1'>
                    <h3 className='text-xl font-bold text-gray-900 dark:text-gray-100 mb-2'>
                        Welcome to Kudos League!
                    </h3>
                    <p className='text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4'>
                        A community-driven platform for giving and receiving
                        help.
                    </p>
                </div>
            </div>
            <div className='space-y-2'>
                <button
                    onClick={() => navigate(routes.about)}
                    className='w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition-all'
                >
                    <span>Learn More</span>
                    <ArrowRight className='w-5 h-5' />
                </button>
                {showDismiss && onDismiss && (
                    <button
                        onClick={onDismiss}
                        className='w-full text-sm text-gray-500 hover:text-gray-700 py-2'
                    >
                        Don&apos;t show me this message
                    </button>
                )}
            </div>
        </div>
    );
}

/**
 * Unified Filter and Action Bar
 * Centralizes tabs, sort logic, and search/create actions.
 */
function FeedControls({
    activeTab,
    setActiveTab,
    typeOfOrdering,
    setTypeOfOrdering,
    user,
    setShowLocationWarning,
    navigate
}: {
    activeTab: PostFilterType;
    setActiveTab: (val: PostFilterType) => void;
    typeOfOrdering: TypeOfOrdering;
    setTypeOfOrdering: (val: TypeOfOrdering) => void;
    user: any;
    setShowLocationWarning: (val: boolean) => void;
    navigate: any;
}) {
    const [filterOpen, setFilterOpen] = React.useState(false);

    const getSortLabel = () => {
        if (typeOfOrdering.type === 'distance') return 'Closest';
        if (typeOfOrdering.type === 'kudos') return 'Most Kudos';
        return typeOfOrdering.order === 'desc' ? 'Newest' : 'Oldest';
    };

    return (
        <div className='sticky top-0 z-20 pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 bg-white dark:bg-gray-900'>
            {/* Tab Switching */}
            <div className='flex w-full border-b border-zinc-200 dark:border-zinc-700 mb-3'>
                {[
                    { key: 'all', label: 'All', Icon: Grid3x3 },
                    { key: 'gifts', label: 'Gifts', Icon: Gift },
                    { key: 'requests', label: 'Requests', Icon: HandHelping }
                ].map(({ key, label, Icon }) => {
                    const isActive = activeTab === key;
                    return (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key as PostFilterType)}
                            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm font-medium transition-colors border-b-2 -mb-px ${
                                isActive
                                    ? 'border-brand-600 text-brand-600 dark:border-brand-300 dark:text-brand-300'
                                    : 'border-transparent text-zinc-500 hover:text-brand-600'
                            }`}
                        >
                            <Icon
                                className={`w-5 h-5 sm:w-4 sm:h-4 ${isActive ? 'opacity-100' : 'opacity-70'}`}
                            />
                            <span>{label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Action Row */}
            <div className='flex items-center gap-2'>
                {user && (
                    <button
                        onClick={() => navigate(routes.createPost)}
                        className='flex items-center justify-center h-10 w-10 sm:w-auto sm:px-4 shrink-0 border-2 border-brand-600 dark:border-brand-400 text-brand-600 dark:text-brand-400 font-semibold rounded-lg hover:bg-brand-50 transition-all'
                    >
                        <Plus className='w-5 h-5' />
                        <span className='hidden sm:inline ml-2'>Create</span>
                    </button>
                )}

                <button
                    onClick={() => navigate('/search')}
                    className='flex-1 flex items-center gap-2 px-3 h-10 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-400 text-sm text-left'
                >
                    <MagnifyingGlassIconHeroicons className='h-4 w-4 shrink-0' />
                    <span className='truncate'>Search posts...</span>
                </button>

                <div className='relative shrink-0'>
                    <button
                        onClick={() => setFilterOpen(!filterOpen)}
                        className='flex items-center gap-2 px-3 h-10 text-sm font-medium border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900'
                    >
                        <span className='hidden xs:inline'>
                            {getSortLabel()}
                        </span>
                        <ChevronDown
                            className={`w-4 h-4 transition-transform ${filterOpen ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {filterOpen && (
                        <>
                            <div
                                className='fixed inset-0 z-10'
                                onClick={() => setFilterOpen(false)}
                            />
                            <div className='absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl z-20 overflow-hidden'>
                                {[
                                    {
                                        label: 'Newest',
                                        type: 'date',
                                        order: 'desc'
                                    },
                                    {
                                        label: 'Oldest',
                                        type: 'date',
                                        order: 'asc'
                                    },
                                    {
                                        label: 'Closest',
                                        type: 'distance',
                                        order: 'asc'
                                    },
                                    {
                                        label: 'Most Kudos',
                                        type: 'kudos',
                                        order: 'desc'
                                    }
                                ].map((opt) => (
                                    <button
                                        key={opt.label}
                                        className='w-full text-left px-4 py-3 text-sm hover:bg-brand-50 dark:hover:bg-brand-900/20'
                                        onClick={() => {
                                            if (
                                                opt.type === 'distance' &&
                                                !user?.location?.name
                                            ) {
                                                setShowLocationWarning(true);
                                            }
                                            else {
                                                setTypeOfOrdering({
                                                    type: opt.type as OrderType,
                                                    order: opt.order as
                                                        | 'asc'
                                                        | 'desc'
                                                });
                                                setShowLocationWarning(false);
                                            }
                                            setFilterOpen(false);
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
    );
}

// --- Main Feed Component ---

export default function Feed() {
    const navigate = useNavigate();
    const { user } = useAuth();

    // State
    const [activeTab, setActiveTab] = React.useState<PostFilterType>('all');
    const [activeView, setActiveView] = React.useState<ViewType>('posts');
    const [typeOfOrdering, setTypeOfOrdering] = React.useState<TypeOfOrdering>({
        type: 'date',
        order: 'desc'
    });
    const [showLocationWarning, setShowLocationWarning] = React.useState(false);
    const [showScrollTop, setShowScrollTop] = React.useState(false);
    const [aboutCTADismissed, setAboutCTADismissed] = React.useState(() => {
        return typeof window !== 'undefined'
            ? localStorage.getItem('aboutCTA-dismissed') === 'true'
            : false;
    });

    const handleDismissAboutCTA = () => {
        setAboutCTADismissed(true);
        localStorage.setItem('aboutCTA-dismissed', 'true');
    };

    // Scroll Logic
    React.useEffect(() => {
        const scrollContainer = document.querySelector(
            '.main-scroll-container'
        );
        const handleScroll = () => {
            if (scrollContainer)
                setShowScrollTop(scrollContainer.scrollTop > 300);
        };
        scrollContainer?.addEventListener('scroll', handleScroll);
        return () =>
            scrollContainer?.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        document
            .querySelector('.main-scroll-container')
            ?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const apiParams = {
        includeSender: true,
        includeTags: true,
        includeImages: true,
        limit: 10
    } as const;

    return (
        <div className='w-full max-w-7xl mx-auto space-y-2 px-4 sm:px-6'>
            {/* Mobile View Toggler */}
            {user && (
                <div className='lg:hidden flex border-b border-zinc-200 dark:border-zinc-700'>
                    <button
                        onClick={() => setActiveView('posts')}
                        className={`flex-1 py-3 text-sm font-medium ${activeView === 'posts' ? 'text-brand-400 border-b-2 border-brand-400' : 'text-zinc-500'}`}
                    >
                        Posts
                    </button>
                    <button
                        onClick={() => setActiveView('leaderboard')}
                        className={`flex-1 py-3 text-sm font-medium ${activeView === 'leaderboard' ? 'text-brand-400 border-b-2 border-brand-400' : 'text-zinc-500'}`}
                    >
                        Leaderboard
                    </button>
                </div>
            )}

            <div className='flex gap-2 items-start'>
                {/* Primary Content Column */}
                <div className='flex-1 space-y-1 min-w-0'>
                    {/* View: Posts */}
                    {activeView === 'posts' ? (
                        <>
                            {(!user || (user && !aboutCTADismissed)) && (
                                <AboutCTA
                                    showDismiss={!!user}
                                    onDismiss={handleDismissAboutCTA}
                                />
                            )}

                            <FeedControls
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                                typeOfOrdering={typeOfOrdering}
                                setTypeOfOrdering={setTypeOfOrdering}
                                user={user}
                                setShowLocationWarning={setShowLocationWarning}
                                navigate={navigate}
                            />

                            {showLocationWarning && (
                                <div className='bg-blue-50 border border-blue-400 rounded-lg p-4 flex items-start gap-3 dark:bg-blue-900/30'>
                                    <MapPin className='w-5 h-5 text-blue-600 mt-0.5 shrink-0' />
                                    <div className='flex-1'>
                                        <h4 className='font-semibold text-blue-900 dark:text-blue-300'>
                                            Location Required
                                        </h4>
                                        <p className='text-sm text-blue-800 dark:text-blue-400'>
                                            Please set your location in your
                                            profile to sort by distance.
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() =>
                                            setShowLocationWarning(false)
                                        }
                                        variant='secondary'
                                    >
                                        <X className='w-4 h-4' />
                                    </Button>
                                </div>
                            )}

                            <PostsInfinite
                                filters={apiParams}
                                activeTab={activeTab}
                                ordering={typeOfOrdering}
                            />
                        </>
                    ) : (
                        /* View: Leaderboard (Mobile Tab) */
                        <Leaderboard compact />
                    )}
                </div>

                {/* Desktop Sidebar */}
                <div className='hidden lg:block w-80 shrink-0 sticky top-4'>
                    {user ? <Leaderboard compact /> : <AboutCTA />}
                </div>
            </div>

            {/* Back to Top */}
            {showScrollTop && (
                <button
                    onClick={scrollToTop}
                    className='fixed bottom-6 left-6 z-50 p-3 bg-brand-600 text-white rounded-full shadow-2xl hover:scale-110 transition-transform'
                    aria-label='Scroll to top'
                >
                    <ArrowUp className='w-6 h-6' />
                </button>
            )}
        </div>
    );
}
