import React from 'react';
import Button from '@/components/common/Button';
import { useNavigate } from 'react-router-dom';
import PostsInfinite from '@/components/posts/PostsInfinite';
import { useAuth } from '@/contexts/useAuth';
import { MapPin, X, ChevronDown, BookOpen, ArrowRight, Plus } from 'lucide-react';
import Leaderboard from '@/components/Leaderboard';
import { routes } from '@/routes';
import { MagnifyingGlassIcon as MagnifyingGlassIconHeroicons } from '@heroicons/react/24/outline';

type PostFilterType = 'all' | 'gifts' | 'requests';
type OrderType = 'date' | 'distance' | 'kudos';
type TypeOfOrdering = { type: OrderType; order: 'asc' | 'desc' };
type ViewType = 'posts' | 'leaderboard';

// Component to show when user is not logged in or as info for logged in users
function AboutCTA({ onDismiss, showDismiss = false }: { onDismiss?: () => void; showDismiss?: boolean }) {
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
                        A community-driven platform for giving and receiving help. Share what you have, request what you need, and build meaningful connections.
                    </p>
                    <ul className='hidden sm:flex sm:flex-col sm:space-y-2 mb-4 text-sm text-gray-600 dark:text-gray-400'>
                        <li className='flex items-start gap-2'>
                            <span className='text-brand-600 dark:text-brand-400 mt-0.5'>✓</span>
                            <span>Give items, skills, or time to others</span>
                        </li>
                        <li className='flex items-start gap-2'>
                            <span className='text-brand-600 dark:text-brand-400 mt-0.5'>✓</span>
                            <span>Request help from our community</span>
                        </li>
                        <li className='flex items-start gap-2'>
                            <span className='text-brand-600 dark:text-brand-400 mt-0.5'>✓</span>
                            <span>Earn kudos points for every contribution</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className='space-y-2'>
                <button
                    onClick={() => navigate(routes.about)}
                    className='w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg'
                >
                    <span>Learn More</span>
                    <ArrowRight className='w-5 h-5' />
                </button>

                {showDismiss && onDismiss && (
                    <button
                        onClick={onDismiss}
                        className='w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 py-2 transition-colors'
                    >
                        Don&apos;t show me this message
                    </button>
                )}
            </div>
        </div>
    );
}

