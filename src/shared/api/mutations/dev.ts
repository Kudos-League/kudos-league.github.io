import { useMutation } from '@tanstack/react-query';
import { apiMutate, apiGet } from '@/shared/api/apiClient';
import type { PostDTO } from '@/shared/api/types';
import { pushAlert } from '@/components/common/alertBus';

export function useCreateRandomPosts() {
    return useMutation<
        { count: number; posts: PostDTO[] },
        Error,
        {
            count?: number;
            categoryId?: number;
            includeImages?: boolean;
            includeDescription?: boolean;
            userId?: number;
            imageCount?: number;
            includeLocation?: boolean;
            locationMode?: 'user' | 'random';
            userLocation?: any;
        }
    >({
        mutationFn: (payload) =>
            apiMutate('/dev/posts/create-random', 'post', payload),
        onSuccess: (data) => {
            pushAlert({
                type: 'success',
                message: `Created ${data.count} random post${data.count !== 1 ? 's' : ''}`
            });
        },
        onError: (err: any) => {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to create random posts';
            pushAlert({ type: 'danger', message });
        }
    });
}

export function useListDevPosts() {
    return useMutation<any[], Error, void>({
        mutationFn: () => apiGet('/dev/posts'),
        onError: (err: any) => {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to load posts';
            pushAlert({ type: 'danger', message });
        }
    });
}

export function useCreatePostAsUser() {
    return useMutation<
        PostDTO,
        Error,
        {
            title: string;
            body: string;
            categoryID: number;
            type: 'request' | 'gift';
            userId: number;
            files?: File[];
            location?: any;
            tags?: string[];
        }
    >({
        mutationFn: (payload) =>
            apiMutate<PostDTO, any>('/dev/posts/as-user', 'post', payload, {
                as: 'form'
            }),
        onSuccess: () => {
            pushAlert({
                type: 'success',
                message: 'Post created successfully'
            });
        },
        onError: (err: any) => {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to create post';
            pushAlert({ type: 'danger', message });
        }
    });
}
