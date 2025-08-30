import { useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';
import { apiMutate } from '@/shared/api/apiClient';
import type {
    CreatePostDTO,
    PostDTO,
    CreateHandshakeDTO,
    UpdatePostDTO
} from '@/shared/api/types';
import { pushAlert } from '@/components/common/alertBus';

type UpdatePayload = { id: number; data: Partial<UpdatePostDTO> };
type LikePayload = { id: number; like: boolean };
type ReportPayload = { id: number; reason: string };

function extractErrMessage(err: any): string {
    if (Array.isArray(err) && err.every((s) => typeof s === 'string')) {
        return err.join(', ');
    }
    return (
        err?.response?.data?.errors?.[0]?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Something went wrong'
    );
}

export function useUpdatePost() {
    const qc = useQueryClient();
    return useMutation<PostDTO, Error, UpdatePayload>({
        mutationFn: ({ id, data }) =>
            apiMutate<PostDTO, Partial<UpdatePostDTO>>(
                `/posts/${id}`,
                'put',
                data,
                { as: 'form' }
            ),
        onSuccess: (updated) => {
            qc.setQueryData<PostDTO[]>(['posts'], (prev) =>
                prev
                    ? prev.map((p) =>
                        p.id === updated.id ? { ...p, ...updated } : p
                    )
                    : prev
            );
            qc.setQueriesData<{
                data: PostDTO[];
                nextCursor?: number;
                limit: number;
            }>({ queryKey: ['posts', 'infinite'] }, (prev) =>
                !prev
                    ? prev
                    : {
                        ...prev,
                        data: prev.data.map((p) =>
                            p.id === updated.id ? { ...p, ...updated } : p
                        )
                    }
            );
            pushAlert({ type: 'success', message: 'Post updated.' });
        },
        onError: (err) => {
            pushAlert({ type: 'danger', message: extractErrMessage(err) });
        }
    });
}

type LikeCtx = {
    prevList: PostDTO[] | undefined;
    prevInfinite: Array<[QueryKey, { data: PostDTO[] } | undefined]>;
};

export function useLikePost() {
    const qc = useQueryClient();
    return useMutation<void, Error, LikePayload, LikeCtx>({
        mutationFn: ({ id, like }) =>
            apiMutate<void, { like: boolean }>(`/posts/${id}/like`, 'post', {
                like
            }),
        onMutate: async ({ id, like }) => {
            const listKey: QueryKey = ['posts'];
            const infiniteFilter = { queryKey: ['posts', 'infinite'] as const };

            const prevList = qc.getQueryData<PostDTO[]>(listKey);
            const prevInfinite = qc.getQueriesData<{ data: PostDTO[] }>(
                infiniteFilter
            );

            qc.setQueryData<PostDTO[]>(listKey, (prev) =>
                prev
                    ? prev.map((p) =>
                        p.id === id ? ({ ...p, liked: like } as any) : p
                    )
                    : prev
            );
            qc.setQueriesData<{ data: PostDTO[] }>(infiniteFilter, (prev) =>
                !prev
                    ? prev
                    : {
                        ...prev,
                        data: prev.data.map((p) =>
                            p.id === id ? ({ ...p, liked: like } as any) : p
                        )
                    }
            );

            return { prevList, prevInfinite };
        },
        onError: (err, _vars, ctx) => {
            if (ctx?.prevList) qc.setQueryData(['posts'], ctx.prevList);
            if (ctx?.prevInfinite) {
                ctx.prevInfinite.forEach(([key, data]) =>
                    qc.setQueryData(key, data)
                );
            }
            pushAlert({ type: 'danger', message: extractErrMessage(err) });
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ['posts'] });
            qc.invalidateQueries({ queryKey: ['posts', 'infinite'] });
        }
    });
}

export function useReportPost() {
    return useMutation<void, Error, ReportPayload>({
        mutationFn: ({ id, reason }) =>
            apiMutate<void, { reason: string }>(`/posts/${id}/report`, 'post', {
                reason
            }),
        onSuccess: () => {
            pushAlert({ type: 'success', message: 'Report submitted.' });
        },
        onError: (err) => {
            pushAlert({ type: 'danger', message: extractErrMessage(err) });
        }
    });
}

export function useCreateHandshake() {
    const qc = useQueryClient();
    return useMutation<{ data: any }, Error, CreateHandshakeDTO>({
        mutationFn: (payload) =>
            apiMutate<{ data: any }, CreateHandshakeDTO>(
                '/handshakes',
                'post',
                payload
            ),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['posts'] });
            qc.invalidateQueries({ queryKey: ['posts', 'infinite'] });
            pushAlert({ type: 'success', message: 'Handshake created.' });
        },
        onError: (err) => {
            pushAlert({ type: 'danger', message: extractErrMessage(err) });
        }
    });
}

export function useCreatePost() {
    const qc = useQueryClient();
    return useMutation<PostDTO, Error, CreatePostDTO>({
        mutationFn: (payload) =>
            apiMutate<PostDTO, CreatePostDTO>('/posts', 'post', payload, {
                as: 'form'
            }),
        onSuccess: (created) => {
            qc.invalidateQueries({ queryKey: ['posts'] });
            qc.setQueryData<PostDTO[]>(['posts'], (prev) =>
                prev ? [created, ...prev] : [created]
            );
            pushAlert({ type: 'success', message: 'Post created.' });
        },
        onError: (err) => {
            pushAlert({ type: 'danger', message: extractErrMessage(err) });
        }
    });
}
