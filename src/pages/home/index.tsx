import React from 'react';
import EventsCarousel from '@/components/events/EventsCarousel';
import Button from '@/components/common/Button';
import { useNavigate } from 'react-router-dom';
import PostsInfinite from '@/components/posts/PostsInfinite';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useSearchPostsQuery } from '@/shared/api/queries/posts';
import { useSearchUsersQuery } from '@/shared/api/queries/users';
import { useAuth } from '@/contexts/useAuth';
import { MapPin, X } from 'lucide-react';
import UserCard from '@/components/users/UserCard';

type PostFilterType = 'all' | 'gifts' | 'requests';
type OrderType = 'date' | 'distance' | 'kudos';
type TypeOfOrdering = { type: OrderType; order: 'asc' | 'desc' };
type SearchFilterType = 'all' | 'posts' | 'users';

export default function Feed() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = React.useState<PostFilterType>('all');
    const [searchFilter, setSearchFilter] = React.useState<SearchFilterType>('all');
    const [typeOfOrdering, setTypeOfOrdering] = React.useState<TypeOfOrdering>({
        type: 'date',
        order: 'desc'
    });
    const [filterOpen, setFilterOpen] = React.useState(false);
    const [searchText, setSearchText] = React.useState('');
    const [showLocationWarning, setShowLocationWarning] = React.useState(false);
    const debouncedSearch = useDebouncedValue(searchText, 300);

    const { data: searchResults = [], isFetching: searching } =
        useSearchPostsQuery(debouncedSearch);

    const { data: userSearchResults = [], isFetching: searchingUsers } =
        useSearchUsersQuery(debouncedSearch);

    const searchingActive = debouncedSearch.length >= 2;

    const apiParams = {
        includeSender: true,
        includeTags: true,
        includeImages: true,
        limit: 10
    } as const;

    return (
        <div className='w-full max-w-4xl mx-auto space-y-4 overflow-x-hidden px-4 sm:px-6 pt-4'>
            <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4'>
                <Button
                    onClick={() => navigate('/create-post')}
                    className='whitespace-nowrap px-6 py-3 bg-brand-600 text-white rounded-full font-semibold shadow-lg hover:shadow-xl hover:bg-brand-500 dark:bg-brand-400 dark:hover:bg-brand-300 transition-all duration-200 transform hover:translate-y-0.5'
                >
                    + Gift / Request
                </Button>
                <input
                    type='text'
                    placeholder='Search…'
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className='flex-1 border px-3 py-2 rounded'
                />
            </div>

            <div className='space-y-3'>

                <div className='flex flex-wrap items-center gap-2'>
                    {/* <Button
                        onClick={() => {
                            setTypeOfOrdering({ type: 'date', order: 'desc' });
                            setShowLocationWarning(false);
                        }}
                        variant='secondary'
                        className='text-sm border'
                    >
                        Sort by date
                    </Button>
                    <Button
                        onClick={() => {
                            if (!user?.location?.name) {
                                setShowLocationWarning(true);
                                return;
                            }
                            setTypeOfOrdering({
                                type: 'distance',
                                order: 'asc'
                            });
                            setShowLocationWarning(false);
                        }}
                        variant='secondary'
                        className='text-sm border'
                    >
                        Sort by distance
                    </Button> */}
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

                    <Button
                        onClick={() => setFilterOpen((v) => !v)}
                        variant='secondary'
                        className='text-sm border md:ml-auto'
                    >
                        {filterOpen ? 'Hide Filters' : 'More Filters'}
                    </Button>
                </div>
            </div>

            {showLocationWarning && (
                <div className='bg-blue-50 border border-blue-400 rounded-lg p-4 flex items-start gap-3'>
                    <MapPin className='w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0' />
                    <div className='flex-1'>
                        <h4 className='font-semibold text-blue-900 mb-1'>Location Required</h4>
                        <p className='text-sm text-blue-800'>
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

            {filterOpen && (
                <div className='p-4 border rounded'>
                    <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2'>
                        <Button
                            className='text-sm'
                            variant={typeOfOrdering.type === 'date' && typeOfOrdering.order === 'desc' ? 'primary' : 'secondary'}
                            onClick={() => {
                                setTypeOfOrdering({
                                    type: 'date',
                                    order: 'desc'
                                });
                                setShowLocationWarning(false);
                            }}
                        >
                            Newest {typeOfOrdering.type === 'date' && typeOfOrdering.order === 'desc'}
                        </Button>
                        <Button
                            className='text-sm'
                            variant={typeOfOrdering.type === 'date' && typeOfOrdering.order === 'asc' ? 'primary' : 'secondary'}
                            onClick={() => {
                                setTypeOfOrdering({
                                    type: 'date',
                                    order: 'asc'
                                });
                                setShowLocationWarning(false);
                            }}
                        >
                            Oldest
                        </Button>
                        <Button
                            className='text-sm'
                            variant={typeOfOrdering.type === 'distance' ? 'primary' : 'secondary'}
                            onClick={() => {
                                if (!user?.location?.name) {
                                    setShowLocationWarning(true);
                                    setFilterOpen(false);
                                    return;
                                }
                                setTypeOfOrdering({
                                    type: 'distance',
                                    order: 'asc'
                                });
                                setShowLocationWarning(false);
                            }}
                        >
                            Closest
                        </Button>
                        <Button
                            className='text-sm'
                            variant={typeOfOrdering.type === 'kudos' ? 'primary' : 'secondary'}
                            onClick={() => {
                                setTypeOfOrdering({
                                    type: 'kudos',
                                    order: 'desc'
                                });
                                setShowLocationWarning(false);
                            }}
                        >
                            Most Kudos
                        </Button>
                    </div>
                </div>
            )}


            <div className='w-full overflow-x-hidden'>
                {searchingActive ? (
                    <div className='space-y-4'>
                        {/* Search Filter Tabs (Reddit-style) */}
                        <div className='flex items-center gap-2 border-b border-gray-200 pb-2'>
                            <button
                                onClick={() => setSearchFilter('all')}
                                className={`text-sm px-4 py-2 rounded-full transition-all duration-200 ${
                                    searchFilter === 'all'
                                        ? 'bg-blue-500 text-white font-semibold shadow-sm'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                All
                                <span className='ml-1.5 text-xs opacity-80'>
                                    ({userSearchResults.length + searchResults.length})
                                </span>
                            </button>
                            <button
                                onClick={() => setSearchFilter('posts')}
                                className={`text-sm px-4 py-2 rounded-full transition-all duration-200 ${
                                    searchFilter === 'posts'
                                        ? 'bg-blue-500 text-white font-semibold shadow-sm'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                                        ? 'bg-blue-500 text-white font-semibold shadow-sm'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Users
                                <span className='ml-1.5 text-xs opacity-80'>
                                    ({userSearchResults.length})
                                </span>
                            </button>
                        </div>

                        {/* Search Results */}
                        <div className='space-y-6'>
                            {/* User Results */}
                            {(searchFilter === 'all' || searchFilter === 'users') && (
                                <>
                                    {searchingUsers ? (
                                        <div className='text-center py-8 text-gray-500'>
                                            Searching users...
                                        </div>
                                    ) : userSearchResults.length > 0 ? (
                                        <div className='space-y-3'>
                                            {searchFilter === 'all' && (
                                                <h3 className='text-lg font-semibold text-gray-700 flex items-center gap-2'>
                                                    <span className='bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm'>
                                                        {userSearchResults.length}
                                                    </span>
                                                    Users
                                                </h3>
                                            )}
                                            <div className='space-y-2'>
                                                {userSearchResults.map((user) => (
                                                    <UserCard key={user.id} user={user} />
                                                ))}
                                            </div>
                                        </div>
                                    ) : searchFilter === 'users' ? (
                                        <div className='text-center py-12 text-gray-500'>
                                            No users found for &quot;{searchText}&quot;
                                        </div>
                                    ) : null}
                                </>
                            )}

                            {/* Post Results */}
                            {(searchFilter === 'all' || searchFilter === 'posts') && (
                                <>
                                    {searching ? (
                                        <div className='text-center py-8 text-gray-500'>
                                            Searching posts...
                                        </div>
                                    ) : searchResults.length > 0 ? (
                                        <div className='space-y-3'>
                                            {searchFilter === 'all' && (
                                                <h3 className='text-lg font-semibold text-gray-700 flex items-center gap-2'>
                                                    <span className='bg-purple-100 text-purple-700 px-2 py-1 rounded text-sm'>
                                                        {searchResults.length}
                                                    </span>
                                                    Posts
                                                </h3>
                                            )}
                                            <PostsInfinite.StaticList
                                                posts={searchResults}
                                                loading={false}
                                            />
                                        </div>
                                    ) : searchFilter === 'posts' ? (
                                        <div className='text-center py-12 text-gray-500'>
                                            No posts found for &quot;{searchText}&quot;
                                        </div>
                                    ) : null}
                                </>
                            )}

                            {/* No Results At All */}
                            {!searching &&
                                !searchingUsers &&
                                searchFilter === 'all' &&
                                userSearchResults.length === 0 &&
                                searchResults.length === 0 && (
                                <div className='text-center py-12 space-y-2'>
                                    <p className='text-lg font-semibold text-gray-700'>
                                            No results found
                                    </p>
                                    <p className='text-gray-500'>
                                            Try searching for something else or check your spelling
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <PostsInfinite
                        filters={apiParams}
                        activeTab={activeTab}
                        ordering={typeOfOrdering}
                    />
                )}
            </div>
        </div>
    );
}
