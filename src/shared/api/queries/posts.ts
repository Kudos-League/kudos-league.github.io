import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { apiGet } from '@/shared/api/apiClient';
import type { PostDTO } from '@/shared/api/types';

export const qk = {
    posts: (filters?: { includeTags?: boolean; includeSender?: boolean }) => ['posts', filters] as const,
    search: (query: string) => ['postSearch', query] as const,
};

export type PostsPage = {
  data: PostDTO[];
  nextCursor?: number | null;
  limit: number;
};

export function usePostsQuery(filters?: { includeTags?: boolean; includeSender?: boolean }) {
    return useQuery<PostDTO[]>({
        queryKey: qk.posts(filters),
        queryFn: async () => {
            const page = await apiGet<PostsPage>('/posts', { params: filters });
            return page.data;
        },
        staleTime: 60_000,
    });
}

export function useSearchPostsQuery(query: string) {
    return useQuery<PostDTO[]>({
        queryKey: qk.search(query),
        queryFn: () => apiGet<PostDTO[]>('/posts/search', { params: { query } }),
        enabled: query.length >= 2,
    });
}


export function usePostsInfiniteQuery(filters?: { includeTags?: boolean; includeSender?: boolean; limit?: number }) {
    return useInfiniteQuery<PostsPage>({
        queryKey: qk.posts(filters),
        queryFn: ({ pageParam }) =>
            apiGet<PostsPage>('/posts', {
                params: { ...filters, cursor: pageParam ?? undefined, limit: filters?.limit ?? 10 },
            }),
        initialPageParam: undefined as number | undefined,
        getNextPageParam: (last) => (last.nextCursor ?? undefined),
        staleTime: 60_000,
    });
}
