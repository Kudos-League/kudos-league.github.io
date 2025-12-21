import * as React from 'react';
import { usePostsInfiniteQuery } from '@/shared/api/queries/posts';
import PostsContainer from './PostsContainer';
import Spinner from '../common/Spinner';
import Alert from '../common/Alert';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

type PostFilterType = 'all' | 'gifts' | 'requests';
type OrderType = 'date' | 'distance' | 'kudos';
type Ordering = { type: OrderType; order: 'asc' | 'desc' };

export default function PostsInfinite({
    filters,
    activeTab,
    ordering
}: {
    filters: {
        includeSender?: boolean;
        includeTags?: boolean;
        limit?: number;
        query?: string;
    };
    activeTab: PostFilterType;
    ordering: Ordering;
}) {
    const safeIncomingFilters = React.useMemo(() => ({ ...(filters ?? {}) }), [filters]);

    const queryFilters = React.useMemo(() => {
        const sort: 'date' | 'tags' | 'location' | 'kudos' = ordering.type === 'distance' ? 'location' : ordering.type;
        return {
            ...safeIncomingFilters,
            includeSender: true,
            sort,
            order: ordering.order
        };
    }, [safeIncomingFilters, ordering]);

    const {
        data,
        isLoading,
        isError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = usePostsInfiniteQuery(queryFilters);

    const flat = React.useMemo(
        () => data?.pages.flatMap((p) => p.data) ?? [],
        [data]
    );

    // Only filter by type, let backend handle sorting
    const visible = React.useMemo(() => {
        if (activeTab === 'all') return flat;
        return flat.filter(
            (p) => p.type === (activeTab === 'gifts' ? 'gift' : 'request')
        );
    }, [flat, activeTab]);

    const sentinelRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        const el = sentinelRef.current;
        if (!el || !hasNextPage) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const first = entries[0];
                if (first?.isIntersecting && !isFetchingNextPage && hasNextPage) {
                    fetchNextPage();
                }
            },
            {
                root: null,
                rootMargin: '200px',
                threshold: 0
            }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    if (isLoading) return <Spinner size='2xl' />;
    if (isError) return <Alert type='danger' message='Failed to load posts.' />;

    return (
        <>
            <PostsContainer posts={visible} showHandshakeShortcut />
            <div className='mt-4 flex flex-col items-center'>
                {isFetchingNextPage && <Spinner text='Loading more...' size='2xl' />}
                {hasNextPage && !isFetchingNextPage && (
                    <div className='flex flex-col items-center gap-2 py-4'>
                        <ChevronDownIcon
                            className='w-6 h-6 text-brand-500 dark:text-brand-400 animate-bounce'
                            style={{
                                animation: 'bounce 2s ease-in-out infinite'
                            }}
                        />
                        <span className='text-sm text-gray-500 dark:text-gray-400'>
                            Scroll for more
                        </span>
                    </div>
                )}
                {hasNextPage && (
                    <div
                        ref={sentinelRef}
                        style={{
                            height: 100,
                            width: '100%'
                        }}
                    />
                )}
                {!hasNextPage && !isFetchingNextPage && <div className='h-2' />}
            </div>
        </>
    );
}

PostsInfinite.StaticList = function StaticList({
    posts,
    loading
}: {
    posts: any[];
    loading?: boolean;
}) {
    if (loading) return <Spinner text='Searching...' />;
    return <PostsContainer posts={posts ?? []} showHandshakeShortcut />;
};
