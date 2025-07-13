import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePosts } from '@/hooks/usePosts';
import { searchPosts } from '@/shared/api/actions';
import PostsContainer from '@/components/posts/PostContainer';
import CurrentEvent from '@/components/events/CurrentEvent';
import { PostDTO } from '@/shared/api/types';

type PostFilterType = 'gifts' | 'requests';
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
    const [activeTab, setActiveTab] = useState<PostFilterType>('gifts');
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

            const filtered = posts.filter(
                (p) => p.type === (filterType === 'gifts' ? 'gift' : 'request') && p.status !== 'closed'
            );

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

    if (loading) return <div className='p-6 text-center'>Loading...</div>;
    if (error) return <div className='p-6 text-red-500'>{error}</div>;

    return (
        <div className='max-w-4xl mx-auto p-4 space-y-4'>
            <CurrentEvent />

            <div className='flex justify-between items-center border-b pb-4'>
                <h1 className='text-xl font-bold'>Welcome to Kudos League!</h1>
                <button
                    onClick={handleCreatePost}
                    className='text-white bg-black px-4 py-2 rounded hover:bg-gray-800'
                >
                    + Gift / Request
                </button>
            </div>

            <div className='flex flex-wrap items-center gap-2'>
                <input
                    type='text'
                    placeholder='Search...'
                    value={searchText}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className='flex-1 border px-3 py-2 rounded'
                />
                
                {/* Sort options - now both visible */}
                <button
                    onClick={handleSortByDate}
                    className={`text-sm border px-3 py-1 rounded ${
                        typeOfOrdering.type === 'date' 
                            ? 'bg-black text-white' 
                            : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                    Sort by date
                </button>
                <button
                    onClick={handleSortByDistance}
                    className={`text-sm border px-3 py-1 rounded ${
                        typeOfOrdering.type === 'distance' 
                            ? 'bg-black text-white' 
                            : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                    Sort by distance
                </button>
                
                <button
                    onClick={() => setFilterOpen(!filterOpen)}
                    className='text-sm text-gray-700 border px-3 py-1 rounded hover:bg-gray-100'
                >
                    Filters
                </button>
            </div>

            {filterOpen && (
                <div className='p-4 border rounded bg-gray-50 space-x-2'>
                    <button
                        className={`px-3 py-1 rounded ${typeOfOrdering.type === 'date' && typeOfOrdering.order === 'desc' ? 'bg-black text-white' : 'bg-gray-200'}`}
                        onClick={() =>
                            setTypeOfOrdering({ type: 'date', order: 'desc' })
                        }
                    >
                        Newest
                    </button>
                    <button
                        className={`px-3 py-1 rounded ${typeOfOrdering.type === 'date' && typeOfOrdering.order === 'asc' ? 'bg-black text-white' : 'bg-gray-200'}`}
                        onClick={() =>
                            setTypeOfOrdering({ type: 'date', order: 'asc' })
                        }
                    >
                        Oldest
                    </button>
                    <button
                        className={`px-3 py-1 rounded ${typeOfOrdering.type === 'distance' ? 'bg-black text-white' : 'bg-gray-200'}`}
                        onClick={() =>
                            setTypeOfOrdering({
                                type: 'distance',
                                order: 'asc'
                            })
                        }
                    >
                        Closest
                    </button>
                </div>
            )}

            <div className='flex gap-2'>
                <button
                    onClick={() => setActiveTab('gifts')}
                    className={`px-4 py-1 rounded-full text-sm ${activeTab === 'gifts' ? 'bg-black text-white' : 'bg-gray-200'}`}
                >
                    Gifts
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`px-4 py-1 rounded-full text-sm ${activeTab === 'requests' ? 'bg-black text-white' : 'bg-gray-200'}`}
                >
                    Requests
                </button>
            </div>

            {searchText && results.length > 0 && (
                <div className='border rounded p-4 bg-white'>
                    <h2 className='text-sm font-semibold mb-2'>
                        Search Results:
                    </h2>
                    <PostsContainer posts={results} />
                </div>
            )}

            {!searchText && <PostsContainer posts={orderedPosts} />}
        </div>
    );
}