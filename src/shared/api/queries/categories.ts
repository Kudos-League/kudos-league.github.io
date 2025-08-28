import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/shared/api/apiClient';
import type { CategoryDTO } from '@/shared/api/types';

export const qk = {
    categories: ['categories'] as const,
};

export function useCategories() {
    return useQuery<CategoryDTO[]>({
        queryKey: qk.categories,
        queryFn: () => apiGet<CategoryDTO[]>('/categories'),
        staleTime: 5 * 60 * 1000,
    });
}
