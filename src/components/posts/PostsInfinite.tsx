import * as React from 'react';
import { usePostsInfiniteQuery } from '@/shared/api/queries/posts';
import PostsContainer from './PostsContainer';
import Spinner from '../common/Spinner';
import Alert from '../common/Alert';

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
    const {
        data,
        isLoading,
        isError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        error
    } = usePostsInfiniteQuery({ 
        ...filters, 
        sort: ordering.type === 'distance' ? 'date' : ordering.type 
    });

    const flat = React.useMemo(
        () => data?.pages.flatMap((p) => p.data) ?? [],
        [data]
    );
    filters.includeSender = true; //Ensure sender is always included

    const visible = React.useMemo(() => {
        const filtered =
            activeTab === 'all'
                ? flat
                : flat.filter(
                    (p) =>
                        p.type ===
                          (activeTab === 'gifts' ? 'gift' : 'request')
                );

        if (ordering.type === 'distance') {
            const cmp = () => Math.random() - 0.5; // TODO: replace with real distance sort
            return [...filtered].sort(cmp);
        }

        return filtered;
    }, [flat, activeTab, ordering]);

    const sentinelRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;

        if (!hasNextPage) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const first = entries[0];
                if (!first?.isIntersecting) return;
                if (isFetchingNextPage) return;
                fetchNextPage();
            },
            {
                root: null,
                rootMargin: '200px',
                threshold: 0
            }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [fetchNextPage, hasNextPage, isFetchingNextPage, visible.length]);

    if (isLoading) return <Spinner />;
    if (isError) {
        console.error('Error loading posts infinite', error);
        return <Alert type='danger' message='Failed to load posts.' />;
    }

    return (
        <>
            <PostsContainer posts={visible} showHandshakeShortcut />
            <div className='mt-4 flex justify-center'>
                {isFetchingNextPage ? (
                    <Spinner text='Loading more...' />
                ) : hasNextPage ? (
                    <div ref={sentinelRef} style={{ height: 1, width: 1 }} />
                ) : (
                    <div className='h-2' />
                )}
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
