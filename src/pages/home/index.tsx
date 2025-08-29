import React from 'react';
import CurrentEvent from '@/components/events/CurrentEvent';
import Button from '@/components/common/Button';
import { useNavigate } from 'react-router-dom';
import PostsInfinite from '@/components/posts/PostsInfinite';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useSearchPostsQuery } from '@/shared/api/queries/posts';
import { useAuth } from '@/hooks/useAuth';

type PostFilterType = 'all' | 'gifts' | 'requests';
type OrderType = 'date' | 'distance' | 'kudos';
type TypeOfOrdering = { type: OrderType; order: 'asc' | 'desc' };

export default function Feed() {
    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();
    const [activeTab, setActiveTab] = React.useState<PostFilterType>('all');
    const [typeOfOrdering, setTypeOfOrdering] = React.useState<TypeOfOrdering>({
        type: 'date',
        order: 'desc'
    });
    const [filterOpen, setFilterOpen] = React.useState(false);
    const [searchText, setSearchText] = React.useState('');
    const debouncedSearch = useDebouncedValue(searchText, 300);

    const { data: searchResults = [], isFetching: searching } =
        useSearchPostsQuery(debouncedSearch);

    const searchingActive = debouncedSearch.length >= 2;

    const apiParams = {
        includeSender: true,
        includeTags: true,
        limit: 10
    } as const;

    const handleCreatePost = () => {
        if (!isLoggedIn) {
            // Redirect to login with return URL
            const returnUrl = encodeURIComponent('/create-post');
            navigate(`/login?returnUrl=${returnUrl}`);
        }
        else {
            navigate('/create-post');
        }
    };

    return (
        <div className='max-w-4xl mx-auto space-y-4'>
            <CurrentEvent />

            <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b pb-4'>
                <h1 className='text-xl font-bold'>Welcome to Kudos League!</h1>
                <Button
                    onClick={handleCreatePost}
                    variant='secondary'
                    className='whitespace-nowrap self-start sm:self-auto'
                >
                    + Gift / Request
                </Button>
            </div>

            <div className='space-y-3'>
                <input
                    type='text'
                    placeholder='Search…'
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className='w-full border px-3 py-2 rounded'
                />

                <div className='flex flex-wrap items-center gap-2'>
                    <Button
                        onClick={() =>
                            setTypeOfOrdering({ type: 'date', order: 'desc' })
                        }
                        variant='secondary'
                        className='text-sm border'
                    >
                        Sort by date
                    </Button>
                    <Button
                        onClick={() =>
                            setTypeOfOrdering({
                                type: 'distance',
                                order: 'asc'
                            })
                        }
                        variant='secondary'
                        className='text-sm border'
                    >
                        Sort by distance
                    </Button>
                    <Button
                        onClick={() => setFilterOpen((v) => !v)}
                        variant='secondary'
                        className='text-sm border md:ml-auto'
                    >
                        {filterOpen ? 'Hide Filters' : 'More Filters'}
                    </Button>
                </div>
            </div>

            {filterOpen && (
                <div className='p-4 border rounded'>
                    <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2'>
                        <Button
                            className='text-sm'
                            variant='secondary'
                            onClick={() =>
                                setTypeOfOrdering({
                                    type: 'date',
                                    order: 'desc'
                                })
                            }
                        >
                            Newest
                        </Button>
                        <Button
                            className='text-sm'
                            variant='secondary'
                            onClick={() =>
                                setTypeOfOrdering({
                                    type: 'date',
                                    order: 'asc'
                                })
                            }
                        >
                            Oldest
                        </Button>
                        <Button
                            className='text-sm'
                            variant='secondary'
                            onClick={() =>
                                setTypeOfOrdering({
                                    type: 'distance',
                                    order: 'asc'
                                })
                            }
                        >
                            Closest
                        </Button>
                        <Button
                            className='text-sm'
                            variant='secondary'
                            onClick={() =>
                                setTypeOfOrdering({
                                    type: 'kudos',
                                    order: 'desc'
                                })
                            }
                        >
                            Most Kudos
                        </Button>
                    </div>
                </div>
            )}

            <div className='flex flex-wrap gap-2'>
                <Button
                    onClick={() => setActiveTab('all')}
                    variant='secondary'
                    className='text-sm'
                >
                    All
                </Button>
                <Button
                    onClick={() => setActiveTab('gifts')}
                    variant='secondary'
                    className='text-sm'
                >
                    Gifts
                </Button>
                <Button
                    onClick={() => setActiveTab('requests')}
                    variant='secondary'
                    className='text-sm'
                >
                    Requests
                </Button>
            </div>

            {searchingActive ? (
                <PostsInfinite.StaticList
                    posts={searchResults}
                    loading={searching}
                />
            ) : (
                <PostsInfinite
                    filters={apiParams}
                    activeTab={activeTab}
                    ordering={typeOfOrdering}
                />
            )}
        </div>
    );
}