export default function Feed() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = React.useState<PostFilterType>('all');
    const [activeView, setActiveView] = React.useState<ViewType>('posts');
    const [typeOfOrdering, setTypeOfOrdering] = React.useState<TypeOfOrdering>({
        type: 'date',
        order: 'desc'
    });
    const [filterOpen, setFilterOpen] = React.useState(false);
    const [showLocationWarning, setShowLocationWarning] = React.useState(false);
    const [windowWidth, setWindowWidth] = React.useState(
        typeof window !== 'undefined' ? window.innerWidth : 0
    );

    // Track if AboutCTA has been dismissed (for logged-in users)
    const [aboutCTADismissed, setAboutCTADismissed] = React.useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('aboutCTA-dismissed') === 'true';
        }
        return false;
    });

    const handleDismissAboutCTA = () => {
        setAboutCTADismissed(true);
        localStorage.setItem('aboutCTA-dismissed', 'true');
    };

    // Listen for window resize events
    React.useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const apiParams = {
        includeSender: true,
        includeTags: true,
        includeImages: true,
        limit: 10
    } as const;

    return (
        <div className='w-full max-w-7xl mx-auto space-y-4 overflow-x-hidden px-4 sm:px-6 pt-4'>
            {/* Mobile View Tabs - Only show when logged in */}
            {user && (
                <div className='lg:hidden flex border-b border-zinc-200 dark:border-zinc-700 mb-4'>
                    <button
                        onClick={() => setActiveView('posts')}
                        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                            activeView === 'posts'
                                ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 dark:border-brand-400'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                        }`}
                    >
                        Posts
                    </button>
                    <button
                        onClick={() => setActiveView('leaderboard')}
                        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                            activeView === 'leaderboard'
                                ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 dark:border-brand-400'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                        }`}
                    >
                        Leaderboard
                    </button>
                </div>
            )}

            {/* Desktop Layout - Side by Side */}
            <div className='hidden lg:flex gap-6 items-start'>
                {/* Posts Section */}
                <div className='flex-1 space-y-4'>
                    {/* About CTA for logged-in users */}
                    {user && !aboutCTADismissed && (
                        <AboutCTA showDismiss={true} onDismiss={handleDismissAboutCTA} />
                    )}

                    {user && (
                        <button
                            onClick={() => navigate(routes.createPost)}
                            className='w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-brand-600 dark:border-brand-400 text-brand-600 dark:text-brand-400 font-semibold rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950/20 transition-all duration-200 mb-4'
                        >
                            <Plus className='w-5 h-5' />
                            <span>Create Post</span>
                        </button>
                    )}

                    <div className='flex items-center justify-between gap-2 mb-2'>
                        <div className='flex flex-wrap gap-2'>
                            <Button
                                onClick={() => setActiveTab('all')}
                                variant='secondary'
                                className={`text-sm px-4 py-2 border-2 rounded-lg font-medium transition-all duration-200 ${
                                    activeTab === 'all'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                }`}
                            >
                    All
                            </Button>
                            <Button
                                onClick={() => setActiveTab('gifts')}
                                variant='secondary'
                                className={`text-sm px-4 py-2 border-2 rounded-lg font-medium transition-all duration-200 ${
                                    activeTab === 'gifts'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                }`}
                            >
                    Gifts
                            </Button>
                            <Button
                                onClick={() => setActiveTab('requests')}
                                variant='secondary'
                                className={`text-sm px-4 py-2 border-2 rounded-lg font-medium transition-all duration-200 ${
                                    activeTab === 'requests'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                }`}
                            >
                    Requests
                            </Button>
                        </div>

                        <div className='flex items-center gap-2 ml-auto'>
                            <div className='relative'>
                                <button
                                    onClick={() => setFilterOpen((v) => !v)}
                                    className='flex items-center gap-2 px-4 py-2 text-sm font-medium border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors mb-2'
                                >
                                    {windowWidth > 768 ? (
                                        `Order by: ${
                                            typeOfOrdering.type === 'date' && typeOfOrdering.order === 'desc' ? 'Newest' :
                                                typeOfOrdering.type === 'date' && typeOfOrdering.order === 'asc' ? 'Oldest' :
                                                    typeOfOrdering.type === 'distance' ? 'Closest' :
                                                        'Most Kudos'
                                        }`
                                    ) : 'Order'}

                                    <ChevronDown className={`w-4 h-4 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {filterOpen && (
                                    <>
                                        <div
                                            className='fixed inset-0 z-10'
                                            onClick={() => setFilterOpen(false)}
                                        />
                                        <div className={`absolute ${windowWidth >= 373 ? 'right-0' : 'left-0'} mt-2 w-48 max-w-[calc(100vw-2rem)] bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-lg z-20 overflow-hidden`}>
                                            <button
                                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                                                    typeOfOrdering.type === 'date' && typeOfOrdering.order === 'desc'
                                                        ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 font-medium'
                                                        : 'text-zinc-700 dark:text-zinc-300'
                                                }`}
                                                onClick={() => {
                                                    setTypeOfOrdering({ type: 'date', order: 'desc' });
                                                    setShowLocationWarning(false);
                                                    setFilterOpen(false);
                                                }}
                                            >
                                            Newest
                                            </button>
                                            <button
                                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                                                    typeOfOrdering.type === 'date' && typeOfOrdering.order === 'asc'
                                                        ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 font-medium'
                                                        : 'text-zinc-700 dark:text-zinc-300'
                                                }`}
                                                onClick={() => {
                                                    setTypeOfOrdering({ type: 'date', order: 'asc' });
                                                    setShowLocationWarning(false);
                                                    setFilterOpen(false);
                                                }}
                                            >
                                            Oldest
                                            </button>
                                            <button
                                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                                                    typeOfOrdering.type === 'distance'
                                                        ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 font-medium'
                                                        : 'text-zinc-700 dark:text-zinc-300'
                                                }`}
                                                onClick={() => {
                                                    if (!user?.location?.name) {
                                                        setShowLocationWarning(true);
                                                        setFilterOpen(false);
                                                        return;
                                                    }
                                                    setTypeOfOrdering({ type: 'distance', order: 'asc' });
                                                    setShowLocationWarning(false);
                                                    setFilterOpen(false);
                                                }}
                                            >
                                            Closest
                                            </button>
                                            <button
                                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                                                    typeOfOrdering.type === 'kudos'
                                                        ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 font-medium'
                                                        : 'text-zinc-700 dark:text-zinc-300'
                                                }`}
                                                onClick={() => {
                                                    setTypeOfOrdering({ type: 'kudos', order: 'desc' });
                                                    setShowLocationWarning(false);
                                                    setFilterOpen(false);
                                                }}
                                            >
                                            Most Kudos
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Search button - to the right of Order by */}
                            <button
                                onClick={() => navigate('/search')}
                                className='flex sm:hidden h-9 w-9 items-center justify-center rounded-lg bg-white/90 text-zinc-800 shadow-lg backdrop-blur-sm hover:bg-white dark:bg-zinc-800/90 dark:text-zinc-200 dark:hover:bg-zinc-800'
                                aria-label='Search'
                            >
                                <MagnifyingGlassIconHeroicons className='h-5 w-5' />
                            </button>
                        </div>
                    </div>

                    {showLocationWarning && (
                        <div className='bg-blue-50 border border-blue-400 rounded-lg p-4 flex items-start gap-3 dark:bg-blue-900/30 dark:border-blue-800'>
                            <MapPin className='w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0' />
                            <div className='flex-1'>
                                <h4 className='font-semibold text-blue-900 dark:text-blue-300 mb-1'>Location Required</h4>
                                <p className='text-sm text-blue-800 dark:text-blue-400'>
                                    To sort by distance, you need to set your location in your profile first.
                                    Go to your profile, click &quot;Edit&quot;, and add your location.
                                </p>
                            </div>
                            <Button
                                onClick={() => setShowLocationWarning(false)}
                                variant='secondary'
                                className='flex-shrink-0'
                            >
                                <X className='w-4 h-4' />
                            </Button>
                        </div>
                    )}

                    <div className='w-full overflow-x-hidden'>
                        <PostsInfinite
                            filters={apiParams}
                            activeTab={activeTab}
                            ordering={typeOfOrdering}
                        />
                    </div>
                </div>

                {/* Leaderboard Section - Desktop */}
                <div className='w-80 flex-shrink-0'>
                    <div className='fixed top-40 right-12 w-80'>
                        {user ? <Leaderboard compact /> : <AboutCTA />}
                    </div>
                </div>
            </div>

            {/* Mobile View - Conditional Rendering */}
            <div className='lg:hidden'>
                {!user ? (
                    /* Not logged in - Show AboutCTA at top, then posts */
                    <>
                        <div className='mb-6'>
                            <AboutCTA />
                        </div>

                        <div className='mb-4 text-center'>
                            <p className='text-sm text-gray-600 dark:text-gray-400 font-medium'>
                                Below you can see what people are doing right now
                            </p>
                        </div>

                        <div className='flex flex-wrap items-center gap-2 mb-2'>
                            <div className='flex flex-wrap gap-2'>
                                <Button
                                    onClick={() => setActiveTab('all')}
                                    variant='secondary'
                                    className={`text-sm px-4 py-2 border-2 rounded-lg font-medium transition-all duration-200 ${
                                        activeTab === 'all'
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                    }`}
                                >
                                    All
                                </Button>
                                <Button
                                    onClick={() => setActiveTab('gifts')}
                                    variant='secondary'
                                    className={`text-sm px-4 py-2 border-2 rounded-lg font-medium transition-all duration-200 ${
                                        activeTab === 'gifts'
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                    }`}
                                >
                                    Gifts
                                </Button>
                                <Button
                                    onClick={() => setActiveTab('requests')}
                                    variant='secondary'
                                    className={`text-sm px-4 py-2 border-2 rounded-lg font-medium transition-all duration-200 ${
                                        activeTab === 'requests'
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                    }`}
                                >
                                    Requests
                                </Button>
                            </div>

                            <div className='flex items-center gap-2 sm:ml-auto'>
                                <div className='relative'>
                                    <button
                                        onClick={() => setFilterOpen((v) => !v)}
                                        className='flex items-center gap-2 px-4 py-2 text-sm font-medium border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors'
                                    >
                                        {windowWidth > 768 ? (
                                            `Order by: ${
                                                typeOfOrdering.type === 'date' && typeOfOrdering.order === 'desc' ? 'Newest' :
                                                    typeOfOrdering.type === 'date' && typeOfOrdering.order === 'asc' ? 'Oldest' :
                                                        typeOfOrdering.type === 'distance' ? 'Closest' :
                                                            'Most Kudos'
                                            }`
                                        ) : 'Order'}

                                        <ChevronDown className={`w-4 h-4 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {filterOpen && (
                                        <>
                                            <div
                                                className='fixed inset-0 z-10'
                                                onClick={() => setFilterOpen(false)}
                                            />
                                            <div className={`absolute ${windowWidth >= 373 ? 'right-0' : 'left-0'} mt-2 w-48 max-w-[calc(100vw-2rem)] bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-lg z-20 overflow-hidden`}>
                                                <button
                                                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                                                        typeOfOrdering.type === 'date' && typeOfOrdering.order === 'desc'
                                                            ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 font-medium'
                                                            : 'text-zinc-700 dark:text-zinc-300'
                                                    }`}
                                                    onClick={() => {
                                                        setTypeOfOrdering({ type: 'date', order: 'desc' });
                                                        setShowLocationWarning(false);
                                                        setFilterOpen(false);
                                                    }}
                                                >
                                                Newest
                                                </button>
                                                <button
                                                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                                                        typeOfOrdering.type === 'date' && typeOfOrdering.order === 'asc'
                                                            ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 font-medium'
                                                            : 'text-zinc-700 dark:text-zinc-300'
                                                    }`}
                                                    onClick={() => {
                                                        setTypeOfOrdering({ type: 'date', order: 'asc' });
                                                        setShowLocationWarning(false);
                                                        setFilterOpen(false);
                                                    }}
                                                >
                                                Oldest
                                                </button>
                                                <button
                                                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                                                        typeOfOrdering.type === 'distance'
                                                            ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 font-medium'
                                                            : 'text-zinc-700 dark:text-zinc-300'
                                                    }`}
                                                    onClick={() => {
                                                        setShowLocationWarning(true);
                                                        setFilterOpen(false);
                                                    }}
                                                >
                                                Closest
                                                </button>
                                                <button
                                                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                                                        typeOfOrdering.type === 'kudos'
                                                            ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 font-medium'
                                                            : 'text-zinc-700 dark:text-zinc-300'
                                                    }`}
                                                    onClick={() => {
                                                        setTypeOfOrdering({ type: 'kudos', order: 'desc' });
                                                        setShowLocationWarning(false);
                                                        setFilterOpen(false);
                                                    }}
                                                >
                                                Most Kudos
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Search button - to the right of Order by */}
                            </div>
                        </div>

                        {showLocationWarning && (
                            <div className='bg-blue-50 border border-blue-400 rounded-lg p-4 flex items-start gap-3 dark:bg-blue-900/30 dark:border-blue-800'>
                                <MapPin className='w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0' />
                                <div className='flex-1'>
                                    <h4 className='font-semibold text-blue-900 dark:text-blue-300 mb-1'>Location Required</h4>
                                    <p className='text-sm text-blue-800 dark:text-blue-400'>
                                        To sort by distance, you need to set your location in your profile first.
                                        Please log in and add your location to use this feature.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => setShowLocationWarning(false)}
                                    variant='secondary'
                                    className='flex-shrink-0'
                                >
                                    <X className='w-4 h-4' />
                                </Button>
                            </div>
                        )}

                        <div className='w-full overflow-x-hidden'>
                            <PostsInfinite
                                filters={apiParams}
                                activeTab={activeTab}
                                ordering={typeOfOrdering}
                            />
                        </div>
                    </>
                ) : activeView === 'posts' ? (
                    /* Logged in - Posts tab */
                    <>
                        {/* About CTA for logged-in users */}
                        {!aboutCTADismissed && (
                            <div className='mb-4'>
                                <AboutCTA showDismiss={true} onDismiss={handleDismissAboutCTA} />
                            </div>
                        )}

                        <button
                            onClick={() => navigate(routes.createPost)}
                            className='w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-brand-600 dark:border-brand-400 text-brand-600 dark:text-brand-400 font-semibold rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950/20 transition-all duration-200 mb-4'
                        >
                            <Plus className='w-5 h-5' />
                            <span>Create Post</span>
                        </button>

                        <div className='flex flex-wrap items-center gap-2 mb-2'>
                            <div className='flex flex-wrap gap-2'>
                                <Button
                                    onClick={() => setActiveTab('all')}
                                    variant='secondary'
                                    className={`text-sm px-4 py-2 border-2 rounded-lg font-medium transition-all duration-200 ${
                                        activeTab === 'all'
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                    }`}
                                >
                                    All
                                </Button>
                                <Button
                                    onClick={() => setActiveTab('gifts')}
                                    variant='secondary'
                                    className={`text-sm px-4 py-2 border-2 rounded-lg font-medium transition-all duration-200 ${
                                        activeTab === 'gifts'
                                            ? 'border-blue-500 bg-blue-50 text-brand-700'
                                            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                    }`}
                                >
                                    Gifts
                                </Button>
                                <Button
                                    onClick={() => setActiveTab('requests')}
                                    variant='secondary'
                                    className={`text-sm px-4 py-2 border-2 rounded-lg font-medium transition-all duration-200 ${
                                        activeTab === 'requests'
                                            ? 'border-blue-500 bg-blue-50 text-brand-700'
                                            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                    }`}
                                >
                                    Requests
                                </Button>
                            </div>

                            <div className='flex items-center gap-2 sm:ml-auto'>
                                <div className='relative'>
                                    <button
                                        onClick={() => setFilterOpen((v) => !v)}
                                        className='flex items-center gap-2 px-4 py-2 text-sm font-medium border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors'
                                    >
                                        {windowWidth > 768 ? (
                                            `Order by: ${
                                                typeOfOrdering.type === 'date' && typeOfOrdering.order === 'desc' ? 'Newest' :
                                                    typeOfOrdering.type === 'date' && typeOfOrdering.order === 'asc' ? 'Oldest' :
                                                        typeOfOrdering.type === 'distance' ? 'Closest' :
                                                            'Most Kudos'
                                            }`
                                        ) : 'Order'}



                                        <ChevronDown className={`w-4 h-4 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {filterOpen && (
                                        <>
                                            <div
                                                className='fixed inset-0 z-10'
                                                onClick={() => setFilterOpen(false)}
                                            />
                                            <div className={`absolute ${windowWidth >= 373 ? 'right-0' : 'left-0'} mt-2 w-48 max-w-[calc(100vw-2rem)] bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-lg z-20 overflow-hidden`}>
                                                <button
                                                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                                                        typeOfOrdering.type === 'date' && typeOfOrdering.order === 'desc'
                                                            ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 font-medium'
                                                            : 'text-zinc-700 dark:text-zinc-300'
                                                    }`}
                                                    onClick={() => {
                                                        setTypeOfOrdering({ type: 'date', order: 'desc' });
                                                        setShowLocationWarning(false);
                                                        setFilterOpen(false);
                                                    }}
                                                >
                                                Newest
                                                </button>
                                                <button
                                                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                                                        typeOfOrdering.type === 'date' && typeOfOrdering.order === 'asc'
                                                            ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 font-medium'
                                                            : 'text-zinc-700 dark:text-zinc-300'
                                                    }`}
                                                    onClick={() => {
                                                        setTypeOfOrdering({ type: 'date', order: 'asc' });
                                                        setShowLocationWarning(false);
                                                        setFilterOpen(false);
                                                    }}
                                                >
                                                Oldest
                                                </button>
                                                <button
                                                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                                                        typeOfOrdering.type === 'distance'
                                                            ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 font-medium'
                                                            : 'text-zinc-700 dark:text-zinc-300'
                                                    }`}
                                                    onClick={() => {
                                                        if (!user?.location?.name) {
                                                            setShowLocationWarning(true);
                                                            setFilterOpen(false);
                                                            return;
                                                        }
                                                        setTypeOfOrdering({ type: 'distance', order: 'asc' });
                                                        setShowLocationWarning(false);
                                                        setFilterOpen(false);
                                                    }}
                                                >
                                                Closest
                                                </button>
                                                <button
                                                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                                                        typeOfOrdering.type === 'kudos'
                                                            ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 font-medium'
                                                            : 'text-zinc-700 dark:text-zinc-300'
                                                    }`}
                                                    onClick={() => {
                                                        setTypeOfOrdering({ type: 'kudos', order: 'desc' });
                                                        setShowLocationWarning(false);
                                                        setFilterOpen(false);
                                                    }}
                                                >
                                                Most Kudos
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Search button - to the right of Order by */}
                                <button
                                    onClick={() => navigate('/search')}
                                    className='flex sm:hidden h-9 w-9 items-center justify-center rounded-lg bg-white/90 text-zinc-800 shadow-lg backdrop-blur-sm hover:bg-white dark:bg-zinc-800/90 dark:text-zinc-200 dark:hover:bg-zinc-800'
                                    aria-label='Search'
                                >
                                    <MagnifyingGlassIconHeroicons className='h-5 w-5' />
                                </button>
                            </div>
                        </div>

                        {showLocationWarning && (
                            <div className='bg-blue-50 border border-blue-400 rounded-lg p-4 flex items-start gap-3 dark:bg-blue-900/30 dark:border-blue-800'>
                                <MapPin className='w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0' />
                                <div className='flex-1'>
                                    <h4 className='font-semibold text-blue-900 dark:text-blue-300 mb-1'>Location Required</h4>
                                    <p className='text-sm text-blue-800 dark:text-blue-400'>
                                        To sort by distance, you need to set your location in your profile first.
                                        Go to your profile, click &quot;Edit&quot;, and add your location.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => setShowLocationWarning(false)}
                                    variant='secondary'
                                    className='flex-shrink-0'
                                >
                                    <X className='w-4 h-4' />
                                </Button>
                            </div>
                        )}

                        <div className='w-full overflow-x-hidden'>
                            <PostsInfinite
                                filters={apiParams}
                                activeTab={activeTab}
                                ordering={typeOfOrdering}
                            />
                        </div>
                    </>
                ) : (
                    /* Logged in - Leaderboard tab */
                    <Leaderboard compact />
                )}
            </div>
        </div>
    );
}
