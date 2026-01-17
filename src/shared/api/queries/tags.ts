import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/shared/api/apiClient';
import type { TopTagDTO } from '@/shared/api/types';

export const qkTags = {
    suggestions: (query: string) => ['tagSuggestions', query] as const,
    top: () => ['topTags'] as const
};

export function useTagSuggestionsQuery(query: string) {
    return useQuery<TopTagDTO[]>({
        queryKey: qkTags.suggestions(query),
        queryFn: async () => {
            const response = await apiGet<{ tags: TopTagDTO[] }>('/tags/top', {
                params: { q: query }
            });
            return response.tags || [];
        },
        enabled: query.length >= 1,
        staleTime: 30_000,
        gcTime: 60_000
    });
}
