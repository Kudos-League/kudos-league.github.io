import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePosts } from '@/hooks/usePosts';
import { searchPosts } from '@/shared/api/actions';
import PostsContainer from '@/components/posts/PostContainer';
import CurrentEvent from '@/components/events/CurrentEvent';
import { PostDTO } from '@/shared/api/types';

type PostFilterType = 'all' | 'gifts' | 'requests';
type OrderType = 'date' | 'distance' | 'kudos';

interface TypeOfOrdering {
    type: OrderType;
    order: 'asc' | 'desc';
}

export default function Feed() {
    const { posts, fetchPosts, loading, error } = usePosts();
    const [orderedPosts, setOrderedPosts] = useState<PostDTO[]>([]);
    const [searchText, setSearchText] = useState('');
    const [results, setResults] = useState<PostDTO[]>([]);
    const [cache, setCache] = useState<Record<string, PostDTO[]>>({});
    const [activeTab, setActiveTab] = useState<PostFilterType>('all');
    const [typeOfOrdering, setTypeOfOrdering] = useState<TypeOfOrdering>({
        type: 'date',
        order: 'desc'
    });
    const [filterOpen, setFilterOpen] = useState(false);

    const navigate = useNavigate();
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        fetchPosts();
    }, []);

    const filterAndOrderPosts = useCallback(
        (
            posts: PostDTO[],
            orderingType: TypeOfOrdering,
            filterType: PostFilterType
        ) => {
            if (!posts) return [];

            const filtered = posts.filter((p) => {
                // Always exclude closed posts
                if (p.status === 'closed') return false;
                
                // If 'all' is selected, include all non-closed posts
                if (filterType === 'all') return true;
                
                // Filter by type: gifts or requests
                return p.type === (filterType === 'gifts' ? 'gift' : 'request');
            });

            const sortFn = {
                date: (a: PostDTO, b: PostDTO) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
                distance: () => Math.random() - 0.5, // Placeholder
                kudos: (a: PostDTO, b: PostDTO) =>
                    (b.kudos || 0) - (a.kudos || 0)
            }[orderingType.type];

            return [...filtered].sort((a, b) =>
                orderingType.order === 'asc' ? -sortFn(a, b) : sortFn(a, b)
            );
        },
        []
    );

    useEffect(() => {
        if (posts?.length) {
            const filtered = filterAndOrderPosts(
                posts,
                typeOfOrdering,
                activeTab
            );
            setOrderedPosts(filtered);
        }
    }, [posts, activeTab, typeOfOrdering, filterAndOrderPosts]);

    const handleSearchChange = (value: string) => {
        setSearchText(value);
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => fetchResults(value), 300);
    };

    const fetchResults = async (query: string) => {
        if (!query || query.length < 2) return setResults([]);

        if (cache[query]) return setResults(cache[query]);

        try {
            const res = await searchPosts(query);
            setCache((prev) => ({ ...prev, [query]: res }));
            setResults(res);
        }
        catch (e) {
            console.error('Search error', e);
        }
    };

    const handleSortByDate = () => {
        setTypeOfOrdering({ type: 'date', order: 'desc' });
    };

    const handleSortByDistance = () => {
        setTypeOfOrdering({ type: 'distance', order: 'asc' });
    };

    const handleCreatePost = () => navigate('/create-post');

    if (loading) return <div className='p-4 md:p-6 text-center'>Loading...</div>;
    if (error) return <div className='p-4 md:p-6 text-red-500'>{error}</div>;

    return (
        <div className='max-w-4xl mx-auto space-y-4'>
            <CurrentEvent />

            {/* Header */}
            <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b pb-4'>
                <h1 className='text-xl font-bold'>Welcome to Kudos League!</h1>
                <button
                    onClick={handleCreatePost}
                    className='text-white bg-black px-4 py-2 rounded hover:bg-gray-800 whitespace-nowrap self-start sm:self-auto'
                >
                    + Gift / Request
                </button>
            </div>

            {/* Search and Controls */}
            <div className='space-y-3'>
                {/* Search Input */}
                <div className='w-full'>
                    <input
                        type='text'
                        placeholder='Search...'
                        value={searchText}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className='w-full border px-3 py-2 rounded'
                    />
                </div>

                {/* Sort and Filter Controls */}
                <div className='flex flex-wrap items-center gap-2'>
                    {/* Sort options */}
                    <button
                        onClick={handleSortByDate}
                        className={`text-sm border px-3 py-1 rounded whitespace-nowrap ${
                            typeOfOrdering.type === 'date' 
                                ? 'bg-black text-white' 
                                : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        Sort by date
                    </button>
                    <button
                        onClick={handleSortByDistance}
                        className={`text-sm border px-3 py-1 rounded whitespace-nowrap ${
                            typeOfOrdering.type === 'distance' 
                                ? 'bg-black text-white' 
                                : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        Sort by distance
                    </button>
                    
                    <button
                        onClick={() => setFilterOpen(!filterOpen)}
                        className='text-sm text-gray-700 border px-3 py-1 rounded hover:bg-gray-100 whitespace-nowrap md:ml-auto'
                    >
                        {filterOpen ? 'Hide Filters' : 'More Filters'}
                    </button>
                </div>
            </div>

            {/* Advanced Filter Options */}
            {filterOpen && (
                <div className='p-4 border rounded bg-gray-50'>
                    <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2'>
                        <button
                            className={`px-3 py-1 rounded text-sm ${typeOfOrdering.type === 'date' && typeOfOrdering.order === 'desc' ? 'bg-black text-white' : 'bg-gray-200'}`}
                            onClick={() =>
                                setTypeOfOrdering({ type: 'date', order: 'desc' })
                            }
                        >
                            Newest
                        </button>
                        <button
                            className={`px-3 py-1 rounded text-sm ${typeOfOrdering.type === 'date' && typeOfOrdering.order === 'asc' ? 'bg-black text-white' : 'bg-gray-200'}`}
                            onClick={() =>
                                setTypeOfOrdering({ type: 'date', order: 'asc' })
                            }
                        >
                            Oldest
                        </button>
                        <button
                            className={`px-3 py-1 rounded text-sm ${typeOfOrdering.type === 'distance' ? 'bg-black text-white' : 'bg-gray-200'}`}
                            onClick={() =>
                                setTypeOfOrdering({
                                    type: 'distance',
                                    order: 'asc'
                                })
                            }
                        >
                            Closest
                        </button>
                        <button
                            className={`px-3 py-1 rounded text-sm ${typeOfOrdering.type === 'kudos' ? 'bg-black text-white' : 'bg-gray-200'}`}
                            onClick={() =>
                                setTypeOfOrdering({
                                    type: 'kudos',
                                    order: 'desc'
                                })
                            }
                        >
                            Most Kudos
                        </button>
                    </div>
                </div>
            )}

            {/* Category Filter Tabs */}
            <div className='flex flex-wrap gap-2'>
                <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-1 rounded-full text-sm whitespace-nowrap ${activeTab === 'all' ? 'bg-black text-white' : 'bg-gray-200'}`}
                >
                    All
                </button>
                <button
                    onClick={() => setActiveTab('gifts')}
                    className={`px-4 py-1 rounded-full text-sm whitespace-nowrap ${activeTab === 'gifts' ? 'bg-black text-white' : 'bg-gray-200'}`}
                >
                    Gifts
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`px-4 py-1 rounded-full text-sm whitespace-nowrap ${activeTab === 'requests' ? 'bg-black text-white' : 'bg-gray-200'}`}
                >
                    Requests
                </button>
            </div>

            {/* Search Results */}
            {searchText && results.length > 0 && (
                <div className='border rounded p-4 bg-white'>
                    <h2 className='text-sm font-semibold mb-2'>
                        Search Results ({results.length}):
                    </h2>
                    <PostsContainer posts={results} />
                </div>
            )}

            {/* Search - No Results */}
            {searchText && results.length === 0 && searchText.length >= 2 && (
                <div className='border rounded p-4 bg-gray-50 text-center'>
                    <p className='text-gray-600'>No results found for {searchText}</p>
                </div>
            )}

            {/* Main Posts Feed */}
            {!searchText && <PostsContainer posts={orderedPosts} />}
            
            {/* Empty State */}
            {!searchText && orderedPosts.length === 0 && !loading && (
                <div className='text-center py-8'>
                    <p className='text-gray-600 mb-4'>No posts match your current filters.</p>
                    <button
                        onClick={() => setActiveTab('all')}
                        className='text-blue-600 hover:underline'
                    >
                        Show all posts
                    </button>
                </div>
            )}
        </div>
    );
}
