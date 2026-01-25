import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { apiGet } from '@/shared/api/apiClient';
import type { PostDTO } from '@/shared/api/types';

export const qk = {
    posts: (filters?: { includeTags?: boolean; includeSender?: boolean }) =>
        ['posts', filters] as const,
    post: (id: number | string) => ['post', id] as const,
    search: (
        query: string,
        filters?: {
            includeTags?: boolean;
            includeSender?: boolean;
            includeImages?: boolean;
        }
    ) => ['postSearch', query, filters] as const,
    postsInfinite: (f?: any) => ['posts', 'infinite', f] as const
};

type CursorPage = { data: PostDTO[]; nextCursor?: number; limit: number };

export type PostsPage = {
    data: PostDTO[];
    nextCursor?: number | null;
    limit: number;
};

export function usePostsQuery(filters?: {
    includeTags?: boolean;
    includeSender?: boolean;
}) {
    return useQuery<PostDTO[]>({
        queryKey: qk.posts(filters),
        queryFn: async () => {
            const page = await apiGet<PostsPage>('/posts', { params: filters });
            return page.data;
        },
        staleTime: 60_000
    });
}

export function useSearchPostsQuery(query: string) {
    const filters = {
        includeTags: true,
        includeSender: true,
        includeImages: true
    };
    return useQuery<PostDTO[]>({
        queryKey: qk.search(query, filters),
        queryFn: () =>
            apiGet<PostDTO[]>('/posts/search', {
                params: { query, ...filters }
            }),
        enabled: query.length >= 2,
        staleTime: 0,
        gcTime: 60_000
    });
}

export function useUserPostsQuery(userId: number | undefined) {
    return useQuery<PostDTO[]>({
        queryKey: ['posts', 'user', userId],
        queryFn: () => apiGet<PostDTO[]>(`/users/${userId}/posts`),
        enabled: !!userId,
        staleTime: 60_000
    });
}

export function usePostQuery(postId: number | string | undefined) {
    return useQuery<PostDTO>({
        queryKey: qk.post(postId!),
        queryFn: () => apiGet<PostDTO>(`/posts/${postId}`),
        enabled: postId !== undefined,
        staleTime: 30_000
    });
}

export function usePostsInfiniteQuery(filters?: {
    includeSender?: boolean;
    includeTags?: boolean;
    includeHandshakes?: boolean;
    includeMessages?: boolean;
    includeRewardOffers?: boolean;
    includeDistance?: boolean;
    limit?: number;
    query?: string;
    sort?: 'date' | 'tags' | 'location' | 'kudos';
    order?: 'asc' | 'desc';
}) {
    return useInfiniteQuery({
        queryKey: ['posts', 'infinite', filters],
        queryFn: ({ pageParam }) =>
            apiGet<CursorPage>('/posts', {
                params: {
                    ...filters,
                    cursor: pageParam ?? undefined,
                    limit: filters?.limit ?? 10
                }
            }),
        initialPageParam: undefined as number | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        staleTime: 60_000,
        gcTime: 0
    });
}
