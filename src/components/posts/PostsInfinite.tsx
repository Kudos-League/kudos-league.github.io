import * as React from 'react';
import { usePostsInfiniteQuery } from '@/shared/api/queries/posts';
import PostsContainer from './PostsContainer';
import Spinner from '../common/Spinner';

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
        isFetchingNextPage
    } = usePostsInfiniteQuery(filters);

    const flat = React.useMemo(
        () => data?.pages.flatMap((p) => p.data) ?? [],
        [data]
    );

    const visible = React.useMemo(() => {
        const filtered =
            activeTab === 'all'
                ? flat
                : flat.filter(
                    (p) =>
                        p.type ===
                          (activeTab === 'gifts' ? 'gift' : 'request')
                );

        const cmp = {
            date: (a: any, b: any) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            distance: () => Math.random() - 0.5, // TODO
            kudos: (a: any, b: any) =>
                (b.sender?.kudos ?? 0) - (a.sender?.kudos ?? 0)
        }[ordering.type];

        return [...filtered].sort((a, b) =>
            ordering.order === 'asc' ? -cmp(a, b) : cmp(a, b)
        );
    }, [flat, activeTab, ordering]);

    if (isLoading) return <Spinner />;
    if (isError)
        return <div className='p-4 text-red-600'>Failed to load posts.</div>;

    return (
        <>
            <PostsContainer posts={visible} showHandshakeShortcut />
            <div className='mt-4 flex justify-center'>
                {hasNextPage && (
                    <button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className='px-4 py-2 rounded bg-gray-200 hover:bg-gray-300'
                    >
                        {isFetchingNextPage ? 'Loading…' : 'Load more'}
                    </button>
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
