import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiMutate } from '@/shared/api/apiClient';
import type { CreatePostDTO, PostDTO } from '@/shared/api/types';

export function useCreatePost() {
    const qc = useQueryClient();
    return useMutation<PostDTO, string[], CreatePostDTO>({
        mutationFn: (payload) =>
            apiMutate<PostDTO, CreatePostDTO>('/posts', 'post', payload, {
                as: 'form'
            }),
        onSuccess: (created) => {
            qc.invalidateQueries({ queryKey: ['posts'] });
            qc.setQueryData<PostDTO[]>(['posts'], (prev) =>
                prev ? [created, ...prev] : [created]
            );
        }
    });
}
