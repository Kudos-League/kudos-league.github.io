import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiMutate } from '@/shared/api/apiClient';
import { qkAdmin } from '@/shared/api/queries/admin';
import type { FeedbackKind } from '@/shared/api/types';

type SubmitFeedbackPayload = {
    title: string;
    description: string;
    category: string;
    type: FeedbackKind;
    tags?: string[];
    files?: File[];
};

export function useSubmitFeedbackMutation() {
    return useMutation<void, Error, SubmitFeedbackPayload>({
        mutationFn: (payload) =>
            apiMutate<void, SubmitFeedbackPayload>('/feedback', 'post', payload, { as: 'form' })
    });
}

export function useDeleteFeedbackMutation() {
    const qc = useQueryClient();

    return useMutation<void, Error, { feedbackId: number }>({
        mutationFn: ({ feedbackId }) =>
            apiMutate<void, void>(`/feedback/${feedbackId}`, 'delete'),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: qkAdmin.feedback() });
        }
    });
}

export function useUpdateFeedbackStatusMutation() {
    const qc = useQueryClient();

    return useMutation<void, Error, { feedbackId: number; status: string }>({
        mutationFn: ({ feedbackId, status }) =>
            apiMutate<void, { status: string }>(`/feedback/${feedbackId}`, 'put', { status }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: qkAdmin.feedback() });
        }
    });
}

export function useResolveFeedbackMutation() {
    const qc = useQueryClient();

    return useMutation<void, Error, { feedbackId: number; rewardKudos: number }>({
        mutationFn: ({ feedbackId, rewardKudos }) =>
            apiMutate<void, { rewardKudos: number }>(`/feedback/${feedbackId}/resolve`, 'put', { rewardKudos }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: qkAdmin.feedback() });
        }
    });
}
